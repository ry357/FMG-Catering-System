-- FMG Catering System Database Schema

-- Users Table (Staff and Admin only)
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('staff', 'admin') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers Table
-- Customers Table (Google OAuth2 authentication support)
CREATE TABLE IF NOT EXISTS Customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    google_id VARCHAR(255) UNIQUE,  -- Google OAuth ID token
    avatar VARCHAR(500),           -- Google profile picture
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS Bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    number_of_guests INT NOT NULL,
    budget DECIMAL(10, 2),
    preferred_package VARCHAR(100),
    additional_requests TEXT,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    booking_ref VARCHAR(50) UNIQUE,
    payment_type ENUM('full', 'down_payment') DEFAULT 'full',
    down_payment_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2),
    payment_status ENUM('pending', 'partial', 'full', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE
);

-- Sales Table
CREATE TABLE IF NOT EXISTS Sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    payment_type ENUM('full', 'down_payment', 'balance') DEFAULT 'full',
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES Bookings(id) ON DELETE CASCADE
);

-- Reports Table
CREATE TABLE IF NOT EXISTS Reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('daily', 'weekly', 'monthly', 'annual', 'monthly_summary') NOT NULL,
    report_date DATE NOT NULL,
    generated_by INT NULL,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES Users(id) ON DELETE SET NULL
);

-- EmailLogs Table
CREATE TABLE IF NOT EXISTS EmailLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(100) NOT NULL,
    email_type ENUM('booking_confirmation', 'booking_approval', 'promotional', 'anniversary_reminder') NOT NULL,
    subject VARCHAR(255),
    status ENUM('sent', 'failed') DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);


CREATE INDEX IF NOT EXISTS idx_customers_email ON Customers(email);
-- Indexes for better performance
CREATE INDEX idx_bookings_customer ON Bookings(customer_id);
CREATE INDEX idx_bookings_status ON Bookings(status);
CREATE INDEX idx_bookings_date ON Bookings(event_date);
CREATE INDEX idx_bookings_ref ON Bookings(booking_ref);
CREATE INDEX idx_sales_booking ON Sales(booking_id);
CREATE INDEX idx_sales_date ON Sales(sale_date);
CREATE INDEX idx_customers_google_id ON Customers(google_id);
CREATE INDEX idx_emaillogs_recipient ON EmailLogs(recipient_email);
CREATE INDEX idx_emaillogs_type ON EmailLogs(email_type);
