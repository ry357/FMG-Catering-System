import 'dotenv/config';
import { getDb } from '../config/db.js';
import { SCHEMA_STATEMENTS, INDEX_STATEMENTS, MIGRATION_STATEMENTS } from './schema.js';

async function initializeDatabase() {
  const db = await getDb();

  for (const statement of SCHEMA_STATEMENTS) {
    await db.exec(statement);
  }

  for (const statement of MIGRATION_STATEMENTS) {
    try {
      await db.exec(statement);
      console.log(`Applied migration: ${statement}`);
    } catch (err) {
      // ALTERs are idempotent-by-best-effort: ignore "already applied" errors.
      const message = `${err?.message || ''} ${err?.code || ''}`.toLowerCase();
      if (/duplicate column|already exists/.test(message)) {
        continue;
      }
      throw err;
    }
  }

  for (const statement of INDEX_STATEMENTS) {
    await db.exec(statement);
  }

  console.log('Database initialized successfully!');
  process.exit(0);
}

initializeDatabase().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});