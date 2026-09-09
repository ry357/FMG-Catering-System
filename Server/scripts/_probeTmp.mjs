import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: 'C:/Users/L E N O V O/FMG-Catering System/database.sqlite',
  driver: sqlite3.Database,
});
const rows = await db.all('SELECT id, customer_id, event_type, event_date FROM Bookings ORDER BY event_date');
for (const r of rows) console.log(`${r.event_date} ${r.event_type} cust=${r.customer_id}`);
await db.close();