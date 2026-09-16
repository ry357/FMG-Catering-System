import { queryOne, execute, executeWithId } from '../config/dbHelper.js';
import {
  sendBookingConfirmationEmail,
  sendBookingApprovalEmail,
  sendBookingRejectionEmail,
} from './emailService.js';

const EVENT_TYPE_NORMALIZE = {
  wedding: 'Wedding',
  birthday: 'Birthday',
  corporate: 'Corporate',
  anniversary: 'Anniversary',
  gala: 'Gala',
  other: 'Other',
};

function normalizeEventType(value) {
  if (!value) return value;
  const key = String(value).trim().toLowerCase();
  return EVENT_TYPE_NORMALIZE[key] || String(value).trim();
}

export function generateBookingRef() {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FMG-${Date.now()}-${randomStr}`;
}

export function calculateItemsTotal(menuItems, guests) {
  if (!Array.isArray(menuItems) || menuItems.length === 0) return 0;
  const sum = menuItems.reduce((acc, item) => acc + (Number(item?.price) || 0), 0);
  return sum * (Number(guests) || 1);
}

export async function findOrCreateCustomer({ name, email, phone, address }) {
  const customer = await queryOne('SELECT id, address FROM Customers WHERE email = ?', [email]);

  if (customer) {
    if (address && !customer.address) {
      await execute('UPDATE Customers SET address = ? WHERE id = ?', [address, customer.id]);
    }
    return customer.id;
  }

  return executeWithId(
    'INSERT INTO Customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
    [name, email, phone, address || null]
  );
}

// Single source of truth for booking creation. Both the public bookings route
// and the payment route delegate here so the two paths can never drift.
export async function createBooking(data = {}) {
  const {
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
    payment_type = 'full',
    down_payment_amount = 0,
    booking_ref,
  } = data;

  const customerId = await findOrCreateCustomer({ name, email, phone, address });
  const ref = booking_ref || generateBookingRef();
  const guests = booking_category === 'drop-off' ? 0 : Number(number_of_guests) || 1;
  const itemsTotal = calculateItemsTotal(selected_menu_items, guests);
  const finalTotal = Number(total_amount) || itemsTotal || Number(budget) || 0;

  const menuItemsJson =
    Array.isArray(selected_menu_items) && selected_menu_items.length
      ? JSON.stringify(selected_menu_items)
      : null;
  const menuPreferenceJson = menu_preference ? JSON.stringify(menu_preference) : null;

  const bookingId = await executeWithId(
    `INSERT INTO Bookings
       (customer_id, event_type, event_date, number_of_guests, budget, preferred_package,
        additional_requests, menu_items, menu_preference, booking_category, booking_ref, status,
        payment_type, down_payment_amount, total_amount, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, 'pending')`,
    [
      customerId,
      normalizeEventType(event_type),
      event_date,
      guests,
      budget ?? null,
      preferred_package || null,
      additional_requests || null,
      menuItemsJson,
      menuPreferenceJson,
      booking_category === 'drop-off' ? 'drop-off' : 'natural',
      ref,
      payment_type,
      Number(down_payment_amount) || 0,
      finalTotal,
    ]
  );

  if (name && email) {
    sendBookingConfirmationEmail(name, email, ref, normalizeEventType(event_type), event_date)
      .catch((emailError) => console.error('Failed to send booking confirmation email:', emailError));
  }

  return { bookingId, bookingRef: ref };
}

// Enforced status state machine. Rejected/completed can be reopened so staff can
// recover from a mistaken decision, matching the dashboard's "reopen" action.
export const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: ['pending'],
  completed: ['pending', 'approved', 'rejected'],
};

export async function transitionStatus(bookingId, nextStatus) {
  const booking = await queryOne(
    `SELECT b.*, c.name as customer_name, c.email as customer_email, c.address as customer_address
     FROM Bookings b
     JOIN Customers c ON b.customer_id = c.id
     WHERE b.id = ?`,
    [bookingId]
  );

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(nextStatus)) {
    const error = new Error(`Cannot change booking status from '${booking.status}' to '${nextStatus}'`);
    error.statusCode = 400;
    throw error;
  }

  await execute(
    'UPDATE Bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [nextStatus, bookingId]
  );

  if (nextStatus === 'approved' && booking.customer_email && booking.customer_name) {
    sendBookingApprovalEmail(
      booking.customer_name,
      booking.customer_email,
      booking.booking_ref,
      booking.event_type,
      booking.event_date
    ).catch((emailError) => console.error('Failed to send booking approval email:', emailError));
  }

  if (nextStatus === 'rejected' && booking.customer_email && booking.customer_name) {
    sendBookingRejectionEmail(
      booking.customer_name,
      booking.customer_email,
      booking.booking_ref,
      booking.event_type,
      booking.event_date
    ).catch((emailError) => console.error('Failed to send booking rejection email:', emailError));
  }

  return { ...booking, status: nextStatus };
}