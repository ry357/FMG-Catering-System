import dotenv from 'dotenv';
import { createClient } from '@tursodatabase/serverless/compat';

dotenv.config();

async function main() {
  const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('Turso connection:', process.env.TURSO_URL);
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('\nTables:', tables.rows.map((row) => row[0] ?? row.name).join(', '));

  const TABLES = ['Users', 'Customers', 'Bookings', 'Sales', 'Reports', 'EmailLogs'];
  for (const table of TABLES) {
    const result = await client.execute(`SELECT COUNT(*) c FROM "${table}"`);
    const count = result.rows[0]?.c ?? result.rows[0]?.[0] ?? 0;
    console.log(`  ${table}: ${count} rows`);
  }

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});