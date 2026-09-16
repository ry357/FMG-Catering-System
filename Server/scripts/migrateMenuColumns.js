import 'dotenv/config';
import { getDb, getDbType } from '../config/db.js';

async function migrateMenuColumns() {
  const db = await getDb();
  const dbType = getDbType();

  try {
    console.log(`Adding menu columns to Bookings table (DB_TYPE=${dbType})...`);

    await db.exec('ALTER TABLE Bookings ADD COLUMN menu_items TEXT');
    await db.exec('ALTER TABLE Bookings ADD COLUMN menu_preference TEXT');

    console.log('✅ menu_items and menu_preference added to Bookings table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (/duplicate column|already exists/.test(error.message)) {
      console.log('✅ Menu columns already exist, skipping...');
      process.exit(0);
    }
    process.exit(1);
  }
}

migrateMenuColumns();