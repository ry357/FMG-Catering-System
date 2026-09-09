import bcrypt from 'bcrypt';
import { getDb, getDbType } from '../config/db.js';

async function createDefaultUsers() {
  const db = await getDb();
  const dbType = getDbType();

  try {
    if (dbType === 'postgres') {
      // PostgreSQL version
      const result = await db.query(
        `SELECT username, email, role, full_name FROM Users WHERE username IN ('admin', 'staff')`
      );

      if (result.rows.length > 0) {
        console.log('Default users already exist. Skipping creation.');
        console.log('Current users:');
        console.table(result.rows);
        await db.end();
        process.exit(0);
      }

      // Hash passwords
      const adminPassword = await bcrypt.hash('admin123', 10);
      const staffPassword = await bcrypt.hash('staff123', 10);

      // Create Admin User
      await db.query(
        `INSERT INTO Users (username, email, password_hash, role, full_name)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', 'admin@fmgcatering.com', adminPassword, 'admin', 'System Administrator']
      );

      // Create Staff User
      await db.query(
        `INSERT INTO Users (username, email, password_hash, role, full_name)
         VALUES ($1, $2, $3, $4, $5)`,
        ['staff', 'staff@fmgcatering.com', staffPassword, 'staff', 'Staff Member']
      );

      const users = await db.query('SELECT username, email, role, full_name FROM Users');
      console.log('Current users in database:');
      console.table(users.rows);
      await db.end();

    } else {
      // SQLite version
      const existingAdmin = await db.get('SELECT id FROM Users WHERE username = ?', ['admin']);
      const existingStaff = await db.get('SELECT id FROM Users WHERE username = ?', ['staff']);

      if (existingAdmin || existingStaff) {
        console.log('Default users already exist. Skipping creation.');
        console.log('Current users:');
        const users = await db.all('SELECT username, email, role, full_name FROM Users');
        console.table(users);
        process.exit(0);
      }

      // Hash passwords
      const adminPassword = await bcrypt.hash('admin123', 10);
      const staffPassword = await bcrypt.hash('staff123', 10);

      // Create Admin User
      await db.run(
        `INSERT INTO Users (username, email, password_hash, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        ['admin', 'admin@fmgcatering.com', adminPassword, 'admin', 'System Administrator']
      );

      // Create Staff User
      await db.run(
        `INSERT INTO Users (username, email, password_hash, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        ['staff', 'staff@fmgcatering.com', staffPassword, 'staff', 'Staff Member']
      );

      const users = await db.all('SELECT username, email, role, full_name FROM Users');
      console.log('Current users in database:');
      console.table(users);
    }

    console.log('✅ Default users created successfully!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin Login:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nStaff Login:');
    console.log('  Username: staff');
    console.log('  Password: staff123');
    console.log('=========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating default users:', error);
    process.exit(1);
  }
}

createDefaultUsers();