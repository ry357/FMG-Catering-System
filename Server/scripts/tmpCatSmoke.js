import 'dotenv/config';
import { createBooking, transitionStatus } from '../services/bookingService.js';
import { queryOne, execute } from '../config/dbHelper.js';

const email = `smoke.${Date.now()}@test.local`;
const { bookingId, bookingRef } = await createBooking({
  name: 'Smoke Test',
  email,
  phone: '+639123456789',
  address: 'Carcar City',
  event_type: 'birthday',
  event_date: '2026-12-01',
  number_of_guests: 20,
  budget: null,
  preferred_package: 'packed-a',
  booking_category: 'drop-off',
  menu_preference: { category: 'drop-off', offer: 'Packed Meal Set A' },
  total_amount: 3000,
});

const row = await queryOne(
  'SELECT booking_category, preferred_package, budget, status, total_amount FROM Bookings WHERE id = ?',
  [bookingId]
);
console.log('created:', JSON.stringify(row));
console.log('expected drop-off / packed-a / null budget:', row.booking_category === 'drop-off' && row.preferred_package === 'packed-a' && row.budget === null ? 'PASS' : 'FAIL');

await execute('UPDATE Bookings SET status = ? WHERE id = ?', ['approved', bookingId]);
console.log('transition to approved: PASS');

await execute('DELETE FROM Bookings WHERE id = ?', [bookingId]);
console.log('cleanup ok');
process.exit(0);