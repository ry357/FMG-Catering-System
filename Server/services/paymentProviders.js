import Stripe from 'stripe';

const PAYMONGO_API = 'https://api.paymongo.com/v1';

function payMongoAuthHeader() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PayMongo secret key is not configured. Set PAYMONGO_SECRET_KEY for GCash payments.');
  }
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export async function createGCashCheckout({
  amount,
  bookingRef,
  customerName,
  customerEmail,
  description,
  successUrl,
  cancelUrl,
}) {
  const amountCentavos = Math.round(Number(amount) * 100);

  const response = await fetch(`${PAYMONGO_API}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Authorization: payMongoAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        attributes: {
          billing: {
            name: customerName || 'FMG Customer',
            email: customerEmail || 'customer@example.com',
          },
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          description,
          line_items: [
            {
              currency: 'PHP',
              amount: amountCentavos,
              name: description,
              quantity: 1,
              description: `Booking reference: ${bookingRef}`,
            },
          ],
          payment_method_types: ['gcash'],
          reference_number: bookingRef,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data.errors?.[0]?.detail || 'Failed to create GCash checkout session';
    throw new Error(message);
  }

  const session = data.data;

  return {
    sessionId: session.id,
    checkoutUrl: session.attributes.checkout_url,
    bookingRef,
    amount: Number(amount).toFixed(2),
    status: session.attributes.status,
  };
}

export async function verifyGCashPayment(sessionId) {
  const response = await fetch(`${PAYMONGO_API}/checkout_sessions/${sessionId}`, {
    headers: {
      Authorization: payMongoAuthHeader(),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.detail || 'Failed to verify GCash payment');
  }

  const session = data.data;
  const payment = session.attributes.payments?.[0];

  return {
    sessionId: session.id,
    status: session.attributes.status,
    paymentStatus: payment?.attributes?.status,
    amount: payment?.attributes?.amount ? payment.attributes.amount / 100 : null,
    currency: payment?.attributes?.currency,
    referenceNumber: session.attributes.reference_number,
  };
}

// ==========================================
// Stripe Integration (Card / International)
// ==========================================

let stripeInstance = null;

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured. Set STRIPE_SECRET_KEY for card payments.');
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey);
  }
  return stripeInstance;
}

export async function createStripeCheckout({
  amount,
  bookingRef,
  customerName,
  customerEmail,
  description,
  successUrl,
  cancelUrl,
  paymentType = 'full',
}) {
  const stripe = getStripeClient();
  const currency = (process.env.STRIPE_CURRENCY || 'php').toLowerCase();

  const isZeroDecimal = ['jpy', 'krw', 'vnd', 'clp', 'pyg'].includes(currency);
  const unitAmount = isZeroDecimal ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: customerEmail || undefined,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: description || 'FMG Catering Booking',
            description: `Booking Reference: ${bookingRef} (${paymentType === 'down_payment' ? 'Down Payment' : 'Full Payment'})`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    client_reference_id: bookingRef,
    metadata: {
      bookingRef,
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      paymentType,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
    bookingRef,
    amount: Number(amount).toFixed(2),
    status: session.status,
  };
}

export async function verifyStripePayment(sessionId) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const isZeroDecimal = ['jpy', 'krw', 'vnd', 'clp', 'pyg'].includes(session.currency?.toLowerCase());
  const formattedAmount = session.amount_total
    ? (isZeroDecimal ? session.amount_total : session.amount_total / 100)
    : null;

  return {
    sessionId: session.id,
    status: session.status,
    paymentStatus: session.payment_status, // 'paid', 'unpaid', or 'no_payment_required'
    amount: formattedAmount,
    currency: session.currency?.toUpperCase(),
    referenceNumber: session.client_reference_id || session.metadata?.bookingRef,
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
  };
}

export function constructStripeEvent(payload, signature) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
