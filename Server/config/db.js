import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createClient } from '@tursodatabase/serverless/compat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../database.sqlite');

// PostgreSQL connection pool
const pgPool = new pg.Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'fmg_catering',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
});

let sqliteDb;
let sqliteModulePromise;
let tursoAdapter;

// Read DB_TYPE lazily instead of at module load. ESM imports are hoisted,
// so dotenv.config() in index.js / scripts runs AFTER this module is
// evaluated; reading process.env here (import time) would always yield
// 'sqlite' even when .env sets DB_TYPE=turso.
function currentDbType() {
  return process.env.DB_TYPE || 'sqlite'; // 'sqlite', 'postgres', or 'turso'
}

// Wraps a Turso (libSQL) client so it mimics the `sqlite` package API
// (all / get / run / exec). This lets every existing route, helper and
// script work unchanged whether DB_TYPE is 'sqlite' or 'turso'.
function createTursoAdapter(client) {
  return {
    async all(sql, params = []) {
      const result = await client.execute({ sql, args: params });
      return result.rows;
    },
    async get(sql, params = []) {
      const result = await client.execute({ sql, args: params });
      return result.rows[0] ?? null;
    },
    async run(sql, params = []) {
      const result = await client.execute({ sql, args: params });
      return {
        lastID: result.lastInsertRowid != null ? Number(result.lastInsertRowid) : null,
        changes: typeof result.rowsAffected === 'number' ? result.rowsAffected : 0,
      };
    },
    async exec(sql) {
      await client.executeMultiple(sql);
      return undefined;
    },
    close() {
      client.close();
    },
  };
}

export async function getDb() {
  const dbType = currentDbType();

  if (dbType === 'postgres') {
    return pgPool;
  }

  if (dbType === 'turso') {
    if (!tursoAdapter) {
      if (!process.env.TURSO_URL || !process.env.TURSO_AUTH_TOKEN) {
        throw new Error('TURSO_URL and TURSO_AUTH_TOKEN are required when DB_TYPE=turso');
      }
      const client = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      tursoAdapter = createTursoAdapter(client);
    }
    return tursoAdapter;
  }

  if (!sqliteDb) {
    // Lazy-load sqlite3: it's a native module only needed for local/development
    // DB_TYPE='sqlite'. On Vercel (DB_TYPE='turso') it must never be loaded.
    if (!sqliteModulePromise) {
      sqliteModulePromise = Promise.all([import('sqlite3'), import('sqlite')]);
    }
    const [sqliteModule, sqliteOpen] = await sqliteModulePromise;
    const sqlite3 = sqliteModule.default ?? sqliteModule;
    sqliteDb = await sqliteOpen.open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  }
  return sqliteDb;
}

export function getDbType() {
  return currentDbType();
}

export default getDb;