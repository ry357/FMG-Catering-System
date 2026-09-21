import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { queryOne, execute, executeWithId } from '../config/dbHelper.js';
import { sendCustomerOtpEmail } from '../services/emailService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store the OTP as an HMAC digest, never in plaintext.
function hashOTP(otp) {
  return crypto.createHmac('sha256', JWT_SECRET).update(otp).digest('hex');
}

function issueCustomerToken(customer) {
  return jwt.sign(
    { id: customer.id, email: customer.email, name: customer.name, type: 'customer' },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}

function serializeCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    avatar: customer.avatar || '',
  };
}

// ── Register — email + password ────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters and include letters, numbers, and a special character',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await queryOne('SELECT * FROM Customers WHERE email = ?', [normalizedEmail]);

    if (existing && existing.password_hash) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists. Please log in.' });
    }

    if (existing) {
      // Google-created customer is setting a password for the first time.
      const hashed = await bcrypt.hash(String(password), 10);
      await execute(
        'UPDATE Customers SET name = ?, password_hash = ? WHERE id = ?',
        [String(name || existing.name).trim(), hashed, existing.id]
      );
      const updated = await queryOne('SELECT * FROM Customers WHERE id = ?', [existing.id]);
      const token = issueCustomerToken(updated);
      return res.status(201).json({ success: true, token, customer: serializeCustomer(updated) });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const customerId = await executeWithId(
      'INSERT INTO Customers (name, email, password_hash) VALUES (?, ?, ?)',
      [String(name || normalizedEmail.split('@')[0]).trim(), normalizedEmail, hashed]
    );
    const customer = await queryOne('SELECT * FROM Customers WHERE id = ?', [customerId]);
    const token = issueCustomerToken(customer);

    res.status(201).json({ success: true, token, customer: serializeCustomer(customer) });
  } catch (error) {
    console.error('Customer register error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ── Login — email + password ───────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const customer = await queryOne('SELECT * FROM Customers WHERE email = ?', [normalizedEmail]);

    if (!customer || !customer.password_hash) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(String(password), customer.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = issueCustomerToken(customer);
    res.json({ success: true, token, customer: serializeCustomer(customer) });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ── OTP send — email code login ────────────────────────────────
router.post('/otp/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    let customer = await queryOne('SELECT * FROM Customers WHERE email = ?', [normalizedEmail]);

    if (!customer) {
      const customerId = await executeWithId(
        'INSERT INTO Customers (name, email) VALUES (?, ?)',
        [normalizedEmail.split('@')[0], normalizedEmail]
      );
      customer = { id: customerId, name: normalizedEmail.split('@')[0], email: normalizedEmail };
    }

    const otp = generateOTP();
    const otpId = crypto.randomUUID();

    await execute('DELETE FROM CustomerOtpSessions WHERE customer_id = ?', [customer.id]);
    await executeWithId(
      'INSERT INTO CustomerOtpSessions (id, customer_id, otp_hash, expires_at) VALUES (?, ?, ?, ?)',
      [otpId, customer.id, hashOTP(otp), new Date(Date.now() + OTP_TTL_MS).toISOString()]
    );

    const result = await sendCustomerOtpEmail(customer.email, otp);
    if (!result.success) {
      return res.status(500).json({ success: false, error: 'Failed to send verification code. Please try again.' });
    }

    res.json({ success: true, otpId, message: `Verification code sent to ${customer.email}` });
  } catch (error) {
    console.error('Customer OTP send error:', error);
    res.status(500).json({ success: false, error: 'Failed to send verification code' });
  }
});

// ── OTP verify — complete email login ──────────────────────────
router.post('/otp/verify', async (req, res) => {
  try {
    const { otpId, otp } = req.body;

    if (!otpId || !otp) {
      return res.status(400).json({ success: false, error: 'Missing otpId or otp' });
    }

    const otpData = await queryOne('SELECT * FROM CustomerOtpSessions WHERE id = ?', [otpId]);
    if (!otpData) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification session' });
    }

    if (Date.now() > new Date(otpData.expires_at).getTime()) {
      await execute('DELETE FROM CustomerOtpSessions WHERE id = ?', [otpId]);
      return res.status(400).json({ success: false, error: 'Verification code has expired' });
    }

    const newAttempts = otpData.attempts + 1;
    if (newAttempts > OTP_MAX_ATTEMPTS) {
      await execute('DELETE FROM CustomerOtpSessions WHERE id = ?', [otpId]);
      return res.status(400).json({ success: false, error: 'Too many attempts. Please request a new code.' });
    }

    if (hashOTP(String(otp)) !== otpData.otp_hash) {
      await execute('UPDATE CustomerOtpSessions SET attempts = ? WHERE id = ?', [newAttempts, otpId]);
      return res.json({ success: false, message: 'Incorrect code. Please try again.' });
    }

    await execute('DELETE FROM CustomerOtpSessions WHERE id = ?', [otpId]);

    const customer = await queryOne('SELECT * FROM Customers WHERE id = ?', [otpData.customer_id]);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    const token = issueCustomerToken(customer);
    res.json({ success: true, token, customer: serializeCustomer(customer) });
  } catch (error) {
    console.error('Customer OTP verify error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify code' });
  }
});

// ── Verify token ───────────────────────────────────────────────
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(403).json({ success: false, error: 'Not a customer token' });
    }

    const customer = await queryOne(
      'SELECT id, name, email, avatar FROM Customers WHERE id = ?',
      [decoded.id]
    );
    if (!customer) return res.status(404).json({ success: false, error: 'Account not found' });
    res.json({ success: true, customer });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

export default router;