import express from 'express';
import { query, queryOne } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rule-based customer segment derived from booking history.
function classifyCustomer(bookingsCount) {
  if (bookingsCount >= 2) return 'returning';
  if (bookingsCount === 1) return 'new';
  return 'no_bookings';
}

// List customers with booking aggregates (staff/admin)
router.get('/', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        c.id, c.name, c.email, c.phone, c.address, c.created_at,
        (SELECT COUNT(*) FROM Bookings b WHERE b.customer_id = c.id) AS bookings_count,
        (SELECT COUNT(*) FROM Bookings b WHERE b.customer_id = c.id AND b.status = 'completed') AS completed_count,
        (SELECT COALESCE(SUM(s.amount), 0)
           FROM Sales s JOIN Bookings b ON s.booking_id = b.id
          WHERE b.customer_id = c.id AND s.payment_status = 'completed') AS total_spent,
        (SELECT MAX(b.event_date) FROM Bookings b WHERE b.customer_id = c.id) AS last_event_date
      FROM Customers c
      ORDER BY c.created_at DESC
    `);

    const customers = rows.map((row) => {
      const bookingsCount = Number(row.bookings_count || 0);
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        created_at: row.created_at,
        bookings_count: bookingsCount,
        completed_count: Number(row.completed_count || 0),
        total_spent: Number(row.total_spent || 0),
        last_event_date: row.last_event_date ? String(row.last_event_date).slice(0, 10) : null,
        segment: classifyCustomer(bookingsCount),
      };
    });

    const summary = {
      total: customers.length,
      returning: customers.filter((c) => c.segment === 'returning').length,
      new: customers.filter((c) => c.segment === 'new').length,
      noBookings: customers.filter((c) => c.segment === 'no_bookings').length,
      lifetimeRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
    };

    res.json({ success: true, customers, summary });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// Single customer with full booking history (staff/admin)
router.get('/:id', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const customer = await queryOne(
      'SELECT id, name, email, phone, address, created_at FROM Customers WHERE id = ?',
      [req.params.id]
    );
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const bookings = await query(
      `SELECT
         b.id, b.booking_ref, b.event_type, b.event_date, b.number_of_guests,
         b.preferred_package, b.booking_category, b.status, b.payment_status,
         b.total_amount, b.created_at,
         (SELECT COALESCE(SUM(s.amount), 0) FROM Sales s
           WHERE s.booking_id = b.id AND s.payment_status = 'completed') AS amount_paid
       FROM Bookings b
       WHERE b.customer_id = ?
       ORDER BY b.event_date DESC`,
      [req.params.id]
    );

    const normalized = bookings.map((b) => ({
      ...b,
      event_date: b.event_date ? String(b.event_date).slice(0, 10) : null,
      total_amount: Number(b.total_amount || 0),
      amount_paid: Number(b.amount_paid || 0),
    }));

    res.json({
      success: true,
      customer: {
        ...customer,
        bookings_count: normalized.length,
        total_spent: normalized.reduce((sum, b) => sum + b.amount_paid, 0),
        segment: classifyCustomer(normalized.length),
      },
      bookings: normalized,
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

export default router;
