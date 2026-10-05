const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Payment request failed');
  }

  return data;
}

export async function getPaymentConfig() {
  return request('/payments/config');
}

export async function createGCashCheckout({ amount, bookingRef, customerName, customerEmail, description, bookingData, paymentType = 'full' }) {
  return request('/payments/gcash/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ amount, bookingRef, customerName, customerEmail, description, bookingData, paymentType }),
  });
}

export async function verifyGCashPayment(sessionId) {
  return request(`/payments/gcash/verify/${sessionId}`);
}
