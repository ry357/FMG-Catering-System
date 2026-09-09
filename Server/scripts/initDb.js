import { getDb } from '../config/db.js';
import { SCHEMA_STATEMENTS, INDEX_STATEMENTS } from './schema.js';

async function initializeDatabase() {
  const db = await getDb();

  for (const statement of SCHEMA_STATEMENTS) {
    await db.exec(statement);
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