import express from 'express';
import { query, queryOne, execute, executeWithId } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendAnniversaryEmail, sendBookingConfirmationEmail, sendBookingApprovalEmail } from '../services/emailService.js';
import { validateBooking, validateBookingStatus } from '../middleware/validator.js';

const router = express.Router();

// Get all bookings (staff/admin only)
router.get('/', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const bookings = await query(`
      SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM Bookings b
      JOIN Customers c ON b.customer_id = c.id
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
      SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM Bookings b
      JOIN Customers c ON b.customer_id = c.id
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
router.post('/', validateBooking, async (req, res) => {
  try {
    const { name, email, phone, event_type, event_date, number_of_guests, budget, preferred_package, additional_requests, selected_menu_items } = req.body;

    // Create or find customer
    let customer = await queryOne('SELECT id FROM Customers WHERE email = ?', [email]);
    let customerId;

    if (customer) {
      customerId = customer.id;
    } else {
      customerId = await executeWithId(
        'INSERT INTO Customers (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone]
      );
    }

    // Generate unique booking reference
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const bookingRef = `FMG-${Date.now()}-${randomStr}`;

    // Calculate total based on menu items or budget
    let totalAmount = budget;
    if (selected_menu_items && selected_menu_items.length > 0) {
      const itemsTotal = selected_menu_items.reduce((sum, item) => sum + (item.price || 0), 0);
      totalAmount = itemsTotal * number_of_guests;
    }

    // Create booking with default payment fields
    const bookingId = await executeWithId(
      'INSERT INTO Bookings (customer_id, event_type, event_date, number_of_guests, budget, preferred_package, additional_requests, booking_ref, payment_type, down_payment_amount, total_amount, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customerId, event_type, event_date, number_of_guests, budget, preferred_package, additional_requests, bookingRef, 'full', 0, totalAmount, 'pending']
    );

    // Store menu items as JSON in additional_requests for now
    if (selected_menu_items && selected_menu_items.length > 0) {
      const menuJson = JSON.stringify(selected_menu_items);
      await execute(
        'UPDATE Bookings SET additional_requests = ? WHERE id = ?',
        [`${additional_requests || ''} | MENU: ${menuJson}`, bookingId]
      );
    }

    // Send booking confirmation email (async, non-blocking)
    if (email && name) {
      sendBookingConfirmationEmail(name, email, bookingRef, event_type, event_date)
        .catch(emailError => {
          console.error('Failed to send booking confirmation email:', emailError);
        });
    }

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
    
    // Get booking details before updating
    const booking = await queryOne(`
      SELECT b.*, c.name as customer_name, c.email as customer_email
      FROM Bookings b
      JOIN Customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `, [req.params.id]);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Update booking status
    await execute(
      'UPDATE Bookings SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    // Send booking approval email when booking is approved (async, non-blocking)
    if (status === 'approved') {
      if (booking.customer_email && booking.customer_name) {
        sendBookingApprovalEmail(
          booking.customer_name,
          booking.customer_email,
          booking.booking_ref,
          booking.event_type,
          booking.event_date
        ).catch(emailError => {
          console.error('Failed to send booking approval email:', emailError);
        });
      } else {
        console.warn('Missing customer information for approval email, skipping email send');
      }
    }

    // Send anniversary email immediately when booking is completed (for testing)
    if (status === 'completed') {
      console.log('Sending anniversary email for booking:', booking.booking_ref);
      console.log('Customer email:', booking.customer_email);
      console.log('Customer name:', booking.customer_name);
      
      // Send email asynchronously - don't let email failure block the status update
      if (booking.customer_email && booking.customer_name) {
        sendAnniversaryEmail(
          booking.customer_name,
          booking.customer_email,
          booking.event_type,
          booking.event_date
        ).catch(emailError => {
          console.error('Failed to send anniversary email:', emailError);
        });
      } else {
        console.warn('Missing customer information for email, skipping email send');
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update booking status' });
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
