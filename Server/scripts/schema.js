// Shared SQLite-compatible schema used by both the local `sqlite` driver
// and Turso (libSQL). Read it from one place so the two databases never drift.
export const SCHEMA_STATEMENTS = [
  // Users Table (Staff and Admin only)
  `
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('staff', 'admin')),
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Customers Table
  `
    CREATE TABLE IF NOT EXISTS Customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Bookings Table
  `
    CREATE TABLE IF NOT EXISTS Bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_date TEXT NOT NULL,
      number_of_guests INTEGER NOT NULL,
      budget REAL,
      preferred_package TEXT,
      additional_requests TEXT,
      menu_items TEXT,
      menu_preference TEXT,
      booking_category TEXT DEFAULT 'natural' CHECK(booking_category IN ('natural', 'drop-off')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
      booking_ref TEXT UNIQUE,
      payment_type TEXT DEFAULT 'full' CHECK(payment_type IN ('full', 'down_payment')),
      down_payment_amount REAL DEFAULT 0,
      total_amount REAL,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'partial', 'full', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE
    )
  `,

  // Sales Table
  `
    CREATE TABLE IF NOT EXISTS Sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
      transaction_id TEXT,
      payment_type TEXT DEFAULT 'full' CHECK(payment_type IN ('full', 'down_payment', 'balance')),
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES Bookings(id) ON DELETE CASCADE
    )
  `,

  // Reports Table
  `
    CREATE TABLE IF NOT EXISTS Reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_type TEXT NOT NULL CHECK(report_type IN ('daily', 'weekly', 'monthly', 'annual', 'monthly_summary')),
      report_date TEXT NOT NULL,
      generated_by INTEGER,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (generated_by) REFERENCES Users(id) ON DELETE SET NULL
    )
  `,

  // EmailLogs Table
  `
    CREATE TABLE IF NOT EXISTS EmailLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_email TEXT NOT NULL,
      email_type TEXT NOT NULL CHECK(email_type IN ('booking_confirmation', 'booking_approval', 'booking_rejected', 'promotional', 'anniversary_reminder')),
      subject TEXT,
      status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'failed')),
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      error_message TEXT
    )
  `,

  // OTP Sessions Table (persisted so login OTPs survive serverless restarts)
  `
    CREATE TABLE IF NOT EXISTS OtpSessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )
  `,

  // Customer OTP Sessions Table
  `
    CREATE TABLE IF NOT EXISTS CustomerOtpSessions (
      id TEXT PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE
    )
  `,

  // Reviews Table
  `
    CREATE TABLE IF NOT EXISTS Reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      name TEXT NOT NULL,
      event_type TEXT,
      rating INTEGER NOT NULL DEFAULT 5,
      quote TEXT NOT NULL,
      status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE SET NULL
    )
  `,

  // Activity Logs Table (admin audit trail)
  `
    CREATE TABLE IF NOT EXISTS ActivityLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'system',
      description TEXT NOT NULL,
      performed_by TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
];

export const INDEX_STATEMENTS = [
  'CREATE INDEX IF NOT EXISTS idx_bookings_customer ON Bookings(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_status ON Bookings(status)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_date ON Bookings(event_date)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_ref ON Bookings(booking_ref)',
  'CREATE INDEX IF NOT EXISTS idx_sales_booking ON Sales(booking_id)',
  'CREATE INDEX IF NOT EXISTS idx_sales_date ON Sales(sale_date)',
  'CREATE INDEX IF NOT EXISTS idx_emaillogs_recipient ON EmailLogs(recipient_email)',
  'CREATE INDEX IF NOT EXISTS idx_emaillogs_type ON EmailLogs(email_type)',
  'CREATE INDEX IF NOT EXISTS idx_customers_email ON Customers(email)',
  'CREATE INDEX IF NOT EXISTS idx_customers_google_id ON Customers(google_id)',
  'CREATE INDEX IF NOT EXISTS idx_otpsessions_user ON OtpSessions(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_customer_otp_customer ON CustomerOtpSessions(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_reviews_status ON Reviews(status)',
  'CREATE INDEX IF NOT EXISTS idx_activitylogs_created ON ActivityLogs(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_activitylogs_category ON ActivityLogs(category)',
  'CREATE INDEX IF NOT EXISTS idx_activitylogs_action ON ActivityLogs(action)',
];

// Post-CREATE migrations for databases that already exist. Each entry is a
// best-effort ALTER whose failure is ignored when the change is already applied
// (e.g. "duplicate column name"), so fresh and existing databases both work.
export const MIGRATION_STATEMENTS = [
  'ALTER TABLE Customers ADD COLUMN address TEXT',
  'ALTER TABLE Bookings ADD COLUMN menu_items TEXT',
  'ALTER TABLE Bookings ADD COLUMN menu_preference TEXT',
  // SQLite ALTER ADD COLUMN cannot carry a CHECK constraint, so existing DBs
  // get a plain DEFAULT column; fresh DBs get the full CHECK via SCHEMA_STATEMENTS.
  "ALTER TABLE Bookings ADD COLUMN booking_category TEXT DEFAULT 'natural'",
  'ALTER TABLE Customers ADD COLUMN password_hash TEXT',
];