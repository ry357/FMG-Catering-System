import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb } from '../config/db.js';
import { SCHEMA_STATEMENTS, INDEX_STATEMENTS, MIGRATION_STATEMENTS } from './schema.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const localDbPath = join(__dirname, '../../database.sqlite');

// Tables to copy, in order so foreign keys resolve (parents before children).
const TABLES = ['Users', 'Customers', 'Bookings', 'Sales', 'Reports', 'EmailLogs'];

async function getColumns(db, table) {
  const rows = await db.all(`PRAGMA table_info(${table})`);
  return rows.map((row) => row.name);
}

async function migrateToTurso() {
  console.log('Opening local SQLite database...');
  const localDb = await open({ filename: localDbPath, driver: sqlite3.Database });

  console.log('Connecting to Turso...');
  const turso = await getDb();

  console.log('Creating schema in Turso...');
  for (const statement of SCHEMA_STATEMENTS) {
    await turso.exec(statement);
  }
  for (const statement of INDEX_STATEMENTS) {
    await turso.exec(statement);
  }
  for (const statement of MIGRATION_STATEMENTS) {
    try {
      await turso.exec(statement);
      console.log(`Applied migration: ${statement}`);
    } catch (err) {
      const message = `${err?.message || ''} ${err?.code || ''}`.toLowerCase();
      if (/duplicate column|already exists/.test(message)) {
        continue;
      }
      throw err;
    }
  }

  let totalRows = 0;

  for (const table of TABLES) {
    const columns = await getColumns(localDb, table);
    const rows = await localDb.all(`SELECT * FROM ${table}`);
    const columnList = columns.map((c) => `"${c}"`).join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT OR REPLACE INTO "${table}" (${columnList}) VALUES (${placeholders})`;

    for (const row of rows) {
      const params = columns.map((c) => row[c]);
      await turso.run(insertSql, params);
    }

    console.log(`  ${table}: ${rows.length} rows copied`);
    totalRows += rows.length;
  }

  console.log(`\nDone! ${totalRows} rows copied to Turso.`);

  console.log('\nVerifying Turso row counts...');
  for (const table of TABLES) {
    const result = await turso.all(`SELECT COUNT(*) AS count FROM "${table}"`);
    console.log(`  ${table}: ${result[0]?.count ?? 0} rows`);
  }

  await localDb.close();
  await turso.close?.();
  process.exit(0);
}

migrateToTurso().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});