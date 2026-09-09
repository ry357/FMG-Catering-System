import express from 'express';
import bcrypt from 'bcrypt';
import { query, queryOne, execute, executeWithId } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateUserCreation } from '../middleware/validator.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await query(
      'SELECT id, username, email, role, full_name, created_at FROM Users ORDER BY created_at DESC'
    );
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, requireRole(['admin']), validateUserCreation, async (req, res) => {
  try {
    const { username, email, password, role, full_name } = req.body;

    const password_hash = await bcrypt.hash(password, 10);

    const userId = await executeWithId(
      'INSERT INTO Users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)',
      [username, email, password_hash, role, full_name]
    );

    res.json({ success: true, userId });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Update user (admin only)
const updateUserHandler = async (req, res) => {
  try {
    const { username, email, role, full_name } = req.body;

    if (!['staff', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    await execute(
      'UPDATE Users SET username = ?, email = ?, role = ?, full_name = ? WHERE id = ?',
      [username, email, role, full_name, req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

router.patch('/:id', authenticateToken, requireRole(['admin']), updateUserHandler);
router.put('/:id', authenticateToken, requireRole(['admin']), updateUserHandler);

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await execute('DELETE FROM Users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Change password (self)
router.patch('/password/change', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }

    const user = await queryOne(
      'SELECT password_hash FROM Users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await execute(
      'UPDATE Users SET password_hash = ? WHERE id = ?',
      [password_hash, req.user.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

export default router;
