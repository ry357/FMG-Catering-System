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
