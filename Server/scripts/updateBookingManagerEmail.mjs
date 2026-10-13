import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { getDb, getDbType } from '../config/db.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateDb() {
  const targetEmail = 'genayascristina2@gmail.com';
  const targetFullName = 'Cristina Genayas';

  console.log('--- Updating active database configured in .env ---');
  const db = await getDb();
  const dbType = getDbType();
  console.log('Active DB type:', dbType);

  // Check if staff user exists
  const staffUser = await db.get("SELECT * FROM Users WHERE role = 'staff'");
  if (staffUser) {
    console.log('Current staff user:', staffUser);
    await db.run(
      "UPDATE Users SET email = ?, full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [targetEmail, targetFullName, staffUser.id]
    );
    console.log(`Updated user ID ${staffUser.id} to email: ${targetEmail}, full_name: ${targetFullName}`);
  } else {
    console.log('No staff user found in active DB. Creating one...');
    await db.run(
      "INSERT INTO Users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)",
      ['staff', targetEmail, '$2b$10$9GKnssj.uXBR48VA2lDN/.TWsviKjAqWbv3XU9XOkdviebF2Mj4Y6', 'staff', targetFullName]
    );
  }

  const updatedActiveUsers = await db.all("SELECT id, username, email, role, full_name FROM Users");
  console.log('Users in active DB:');
  console.table(updatedActiveUsers);

  console.log('\n--- Updating local database.sqlite ---');
  const localDbPath = join(__dirname, '../../database.sqlite');
  const localDb = await open({
    filename: localDbPath,
    driver: sqlite3.Database,
  });

  const localStaff = await localDb.get("SELECT * FROM Users WHERE role = 'staff'");
  if (localStaff) {
    await localDb.run(
      "UPDATE Users SET email = ?, full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [targetEmail, targetFullName, localStaff.id]
    );
    console.log(`Updated local database.sqlite user ID ${localStaff.id}`);
  } else {
    await localDb.run(
      "INSERT INTO Users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)",
      ['staff', targetEmail, '$2b$10$9GKnssj.uXBR48VA2lDN/.TWsviKjAqWbv3XU9XOkdviebF2Mj4Y6', 'staff', targetFullName]
    );
  }
  const localUsers = await localDb.all("SELECT id, username, email, role, full_name FROM Users");
  console.log('Users in local database.sqlite:');
  console.table(localUsers);
  await localDb.close();

  console.log('\nAll databases updated successfully!');
}

updateDb()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error updating DB:', err);
    process.exit(1);
  });
