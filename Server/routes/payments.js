import { Router } from 'express';
import {
  createGCashCheckout,
  verifyGCashPayment,
  createStripeCheckout,
  verifyStripePayment,
  constructStripeEvent,
} from '../services/paymentProviders.js';
import { queryOne, execute } from '../config/dbHelper.js';
import { validatePayment } from '../middleware/validator.js';
import { createBooking } from '../services/bookingService.js';

const router = Router();

router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      gcashEnabled: Boolean(process.env.PAYMONGO_SECRET_KEY),
      stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
    },
  });
});

// ==========================================
// GCash Payments (PayMongo)
// ==========================================

// Create booking and GCash payment session
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

    res.json({
      success: true,
      data: {
        ...checkout,
        bookingId,
        bookingRef: ref,
      },
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
      const booking = await queryOne(
        `SELECT b.*, c.name as customer_name, c.email as customer_email, c.address as customer_address
         FROM Bookings b
         JOIN Customers c ON b.customer_id = c.id
         WHERE b.booking_ref = ?`,
        [result.referenceNumber]
      );

      // Update sale record
      await execute(
        `UPDATE Sales
         SET payment_status = 'completed', transaction_id = ?
         WHERE transaction_id = ?`,
        [result.sessionId, req.params.sessionId]
      );

      // Update booking payment status based on payment type
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

// ==========================================
// Stripe Card Payments
// ==========================================

// Create booking and Stripe card checkout session
router.post('/stripe/create-checkout', validatePayment, async (req, res, next) => {
  try {
    const { amount, bookingRef, customerName, customerEmail, description, bookingData = {}, paymentType = 'full' } = req.body;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const downPaymentAmount = paymentType === 'down_payment' ? Number(amount) : 0;

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

    // Create Stripe Checkout Session
    const checkout = await createStripeCheckout({
      amount: Number(amount),
      bookingRef: ref,
      customerName,
      customerEmail,
      description: description || 'FMG Catering booking deposit',
      successUrl: `${clientUrl}/payment/success?method=card&ref=${ref}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${clientUrl}/payment/cancel?method=card&ref=${ref}`,
      paymentType,
    });

    // Create pending sale record with payment_method 'card'
    await execute(
      `INSERT INTO Sales (booking_id, amount, payment_method, payment_status, transaction_id, payment_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bookingId, Number(amount), 'card', 'pending', checkout.sessionId, paymentType]
    );

    res.json({
      success: true,
      data: {
        ...checkout,
        bookingId,
        bookingRef: ref,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Verify Stripe Checkout session
router.get('/stripe/verify/:sessionId', async (req, res, next) => {
  try {
    const result = await verifyStripePayment(req.params.sessionId);

    if (result.paymentStatus === 'paid') {
      const booking = await queryOne(
        `SELECT b.*, c.name as customer_name, c.email as customer_email, c.address as customer_address
         FROM Bookings b
         JOIN Customers c ON b.customer_id = c.id
         WHERE b.booking_ref = ?`,
        [result.referenceNumber]
      );

      await execute(
        `UPDATE Sales
         SET payment_status = 'completed', transaction_id = ?
         WHERE transaction_id = ?`,
        [result.paymentIntentId || result.sessionId, req.params.sessionId]
      );

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

// Optional Stripe webhook endpoint
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      const rawBody = req.rawBody || req.body;
      event = constructStripeEvent(rawBody, sig);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Stripe webhook verification error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event?.type === 'checkout.session.completed') {
    const session = event.data.object;
    const ref = session.client_reference_id || session.metadata?.bookingRef;

    if (ref) {
      const booking = await queryOne(
        `SELECT b.*, c.name as customer_name, c.email as customer_email, c.address as customer_address
         FROM Bookings b
         JOIN Customers c ON b.customer_id = c.id
         WHERE b.booking_ref = ?`,
        [ref]
      );

      const txId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || session.id;

      await execute(
        `UPDATE Sales
         SET payment_status = 'completed', transaction_id = ?
         WHERE transaction_id = ? OR transaction_id = ?`,
        [txId, session.id, txId]
      );

      if (booking) {
        const paymentStatus = booking.payment_type === 'down_payment' ? 'partial' : 'full';
        await execute(
          `UPDATE Bookings
           SET payment_status = ?
           WHERE booking_ref = ?`,
          [paymentStatus, ref]
        );
      }
    }
  }

  res.json({ received: true });
});

export default router;