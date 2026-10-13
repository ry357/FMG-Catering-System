import { Router } from 'express';
import {
  createGCashCheckout,
  verifyGCashPayment,
} from '../services/paymentProviders.js';
import { query, queryOne, execute } from '../config/dbHelper.js';
import { validatePayment } from '../middleware/validator.js';
import { createBooking } from '../services/bookingService.js';
import { logActivity } from '../services/activityLogService.js';

const router = Router();

router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      gcashEnabled: Boolean(process.env.PAYMONGO_SECRET_KEY),
    },
  });
});

// Create booking and payment session
router.post('/gcash/create-checkout', validatePayment, async (req, res, next) => {
  try {
    const { amount, bookingRef, customerName, customerEmail, description, bookingData = {}, paymentType = 'full' } = req.body;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const downPaymentAmount = paymentType === 'down_payment' ? Number(amount) : 0;

    // Booking creation is delegated to the shared service so the public POST
    // /api/bookings and this payment path always behave identically.
    const { bookingId, bookingRef: ref } = await createBooking({
      name: customerName,
      email: customerEmail,
      phone: bookingData.contactNumber,
      address: bookingData.address,
      event_type: bookingData.eventType,
      event_date: bookingData.eventDate,
      number_of_guests: bookingData.numberOfGuests,
      budget: bookingData.budget === undefined || bookingData.budget === '' ? null : bookingData.budget,
      preferred_package: bookingData.preferredPackageId || bookingData.offerId || null,
      additional_requests: bookingData.additionalRequests,
      selected_menu_items: bookingData.selectedMenuItems,
      menu_preference: bookingData.menuPreference,
      booking_category: bookingData.bookingCategory,
      total_amount: bookingData.totalAmount,
      payment_type: paymentType,
      down_payment_amount: downPaymentAmount,
      booking_ref: bookingRef,
    });

    // Create PayMongo checkout session
    const checkout = await createGCashCheckout({
      amount: Number(amount),
      bookingRef: ref,
      customerName,
      customerEmail,
      description: description || 'FMG Catering booking deposit',
      successUrl: `${clientUrl}/payment/success?method=gcash&ref=${ref}`,
      cancelUrl: `${clientUrl}/payment/cancel?method=gcash&ref=${ref}`,
    });

    // Create pending sale record
    await execute(
      `INSERT INTO Sales (booking_id, amount, payment_method, payment_status, transaction_id, payment_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bookingId, Number(amount), 'gcash', 'pending', checkout.sessionId, paymentType]
    );

    await logActivity({
      action: 'booking_created',
      category: 'bookings',
      description: `New booking submitted by ${customerName} (${customerEmail}) for ${bookingData.eventType || 'Event'} on ${bookingData.eventDate || 'N/A'} — Ref: ${ref}`,
      performed_by: customerEmail,
      details: { bookingId, bookingRef: ref, event_type: bookingData.eventType, event_date: bookingData.eventDate, amount: Number(amount) },
    });

    res.json({
      success: true,
      data: {
        ...checkout,
        bookingId,
        bookingRef: ref
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/gcash/verify/:sessionId', async (req, res, next) => {
  try {
    const result = await verifyGCashPayment(req.params.sessionId);

    // Update sale and booking records if payment is successful
    if (result.paymentStatus === 'paid' || result.status === 'paid' || result.status === 'succeeded') {
      let sale = await queryOne(
        `SELECT s.*, b.id as booking_id, b.booking_ref, b.payment_type, b.total_amount, c.name as customer_name, c.email as customer_email
         FROM Sales s
         JOIN Bookings b ON s.booking_id = b.id
         JOIN Customers c ON b.customer_id = c.id
         WHERE s.transaction_id = ?`,
        [req.params.sessionId]
      );

      if (!sale && result.referenceNumber) {
        sale = await queryOne(
          `SELECT s.*, b.id as booking_id, b.booking_ref, b.payment_type, b.total_amount, c.name as customer_name, c.email as customer_email
           FROM Sales s
           JOIN Bookings b ON s.booking_id = b.id
           JOIN Customers c ON b.customer_id = c.id
           WHERE b.booking_ref = ?`,
          [result.referenceNumber]
        );
      }

      if (sale) {
        await execute(
          `UPDATE Sales
           SET payment_status = 'completed', transaction_id = ?
           WHERE id = ?`,
          [result.sessionId || req.params.sessionId, sale.id]
        );

        const paymentStatus = sale.payment_type === 'down_payment' ? 'partial' : 'full';
        await execute(
          `UPDATE Bookings
           SET payment_status = ?
           WHERE id = ?`,
          [paymentStatus, sale.booking_id]
        );

        await logActivity({
          action: 'payment_completed',
          category: 'sales',
          description: `Payment of ₱${Number(sale.amount).toLocaleString()} completed via GCash for Booking #${sale.booking_ref || sale.booking_id}`,
          performed_by: sale.customer_email || 'customer',
          details: { bookingId: sale.booking_id, bookingRef: sale.booking_ref, amount: sale.amount, sessionId: req.params.sessionId },
        });
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;