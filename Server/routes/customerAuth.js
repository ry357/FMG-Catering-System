import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { queryOne, execute, executeWithId } from '../config/dbHelper.js';
import { sendCustomerOtpEmail } from '../services/emailService.js';
import { logActivity } from '../services/activityLogService.js';

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
    password.length >= 16 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}

function parseSavedAddresses(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    avatar: customer.avatar || '',
    phone: customer.phone || '',
    address: customer.address || '',
    saved_addresses: parseSavedAddresses(customer.saved_addresses),
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
        error: 'Password must be at least 16 characters and include letters, numbers, and a special character',
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

      await logActivity({
        action: 'customer_register',
        category: 'auth',
        description: `Customer "${updated.name}" registered (linked existing account)`,
        performed_by: updated.email,
        details: { customerId: updated.id, method: 'email_password' },
      });

      return res.status(201).json({ success: true, token, customer: serializeCustomer(updated) });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const customerId = await executeWithId(
      'INSERT INTO Customers (name, email, password_hash) VALUES (?, ?, ?)',
      [String(name || normalizedEmail.split('@')[0]).trim(), normalizedEmail, hashed]
    );
    const customer = await queryOne('SELECT * FROM Customers WHERE id = ?', [customerId]);
    const token = issueCustomerToken(customer);

    await logActivity({
      action: 'customer_register',
      category: 'auth',
      description: `New customer "${customer.name}" registered`,
      performed_by: customer.email,
      details: { customerId: customer.id, method: 'email_password' },
    });

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

    await logActivity({
      action: 'customer_login',
      category: 'auth',
      description: `Customer "${customer.name}" logged in via email/password`,
      performed_by: customer.email,
      details: { customerId: customer.id, method: 'email_password' },
    });

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

    await logActivity({
      action: 'customer_login',
      category: 'auth',
      description: `Customer "${customer.name}" logged in via email OTP`,
      performed_by: customer.email,
      details: { customerId: customer.id, method: 'email_otp' },
    });

    res.json({ success: true, token, customer: serializeCustomer(customer) });
  } catch (error) {
    console.error('Customer OTP verify error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify code' });
  }
});

// ── Middleware: customer auth ────────────────────────────────
export async function authenticateCustomer(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Customer token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(403).json({ success: false, error: 'Not a customer token' });
    }

    const customer = await queryOne('SELECT * FROM Customers WHERE id = ?', [decoded.id]);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    req.customer = customer;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired customer token' });
  }
}

// ── Verify token ───────────────────────────────────────────────
router.get('/verify', authenticateCustomer, async (req, res) => {
  res.json({ success: true, customer: serializeCustomer(req.customer) });
});

// ── Get Customer Profile ──────────────────────────────────────
router.get('/profile', authenticateCustomer, async (req, res) => {
  res.json({ success: true, customer: serializeCustomer(req.customer) });
});

