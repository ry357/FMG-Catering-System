import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'fmg_catering',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
});

async function initializePostgresDatabase() {
  const client = await pool.connect();

  try {
    console.log('Initializing PostgreSQL database...');

    // Users Table (Staff and Admin only)
    await client.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK(role IN ('staff', 'admin')),
        full_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address VARCHAR(255),
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customer OTP Sessions Table (email OTP login)
    await client.query(`
      CREATE TABLE IF NOT EXISTS CustomerOtpSessions (
        id VARCHAR(36) PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE
      )
    `);

    // Reviews Table (logged-in customers leave testimonials)
    await client.query(`
      CREATE TABLE IF NOT EXISTS Reviews (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        name VARCHAR(100) NOT NULL,
        event_type VARCHAR(50),
        rating INTEGER NOT NULL DEFAULT 5,
        quote TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE SET NULL
      )
    `);

    // Bookings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Bookings (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_date DATE NOT NULL,
        number_of_guests INTEGER NOT NULL,
        budget DECIMAL(10, 2),
        preferred_package VARCHAR(100),
        additional_requests TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
        booking_ref VARCHAR(50) UNIQUE,
        payment_type VARCHAR(20) DEFAULT 'full' CHECK(payment_type IN ('full', 'down_payment')),
        down_payment_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK(payment_status IN ('pending', 'partial', 'full', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE
      )
    `);

    // Sales Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Sales (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
        transaction_id VARCHAR(255),
        payment_type VARCHAR(20) DEFAULT 'full' CHECK(payment_type IN ('full', 'down_payment', 'balance')),
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES Bookings(id) ON DELETE CASCADE
      )
    `);

    // Reports Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Reports (
        id SERIAL PRIMARY KEY,
        report_type VARCHAR(30) NOT NULL CHECK(report_type IN ('daily', 'weekly', 'monthly', 'annual', 'monthly_summary')),
        report_date DATE NOT NULL,
        generated_by INTEGER,
        file_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (generated_by) REFERENCES Users(id) ON DELETE SET NULL
      )
    `);

    // EmailLogs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS EmailLogs (
        id SERIAL PRIMARY KEY,
        recipient_email VARCHAR(100) NOT NULL,
        email_type VARCHAR(50) NOT NULL CHECK(email_type IN ('booking_confirmation', 'booking_approval', 'promotional', 'anniversary_reminder')),
        subject VARCHAR(255),
        status VARCHAR(20) DEFAULT 'sent' CHECK(status IN ('sent', 'failed')),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT
      )
    `);

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_customers_email ON Customers(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_customers_google_id ON Customers(google_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_customer ON Bookings(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_status ON Bookings(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_date ON Bookings(event_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_ref ON Bookings(booking_ref)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_sales_booking ON Sales(booking_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_sales_date ON Sales(sale_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_emaillogs_recipient ON EmailLogs(recipient_email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_emaillogs_type ON EmailLogs(email_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_customer_otp_customer ON CustomerOtpSessions(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reviews_status ON Reviews(status)');

    console.log('✅ PostgreSQL database initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing PostgreSQL database:', error);
    throw error;
  } finally {
    client.release();
  }

  await pool.end();
  process.exit(0);
}

initializePostgresDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});