import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../database.sqlite');

const pgPool = new pg.Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'fmg_catering',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
});

async function migrateToPostgres() {
  console.log('Starting migration from SQLite to PostgreSQL...');

  try {
    // Connect to SQLite
    const sqliteDb = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Connect to PostgreSQL
    const pgClient = await pgPool.connect();

    // Migrate Users
    console.log('Migrating Users...');
    const users = await sqliteDb.all('SELECT * FROM Users');
    for (const user of users) {
      try {
        await pgClient.query(
          `INSERT INTO Users (username, email, password_hash, role, full_name, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (username) DO NOTHING`,
          [user.username, user.email, user.password_hash, user.role, user.full_name, user.created_at, user.updated_at]
        );
      } catch (error) {
        console.error(`Error migrating user ${user.username}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${users.length} users`);

    // Migrate Customers
    console.log('Migrating Customers...');
    const customers = await sqliteDb.all('SELECT * FROM Customers');
    for (const customer of customers) {
      try {
        await pgClient.query(
          `INSERT INTO Customers (name, email, phone, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email) DO NOTHING`,
          [customer.name, customer.email, customer.phone, customer.created_at, customer.updated_at]
        );
      } catch (error) {
        console.error(`Error migrating customer ${customer.email}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${customers.length} customers`);

    // Migrate Bookings
    console.log('Migrating Bookings...');
    const bookings = await sqliteDb.all('SELECT * FROM Bookings');
    for (const booking of bookings) {
      try {
        await pgClient.query(
          `INSERT INTO Bookings (customer_id, event_type, event_date, number_of_guests, budget, preferred_package, additional_requests, status, booking_ref, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (booking_ref) DO NOTHING`,
          [
            booking.customer_id,
            booking.event_type,
            booking.event_date,
            booking.number_of_guests,
            booking.budget,
            booking.preferred_package,
            booking.additional_requests,
            booking.status,
            booking.booking_ref,
            booking.created_at,
            booking.updated_at
          ]
        );
      } catch (error) {
        console.error(`Error migrating booking ${booking.booking_ref}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${bookings.length} bookings`);

    // Migrate Sales
    console.log('Migrating Sales...');
    const sales = await sqliteDb.all('SELECT * FROM Sales');
    for (const sale of sales) {
      try {
        await pgClient.query(
          `INSERT INTO Sales (booking_id, amount, payment_method, payment_status, transaction_id, sale_date)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [sale.booking_id, sale.amount, sale.payment_method, sale.payment_status, sale.transaction_id, sale.sale_date]
        );
      } catch (error) {
        console.error(`Error migrating sale ${sale.id}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${sales.length} sales`);

    // Migrate Reports
    console.log('Migrating Reports...');
    const reports = await sqliteDb.all('SELECT * FROM Reports');
    for (const report of reports) {
      try {
        await pgClient.query(
          `INSERT INTO Reports (report_type, report_date, generated_by, file_path, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [report.report_type, report.report_date, report.generated_by, report.file_path, report.created_at]
        );
      } catch (error) {
        console.error(`Error migrating report ${report.id}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${reports.length} reports`);

    // Migrate EmailLogs
    console.log('Migrating EmailLogs...');
    const emailLogs = await sqliteDb.all('SELECT * FROM EmailLogs');
    for (const emailLog of emailLogs) {
      try {
        await pgClient.query(
          `INSERT INTO EmailLogs (recipient_email, email_type, subject, status, sent_at, error_message)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [emailLog.recipient_email, emailLog.email_type, emailLog.subject, emailLog.status, emailLog.sent_at, emailLog.error_message]
        );
      } catch (error) {
        console.error(`Error migrating email log ${emailLog.id}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${emailLogs.length} email logs`);

    await sqliteDb.close();
    await pgClient.release();
    await pgPool.end();

    console.log('\n✅ Migration completed successfully!');
    console.log('⚠️  Make sure to update DB_TYPE=postgres in your .env file');
    console.log('⚠️  You can delete the SQLite database file after verifying migration');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateToPostgres();