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
  const customer = await queryOne('SELECT * FROM Customers WHERE email = ?', [email]);

  if (customer) {
    const updates = [];
    const params = [];

    // Always keep phone up-to-date if provided in the booking
    if (phone && phone.trim()) {
      updates.push('phone = ?');
      params.push(phone.trim());
    }

    // Always keep primary address up-to-date if provided
    if (address && address.trim()) {
      updates.push('address = ?');
      params.push(address.trim());
    }

    // Update customer name if provided
    if (name && name.trim()) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    // Manage saved_addresses: ensure the booked venue address is also in saved_addresses
    let addresses = [];
    try {
      if (customer.saved_addresses) {
        addresses = typeof customer.saved_addresses === 'string'
          ? JSON.parse(customer.saved_addresses)
          : customer.saved_addresses;
      }
    } catch {
      addresses = [];
    }
    if (!Array.isArray(addresses)) addresses = [];

    if (address && address.trim()) {
      const cleanAddr = address.trim();
      const existingVenue = addresses.find(
        (a) => a.address && a.address.trim().toLowerCase() === cleanAddr.toLowerCase()
      );

      if (!existingVenue) {
        addresses.push({
          id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          label: cleanAddr.split(',')[0].trim() || 'Booked Venue',
          address: cleanAddr,
          contactPerson: name ? name.trim() : (customer.name || ''),
          contactPhone: phone ? phone.trim() : (customer.phone || ''),
          isDefault: addresses.length === 0,
          createdAt: new Date().toISOString(),
        });
        updates.push('saved_addresses = ?');
        params.push(JSON.stringify(addresses));
      }
    }

    if (updates.length > 0) {
      params.push(customer.id);
      await execute(`UPDATE Customers SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return customer.id;
  }

  // Create new customer with the booked address in saved_addresses as default
  const initialAddresses = address && address.trim() ? [
    {
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: address.split(',')[0].trim() || 'Primary Venue',
      address: address.trim(),
      contactPerson: name ? name.trim() : '',
      contactPhone: phone ? phone.trim() : '',
      isDefault: true,
      createdAt: new Date().toISOString(),
    }
  ] : [];

  return executeWithId(
    'INSERT INTO Customers (name, email, phone, address, saved_addresses) VALUES (?, ?, ?, ?, ?)',
    [name, email, phone || null, address || null, initialAddresses.length > 0 ? JSON.stringify(initialAddresses) : null]
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
  const finalBudget = budget !== undefined && budget !== null && budget !== '' ? Number(budget) : (finalTotal || null);

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
      finalBudget,
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

  if (nextStatus === 'completed') {
    const finalAmount = Number(booking.total_amount) || Number(booking.budget) || 0;
    const existingSale = await queryOne('SELECT * FROM Sales WHERE booking_id = ?', [bookingId]);
    if (existingSale) {
      if (existingSale.payment_status !== 'completed') {
        await execute("UPDATE Sales SET payment_status = 'completed' WHERE id = ?", [existingSale.id]);
      }
    } else if (finalAmount > 0) {
      await execute(
        `INSERT INTO Sales (booking_id, amount, payment_method, payment_status, payment_type)
         VALUES (?, ?, 'direct', 'completed', 'full')`,
        [bookingId, finalAmount]
      );
    }

    if (booking.payment_status !== 'full') {
      await execute("UPDATE Bookings SET payment_status = 'full' WHERE id = ?", [bookingId]);
    }
  }

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