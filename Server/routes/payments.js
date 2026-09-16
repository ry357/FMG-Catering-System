import { Router } from 'express';
import {
  createGCashCheckout,
  verifyGCashPayment,
} from '../services/paymentProviders.js';
import { query, queryOne, execute } from '../config/dbHelper.js';
import { validatePayment } from '../middleware/validator.js';
import { createBooking } from '../services/bookingService.js';

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
      budget: bookingData.budget,
      preferred_package: bookingData.preferredPackageId || bookingData.offerId,
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

    // Update sale record if payment is successful
    if (result.paymentStatus === 'paid') {
      // Get booking details before updating
      const booking = await queryOne(`
        SELECT b.*, c.name as customer_name, c.email as customer_email, c.address as customer_address
        FROM Bookings b
        JOIN Customers c ON b.customer_id = c.id
        WHERE b.booking_ref = ?
      `, [result.referenceNumber]);

      // Update sale record
      await execute(
        `UPDATE Sales
         SET payment_status = 'completed', transaction_id = ?
         WHERE transaction_id = ?`,
        [result.sessionId, req.params.sessionId]
      );

      // Update booking payment status based on payment type.
      // Status stays 'pending' for staff review in the dashboard.
      if (booking) {
        const paymentStatus = booking.payment_type === 'down_payment' ? 'partial' : 'full';

        await execute(
          `UPDATE Bookings
           SET payment_status = ?
           WHERE booking_ref = ?`,
          [paymentStatus, result.referenceNumber]
        );
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;