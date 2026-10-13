import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { queryOne, query, execute, executeWithId } from '../config/dbHelper.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validator.js';
import { logActivity } from '../services/activityLogService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_EMAIL = 'sasumanryan74@gmail.com';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store the OTP as an HMAC digest, never in plaintext.
function hashOTP(otp) {
  return crypto.createHmac('sha256', JWT_SECRET).update(otp).digest('hex');
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

async function sendOTP(email, otp, title = 'Verification') {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'FMG Catering Services <fmgcateringservices@gmail.com>',
    to: email,
    subject: `FMG Catering — ${title} Login OTP`,
    text: `Your FMG Catering ${title.toLowerCase()} login OTP is: ${otp}\n\nThis code expires in 5 minutes.\nIf you did not request this, please ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <h2 style="color:#B8921F;">FMG Catering</h2>
      <p>Your ${title.toLowerCase()} login verification code is:</p>
      <div style="font-size:32px;font-weight:bold;color:#1C1C1C;letter-spacing:8px;margin:20px 0;">${otp}</div>
      <p>This code expires in 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>`,
  };
  await transporter.sendMail(mailOptions);
}

// Persist an OTP for later verification. Works across serverless instances.
async function saveOtp({ otpId, userId, otp }) {
  await execute(
    'DELETE FROM OtpSessions WHERE user_id = ?',
    [userId]
  );
  await executeWithId(
    'INSERT INTO OtpSessions (id, user_id, otp_hash, expires_at) VALUES (?, ?, ?, ?)',
    [otpId, userId, hashOTP(otp), new Date(Date.now() + OTP_TTL_MS).toISOString()]
  );
}

// ── Admin Login — sends OTP instead of returning token ────────
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await queryOne(
      'SELECT id, username, email, password_hash, role, full_name FROM Users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Both Admin and Staff (Booking Manager) require OTP
    if (user.role === 'admin' || user.role === 'staff') {
      const otp = generateOTP();
      const otpId = crypto.randomUUID();
      await saveOtp({ otpId, userId: user.id, otp });

      const targetEmail = user.role === 'admin'
        ? (process.env.ADMIN_EMAIL || user.email || ADMIN_EMAIL)
        : user.email;
      const title = user.role === 'admin' ? 'Admin' : 'Booking Manager';
      await sendOTP(targetEmail, otp, title);

      return res.json({
        success: true,
        requiresOtp: true,
        otpId,
        message: `OTP required for ${title.toLowerCase()} login`,
        username: user.username,
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await logActivity({
      action: 'user_login',
      category: 'auth',
      description: `User "${user.username}" signed in`,
      performed_by: user.username,
      details: { userId: user.id, role: user.role, email: user.email },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Send OTP (for admin and booking manager login)
router.post('/otp/send', async (req, res) => {
  try {
    const { username } = req.body;

    const user = await queryOne(
      'SELECT id, username, email, password_hash, role FROM Users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user || !['admin', 'staff'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const otp = generateOTP();
    const otpId = crypto.randomUUID();
    await saveOtp({ otpId, userId: user.id, otp });

    const targetEmail = user.role === 'admin'
      ? (process.env.ADMIN_EMAIL || user.email || ADMIN_EMAIL)
      : user.email;
    const title = user.role === 'admin' ? 'Admin' : 'Booking Manager';
    await sendOTP(targetEmail, otp, title);

    res.json({
      success: true,
      otpId,
      message: `OTP sent to ${targetEmail}`,
    });
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// Verify OTP and complete login
router.post('/otp/verify', async (req, res) => {
  try {
    const { otpId, otp } = req.body;

    if (!otpId || !otp) {
      return res.status(400).json({ success: false, error: 'Missing otpId or otp' });
    }

    const otpData = await queryOne('SELECT * FROM OtpSessions WHERE id = ?', [otpId]);
    if (!otpData) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP session' });
    }

    if (Date.now() > new Date(otpData.expires_at).getTime()) {
      await execute('DELETE FROM OtpSessions WHERE id = ?', [otpId]);
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }

    const newAttempts = otpData.attempts + 1;
    if (newAttempts > OTP_MAX_ATTEMPTS) {
      await execute('DELETE FROM OtpSessions WHERE id = ?', [otpId]);
      return res.status(400).json({ success: false, error: 'Too many attempts. Please request a new OTP.' });
    }

    if (hashOTP(otp) !== otpData.otp_hash) {
      await execute('UPDATE OtpSessions SET attempts = ? WHERE id = ?', [newAttempts, otpId]);
      return res.status(400).json({ success: false, error: 'Incorrect OTP. Please try again.' });
    }

    // OTP verified — consume it and create JWT token
    await execute('DELETE FROM OtpSessions WHERE id = ?', [otpId]);

    const user = await queryOne(
      'SELECT id, username, email, role, full_name FROM Users WHERE id = ?',
      [otpData.user_id]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const roleLabel = user.role === 'admin' ? 'Admin' : 'Booking Manager';
    await logActivity({
      action: 'user_login',
      category: 'auth',
      description: `${roleLabel} "${user.username}" signed in via OTP`,
      performed_by: user.username,
      details: { userId: user.id, role: user.role, email: user.email },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

// Verify Token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await queryOne('SELECT id, username, email, role, full_name FROM Users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Current user profile (staff/admin)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, username, email, role, full_name FROM Users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch current user' });
  }
});

export default router;