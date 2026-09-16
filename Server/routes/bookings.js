import express from 'express';
import { query, queryOne, execute } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateBooking, validateBookingStatus } from '../middleware/validator.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';
import { createBooking, transitionStatus } from '../services/bookingService.js';

const bookingsSelect = `
      SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address
      FROM Bookings b
      JOIN Customers c ON b.customer_id = c.id
    `;

const router = express.Router();

// Get all bookings (staff/admin only)
router.get('/', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const bookings = await query(`
      ${bookingsSelect}
      ORDER BY b.created_at DESC
    `);
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// Get single booking
router.get('/:id', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const booking = await queryOne(`
      ${bookingsSelect}
      WHERE b.id = ?
    `, [req.params.id]);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});

// Create new booking (public)
router.post('/', bookingLimiter, validateBooking, async (req, res) => {
  try {
    const {
      name, email, phone, address, event_type, event_date, number_of_guests, budget,
      preferred_package, additional_requests, selected_menu_items, menu_preference,
      booking_category, total_amount,
    } = req.body;

    const { bookingId, bookingRef } = await createBooking({
      name,
      email,
      phone,
      address,
      event_type,
      event_date,
      number_of_guests,
      budget,
      preferred_package,
      additional_requests,
      selected_menu_items,
      menu_preference,
      booking_category,
      total_amount,
    });

    res.json({ success: true, bookingId, bookingRef });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// Update booking status (staff/admin only)
router.patch('/:id/status', authenticateToken, requireRole(['staff', 'admin']), validateBookingStatus, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await transitionStatus(req.params.id, status);
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to update booking status',
    });
  }
});

// Delete booking (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await execute('DELETE FROM Bookings WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete booking' });
  }
});

export default router;