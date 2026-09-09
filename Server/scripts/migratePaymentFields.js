import { getDb } from '../config/db.js';

async function migratePaymentFields() {
  const db = await getDb();

  try {
    console.log('Adding payment fields to Bookings table...');
    
    // Add payment_type column
    await db.exec(`
      ALTER TABLE Bookings ADD COLUMN payment_type TEXT DEFAULT 'full' CHECK(payment_type IN ('full', 'down_payment'))
    `);
    
    // Add down_payment_amount column
    await db.exec(`
      ALTER TABLE Bookings ADD COLUMN down_payment_amount REAL DEFAULT 0
    `);
    
    // Add total_amount column
    await db.exec(`
      ALTER TABLE Bookings ADD COLUMN total_amount REAL
    `);
    
    // Add payment_status column
    await db.exec(`
      ALTER TABLE Bookings ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'partial', 'full', 'failed'))
    `);
    
    console.log('✅ Payment fields added to Bookings table');
    
    console.log('Adding payment_type column to Sales table...');
    
    // Add payment_type column to Sales
    await db.exec(`
      ALTER TABLE Sales ADD COLUMN payment_type TEXT DEFAULT 'full' CHECK(payment_type IN ('full', 'down_payment', 'balance'))
    `);
    
    console.log('✅ Payment fields added to Sales table');
    console.log('✅ Migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // If columns already exist, it's not a critical error
    if (error.message.includes('duplicate column name')) {
      console.log('✅ Payment fields already exist, skipping...');
      process.exit(0);
    }
    process.exit(1);
  }
}

migratePaymentFields();