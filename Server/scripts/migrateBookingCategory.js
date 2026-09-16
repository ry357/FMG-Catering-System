import 'dotenv/config';
import { getDb, getDbType } from '../config/db.js';

async function migrateBookingCategory() {
  const db = await getDb();
  const dbType = getDbType();

  try {
    console.log(`Adding booking_category column to Bookings table (DB_TYPE=${dbType})...`);

    await db.exec("ALTER TABLE Bookings ADD COLUMN booking_category TEXT DEFAULT 'natural'");
    console.log('✅ booking_category added to Bookings table');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (/duplicate column|already exists/.test(error.message)) {
      console.log('✅ booking_category already exists, skipping...');
    } else {
      process.exitCode = 1;
    }
  } finally {
    try {
      await db.close?.();
    } catch {
      // ignore teardown errors
    }
  }
}

migrateBookingCategory().then(() => process.exit(0));