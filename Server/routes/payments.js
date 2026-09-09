import { Router } from 'express';
import {
  createGCashCheckout,
  verifyGCashPayment,
} from '../services/paymentProviders.js';
import { query, queryOne, execute, executeWithId } from '../config/dbHelper.js';
import { sendBookingConfirmationEmail, sendBookingApprovalEmail } from '../services/emailService.js';
import { validatePayment } from '../middleware/validator.js';

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
    const { amount, bookingRef, customerName, customerEmail, description, bookingData, paymentType = 'full' } = req.body;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    
    // Generate unique booking reference with timestamp + random string
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ref = bookingRef || `FMG-${Date.now()}-${randomStr}`;

    // Calculate down payment and total amount
    const totalAmount = bookingData?.budget || (amount * 2); // If down payment, assume 50% so total = amount * 2
    const downPaymentAmount = paymentType === 'down_payment' ? amount : 0;

    // Calculate total based on menu items if provided
    let finalTotalAmount = totalAmount;
    if (bookingData?.selectedMenuItems && bookingData.selectedMenuItems.length > 0) {
      const itemsTotal = bookingData.selectedMenuItems.reduce((sum, item) => sum + (item.price || 0), 0);
      finalTotalAmount = itemsTotal * (bookingData?.numberOfGuests || 1);
    }

    // Create or get customer
    let customer;
    const existingCustomer = await queryOne(
      'SELECT id FROM Customers WHERE email = ?',
      [customerEmail]
    );

    if (existingCustomer) {
      customer = existingCustomer;
    } else {
      const customerId = await executeWithId(
        'INSERT INTO Customers (name, email, phone) VALUES (?, ?, ?)',
        [customerName, customerEmail, bookingData?.contactNumber || '']
      );
      customer = { id: customerId };
    }

    // Create booking
    const bookingId = await executeWithId(
      `INSERT INTO Bookings (customer_id, event_type, event_date, number_of_guests, budget, preferred_package, additional_requests, booking_ref, status, payment_type, down_payment_amount, total_amount, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        bookingData?.eventType || 'General',
        bookingData?.eventDate || new Date().toISOString().split('T')[0],
        bookingData?.numberOfGuests || 0,
        bookingData?.budget || 0,
        bookingData?.preferredPackageId || '',
        bookingData?.additionalRequests || '',
        ref,
        'pending',
        paymentType,
        downPaymentAmount,
        finalTotalAmount,
        'pending'
      ]
    );

    // Store client menu selections without changing the package price calculation.
    if (bookingData?.selectedMenuItems && bookingData.selectedMenuItems.length > 0) {
      const menuJson = JSON.stringify(bookingData.selectedMenuItems);
      await execute(
        'UPDATE Bookings SET additional_requests = ? WHERE id = ?',
        [`${bookingData?.additionalRequests || ''} | MENU: ${menuJson}`, bookingId]
      );
    }

    if (bookingData?.menuPreference) {
      const preferenceJson = JSON.stringify(bookingData.menuPreference);
      await execute(
        'UPDATE Bookings SET additional_requests = ? WHERE id = ?',
        [`${bookingData?.additionalRequests || ''} | MENU PREFERENCE: ${preferenceJson}`, bookingId]
      );
    }

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

    // Send booking confirmation email (async, non-blocking)
    if (customerEmail && customerName) {
      sendBookingConfirmationEmail(
        customerName,
        customerEmail,
        ref,
        bookingData?.eventType || 'General',
        bookingData?.eventDate || new Date().toISOString().split('T')[0]
      ).catch(emailError => {
        console.error('Failed to send booking confirmation email:', emailError);
      });
    }

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
        SELECT b.*, c.name as customer_name, c.email as customer_email
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

      // Update booking payment status based on payment type
      const paymentStatus = booking.payment_type === 'down_payment' ? 'partial' : 'full';
      
      await execute(
        `UPDATE Bookings
         SET payment_status = ?, status = 'approved'
         WHERE booking_ref = ?`,
        [paymentStatus, result.referenceNumber]
      );

      // Send booking approval email (async, non-blocking)
      if (booking && booking.customer_email && booking.customer_name) {
        sendBookingApprovalEmail(
          booking.customer_name,
          booking.customer_email,
          booking.booking_ref,
          booking.event_type,
          booking.event_date
        ).catch(emailError => {
          console.error('Failed to send booking approval email:', emailError);
        });
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
