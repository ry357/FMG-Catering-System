import 'dotenv/config';
import { getDb, getDbType } from '../config/db.js';

// SQLite/Turso cannot ALTER a CHECK constraint, so the EmailLogs table must be
// rebuilt to allow the new 'booking_rejected' email type. Existing rows are
// copied over first.
const NEW_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS EmailLogs_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL CHECK(email_type IN ('booking_confirmation', 'booking_approval', 'booking_rejected', 'promotional', 'anniversary_reminder')),
    subject TEXT,
    status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'failed')),
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
  )
`;

async function migrateEmailTypes() {
  const db = await getDb();
  const dbType = getDbType();

  try {
    console.log(`Rebuilding EmailLogs with booking_rejected support (DB_TYPE=${dbType})...`);

    await db.exec(NEW_TABLE_SQL);
    await db.exec(`
      INSERT INTO EmailLogs_new (id, recipient_email, email_type, subject, status, sent_at, error_message)
      SELECT id, recipient_email, email_type, subject, status, sent_at, error_message FROM EmailLogs
    `);
    await db.exec('DROP TABLE EmailLogs');
    await db.exec('ALTER TABLE EmailLogs_new RENAME TO EmailLogs');

    console.log('✅ EmailLogs rebuilt with booking_rejected email type');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.message.includes('no such table')) {
      console.log('✅ EmailLogs table not yet created, schema.js will define it on init');
      process.exit(0);
    }
    if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
      console.log('✅ EmailLogs_new already exists, skipping...');
      process.exit(0);
    }
    process.exit(1);
  } finally {
    try {
      await db.close?.();
    } catch {
      // ignore teardown errors
    }
  }
}

migrateEmailTypes().then(() => process.exit(0));