// ── Update Customer Profile (name, phone, address) ─────────────
router.put('/profile', authenticateCustomer, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const customerId = req.customer.id;

    const updatedName = (name !== undefined ? String(name).trim() : req.customer.name) || req.customer.name;
    const updatedPhone = phone !== undefined ? String(phone).trim() : (req.customer.phone || '');
    const updatedAddress = address !== undefined ? String(address).trim() : (req.customer.address || '');

    await execute(
      'UPDATE Customers SET name = ?, phone = ?, address = ? WHERE id = ?',
      [updatedName, updatedPhone, updatedAddress, customerId]
    );

    const updated = await queryOne('SELECT * FROM Customers WHERE id = ?', [customerId]);
    res.json({ success: true, customer: serializeCustomer(updated), message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// ── Get Customer Bookings (Order & Event History) ───────────────
router.get('/bookings', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;

    // Fetch customer bookings with aggregated payments from Sales table
    const rows = await query(
      `SELECT
         b.id, b.booking_ref, b.event_type, b.event_date, b.number_of_guests,
         b.budget, b.preferred_package, b.additional_requests, b.menu_items,
         b.menu_preference, b.booking_category, b.status, b.payment_status,
         b.payment_type, b.down_payment_amount, b.total_amount, b.created_at,
         c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
         c.address as customer_address,
         (SELECT COALESCE(SUM(s.amount), 0) FROM Sales s
           WHERE s.booking_id = b.id AND s.payment_status = 'completed') AS amount_paid
       FROM Bookings b
       JOIN Customers c ON b.customer_id = c.id
       WHERE b.customer_id = ?
       ORDER BY b.created_at DESC`,
      [customerId]
    );

    const bookings = rows.map((b) => {
      let menuPreference = null;
      let menuItems = null;
      try {
        menuPreference = b.menu_preference ? JSON.parse(b.menu_preference) : null;
      } catch {
        menuPreference = b.menu_preference;
      }
      try {
        menuItems = b.menu_items ? JSON.parse(b.menu_items) : null;
      } catch {
        menuItems = b.menu_items;
      }

      const totalAmount = Number(b.total_amount || 0);
      const amountPaid = Number(b.amount_paid || 0);
      const balanceDue = Math.max(0, totalAmount - amountPaid);

      return {
        ...b,
        event_date: b.event_date ? String(b.event_date).slice(0, 10) : null,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        menu_preference: menuPreference,
        menu_items: menuItems,
      };
    });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Fetch customer bookings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer bookings' });
  }
});

// ── Manage Saved Delivery Addresses ───────────────────────────
// Save / Update delivery address
router.post('/addresses', authenticateCustomer, async (req, res) => {
  try {
    const { label, address, contactPerson, contactPhone, isDefault } = req.body;
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, error: 'Address is required' });
    }

    const customerId = req.customer.id;
    let addresses = parseSavedAddresses(req.customer.saved_addresses);

    const newAddress = {
      id: crypto.randomUUID(),
      label: label?.trim() || 'Venue',
      address: address.trim(),
      contactPerson: contactPerson?.trim() || req.customer.name,
      contactPhone: contactPhone?.trim() || req.customer.phone || '',
      isDefault: Boolean(isDefault) || addresses.length === 0,
      createdAt: new Date().toISOString(),
    };

    if (newAddress.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    }

    addresses.push(newAddress);

    await execute('UPDATE Customers SET saved_addresses = ? WHERE id = ?', [
      JSON.stringify(addresses),
      customerId,
    ]);

    const updated = await queryOne('SELECT * FROM Customers WHERE id = ?', [customerId]);
    res.json({
      success: true,
      saved_addresses: parseSavedAddresses(updated.saved_addresses),
      message: 'Address saved successfully',
    });
  } catch (error) {
    console.error('Save address error:', error);
    res.status(500).json({ success: false, error: 'Failed to save address' });
  }
});

// Delete saved address
router.delete('/addresses/:addressId', authenticateCustomer, async (req, res) => {
  try {
    const { addressId } = req.params;
    const customerId = req.customer.id;
    let addresses = parseSavedAddresses(req.customer.saved_addresses);

    const wasDefault = addresses.find((a) => a.id === addressId)?.isDefault;
    addresses = addresses.filter((a) => a.id !== addressId);

    if (wasDefault && addresses.length > 0) {
      addresses[0].isDefault = true;
    }

    await execute('UPDATE Customers SET saved_addresses = ? WHERE id = ?', [
      JSON.stringify(addresses),
      customerId,
    ]);

    const updated = await queryOne('SELECT * FROM Customers WHERE id = ?', [customerId]);
    res.json({
      success: true,
      saved_addresses: parseSavedAddresses(updated.saved_addresses),
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
});

// Set default address
router.patch('/addresses/:addressId/default', authenticateCustomer, async (req, res) => {
  try {
    const { addressId } = req.params;
    const customerId = req.customer.id;
    let addresses = parseSavedAddresses(req.customer.saved_addresses);

    addresses = addresses.map((a) => ({
      ...a,
      isDefault: a.id === addressId,
    }));

    await execute('UPDATE Customers SET saved_addresses = ? WHERE id = ?', [
      JSON.stringify(addresses),
      customerId,
    ]);

    const updated = await queryOne('SELECT * FROM Customers WHERE id = ?', [customerId]);
    res.json({
      success: true,
      saved_addresses: parseSavedAddresses(updated.saved_addresses),
      message: 'Default address updated',
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ success: false, error: 'Failed to set default address' });
  }
});

export default router;