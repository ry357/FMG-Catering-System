# Database Schema Reference

## Users

Staff and admin accounts only. No customer accounts.

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | Auto increment |
| name | VARCHAR(100) | |
| email | VARCHAR(150) | Unique |
| password_hash | VARCHAR(255) | bcrypt |
| role | ENUM('staff','admin') | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## Customers

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| name | VARCHAR(100) | |
| contact_number | VARCHAR(20) | |
| email | VARCHAR(150) | |
| created_at | TIMESTAMP | |

## Bookings

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| customer_id | INT FK | → Customers |
| event_type | VARCHAR(50) | e.g., Wedding, Birthday, Corporate |
| event_date | DATE | |
| number_of_guests | INT | |
| budget | DECIMAL(10,2) | |
| preferred_package_id | INT FK | Nullable |
| additional_requests | TEXT | Nullable |
| status | ENUM | pending, approved, rejected, completed |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## Sales

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| booking_id | INT FK | → Bookings |
| amount | DECIMAL(10,2) | Revenue |
| sale_date | DATE | |
| notes | TEXT | Nullable |
| created_at | TIMESTAMP | |

## Reports

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| report_type | ENUM | daily, weekly, monthly, annual |
| period_start | DATE | |
| period_end | DATE | |
| file_path | VARCHAR(255) | PDF or Excel path |
| generated_by | INT FK | → Users |
| created_at | TIMESTAMP | |

## EmailLogs

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| recipient_email | VARCHAR(150) | |
| email_type | ENUM | confirmation, approval, promotional, anniversary |
| booking_id | INT FK | Nullable |
| subject | VARCHAR(255) | |
| status | ENUM | sent, failed |
| sent_at | TIMESTAMP | |

## Supporting Tables (recommended)

### Packages

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| name | VARCHAR(100) | |
| description | TEXT | |
| price_per_guest | DECIMAL(10,2) | |
| min_guests | INT | |
| max_guests | INT | |
| supported_event_types | JSON or VARCHAR | Comma-separated or JSON array |
| is_active | BOOLEAN | |

### Services

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| name | VARCHAR(100) | |
| description | TEXT | |
| is_active | BOOLEAN | |

### RetentionSchedule

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| customer_id | INT FK | |
| booking_id | INT FK | |
| event_type | VARCHAR(50) | |
| original_event_date | DATE | |
| scheduled_email_date | DATE | Anniversary minus ~30 days |
| sent | BOOLEAN | Default false |
