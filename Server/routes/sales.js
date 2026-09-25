import express from 'express';
import { query, queryOne, execute, executeWithId } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/activityLogService.js';

const router = express.Router();

// Get all sales (staff/admin only)
router.get('/', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const sales = await query(`
      SELECT s.*, b.event_type, b.event_date, c.name as customer_name, c.address as customer_address
      FROM Sales s
      JOIN Bookings b ON s.booking_id = b.id
      JOIN Customers c ON b.customer_id = c.id
      ORDER BY s.sale_date DESC
    `);
    res.json({ success: true, sales });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales' });
  }
});

// Get sales by date range
router.get('/analytics', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let sql = `
      SELECT s.*, b.event_type, b.event_date, c.name as customer_name, c.address as customer_address
      FROM Sales s
      JOIN Bookings b ON s.booking_id = b.id
      JOIN Customers c ON b.customer_id = c.id
      WHERE s.payment_status = 'completed'
    `;
    const params = [];

    if (start_date) {
      sql += ' AND s.sale_date >= $' + (params.length + 1);
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND s.sale_date <= $' + (params.length + 1);
      params.push(end_date);
    }

    sql += ' ORDER BY s.sale_date DESC';

    const sales = await query(sql, params);

    // Calculate totals
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0);
    const totalSales = sales.length;

    res.json({ success: true, sales, totalRevenue, totalSales });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales analytics' });
  }
});

// Create sale record
router.post('/', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const { booking_id, amount, payment_method, payment_status } = req.body;

    const saleId = await executeWithId(
      'INSERT INTO Sales (booking_id, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)',
      [booking_id, amount, payment_method, payment_status]
    );

    await logActivity({
      action: 'sale_recorded',
      category: 'sales',
      description: `Sale recorded for Booking #${booking_id} — ₱${Number(amount).toLocaleString()} via ${payment_method || 'N/A'} (${payment_status})`,
      performed_by: req.user?.username || req.user?.email || 'staff',
      details: { saleId, booking_id, amount, payment_method, payment_status },
    });

    res.json({ success: true, saleId });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ success: false, error: 'Failed to create sale record' });
 }
});

// Update sale status
router.patch('/:id/status', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const { payment_status } = req.body;

    if (!['pending', 'completed', 'failed', 'refunded'].includes(payment_status)) {
      return res.status(400).json({ success: false, error: 'Invalid payment status' });
    }

    await execute(
      'UPDATE Sales SET payment_status = ? WHERE id = ?',
      [payment_status, req.params.id]
    );

    await logActivity({
      action: 'sale_status_updated',
      category: 'sales',
      description: `Sale #${req.params.id} payment status changed to "${payment_status}"`,
      performed_by: req.user?.username || req.user?.email || 'staff',
      details: { saleId: req.params.id, payment_status },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update sale status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update sale status' });
  }
});

// Update sale record (staff/admin)
router.put('/:id', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const { amount, payment_method, payment_status } = req.body || {};

    if (payment_status !== undefined && !['pending', 'completed', 'failed', 'refunded'].includes(payment_status)) {
      return res.status(400).json({ success: false, error: 'Invalid payment status' });
    }

    await execute(
      'UPDATE Sales SET amount = ?, payment_method = ?, payment_status = ? WHERE id = ?',
      [amount ?? null, payment_method ?? null, payment_status ?? null, req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ success: false, error: 'Failed to update sale record' });
  }
});

export default router;
