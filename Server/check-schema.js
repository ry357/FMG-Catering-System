import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../database.sqlite');

async function checkSchema() {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('\n📊 Checking Customers table schema...\n');
    const schema = await db.all('PRAGMA table_info(Customers)');
    
    if (schema.length === 0) {
      console.log('❌ ERROR: Customers table does not exist!');
    } else {
      console.log('✅ Customers table found:');
      schema.forEach(col => {
        console.log(`   - ${col.name.padEnd(20)} ${col.type.padEnd(10)} ${col.notnull ? 'NOT NULL' : ''}`);
      });
    }

    console.log('\n📊 Checking for existing customers...\n');
    const customers = await db.all('SELECT id, name, email, google_id, avatar FROM Customers LIMIT 5');
    console.log(`Total customers: ${customers.length || 0}`);
    if (customers.length > 0) {
      customers.forEach(c => {
        console.log(`   - ${c.name} (${c.email}) - Google ID: ${c.google_id ? '✅' : '❌'}`);
      });
    }

    await db.close();
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  }
}

checkSchema();
