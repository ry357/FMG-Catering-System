# FMG Catering — Backend

Express 5 (ESM) API for the FMG Catering System: auth, bookings, sales, analytics, reports, email, and GCash payments via PayMongo.

## Setup

```bash
cd Server
cp .env.example .env
npm install
npm run dev
```

Server runs on **http://localhost:3001**.

Required for core functionality: `JWT_SECRET` and `DB_TYPE=sqlite` (default). Enable optional features with `PAYMONGO_SECRET_KEY` (GCash), email SMTP vars, Google OAuth, and Google Drive/Docs vars — see `.env.example`.

## Endpoints

All paths are prefixed with `/api`.

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/health` | Public | Server and provider status |
| POST | `/auth/login` | Public | Staff/admin login → JWT |
| GET | `/auth/me` | Staff/Admin | Current user profile |
| POST | `/google-auth/verify` | Staff/Admin | Verify a Google ID token |
| POST | `/bookings` | Public | Submit a booking request |
| GET | `/bookings` | Staff/Admin | List all bookings |
| PATCH | `/bookings/:id/status` | Staff/Admin | Approve / reject / complete |
| POST | `/recommendations` | Public | Budget-based package recommendations |
| GET | `/payments/config` | Public | Payment provider availability |
| POST | `/payments/gcash/create-checkout` | Public | Create GCash checkout session |
| GET | `/payments/gcash/verify/:sessionId` | Public | Verify GCash payment status |
| POST | `/sales` | Staff/Admin | Record a sale |
| GET | `/sales` | Staff/Admin | Sales history |
| GET | `/analytics/...` | Admin | Overview, packages, services, revenue, periods |
| POST | `/reports/generate` | Staff/Admin | Generate daily/weekly/monthly/annual report |
| GET | `/reports/:id/download` | Staff/Admin | Download Word/PDF report |
| CRUD | `/users` | Admin | Manage staff/admin users |
| GET | `/packages`, `/services`, `/testimonials` | Public | Landing page content |
| GET/PUT | `/email/settings` | Admin | SMTP configuration |
| POST | `/email/campaign` | Admin | Send promotional campaign |

## GCash via PayMongo

GCash payments use PayMongo Checkout with `payment_method_types: ['gcash']`. Users are redirected to the official GCash payment page and return to `/payment/success` or `/payment/cancel`; the server verifies the session with `verifyGCashPayment`.

## Reports & Google Docs

- Monthly summary reports generate Word (`.docx`) files via the `docx` package.
- With Google Docs configured (`GOOGLE_OAUTH_*` + `GOOGLE_DRIVE_SHARE_EMAIL`), the report is uploaded to Google Drive, converted to a Google Doc, and shared with the admin.
- Connectors live under `/api/reports/google-docs/*`.

## Database

Multi-engine through `config/db.js`, selected by `DB_TYPE`:

- `sqlite` — local dev database (`../database.sqlite`).
- `turso` — hosted libSQL for Vercel (`TURSO_URL`, `TURSO_AUTH_TOKEN`).
- `postgres` — staged (`PG_*` vars).

```bash
npm run init-db               # SQLite schema + default users
npm run init-postgres         # PostgreSQL schema
npm run migrate-to-turso      # Copy SQLite data to Turso
npm run create-users          # (Re)create default staff/admin
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | `node --watch index.js` |
| `npm run start` | Run server |
| `npm run init-db` | Create SQLite schema + default users |
| `npm run init-postgres` | Create PostgreSQL schema |
| `npm run migrate-to-postgres` | Migrate SQLite → PostgreSQL |
| `npm run migrate-to-turso` | Migrate SQLite → Turso |
| `npm run setup-email` | Validate email configuration |
| `npm run create-users` | (Re)create default staff/admin |
| `npm run test-email` | Send a test email |
| `npm run test-anniversary` | Send a test anniversary reminder |

## Vercel

- Deployed serverless: `vercel.json` rewrites `/api/(.*)` to the function entry `api/index.js`.
- A cron runs `POST /api/cron/monthly-report` on the 1st of each month to generate the previous month's summary and upload it to Google Docs.