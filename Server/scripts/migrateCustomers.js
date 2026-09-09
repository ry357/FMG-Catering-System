import { getDb } from '../config/db.js';

async function migrateDatabase() {
  const db = await getDb();

  try {
    // Check if google_id column exists
    const tableInfo = await db.all("PRAGMA table_info(Customers)");
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes('google_id')) {
      console.log('Adding google_id column to Customers table...');
      await db.exec('ALTER TABLE Customers ADD COLUMN google_id TEXT');
    }
    
    if (!columns.includes('avatar')) {
      console.log('Adding avatar column to Customers table...');
      await db.exec('ALTER TABLE Customers ADD COLUMN avatar TEXT');
    }

    // Create indexes if they don't exist
    await db.exec('CREATE INDEX IF NOT EXISTS idx_customers_email ON Customers(email)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_customers_google_id ON Customers(google_id)');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateDatabase();