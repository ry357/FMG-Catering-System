# FMG Catering System

Web-based catering management for internal sales optimization, analytics, automated reporting, and customer booking.

- **Public clients** browse services and packages, book events, receive budget-based recommendations, and get email confirmations — no login required.
- **Staff and Admin** manage bookings, sales, reports, and customer requests via JWT-authenticated dashboards.
- **Admin only** additionally manages users, analytics, reports, email configuration, and Google Docs report delivery.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 6, Tailwind CSS, Recharts |
| Backend | Node.js, Express 5 (ESM) |
| Database | SQLite (development) / Turso libSQL (Vercel) / PostgreSQL (staged) |
| Auth | JWT (Staff + Admin), Google OAuth ID tokens (Customers) |
| Payments | GCash via PayMongo Checkout |
| Email | Nodemailer (SMTP) |
| Reports | Word (`.docx`) via `docx`, PDF via `pdfkit`; uploads to Google Drive/Docs |
| Deployment | Vercel (frontend + serverless API, cron-driven reports) |

## Roles & Access

| Role | Auth | Access |
|------|------|--------|
| Public Client | Google OAuth-verified email only | Landing, services, packages, booking, budget recommendations, GCash payment, email notifications |
| Staff | JWT | Bookings, sales, reports, customer requests |
| Admin | JWT | All staff capabilities + users, analytics, email config, Google Docs delivery |

> **Constraint:** Never add a customer login/portal. Admin and staff routes are never exposed publicly.

## Project Structure

```
FMG-Catering System/
├── Client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # landing/, admin/, payment/, layout/, ui/ + ProtectedRoute
│   │   ├── pages/              # Landing, Booking, PaymentSuccess/Cancel, Login, Staff/Admin dashboards
│   │   ├── context/            # AuthContext (staff/admin JWT)
│   │   ├── services/           # googleAuthService, paymentService
│   │   ├── utils/              # booking, payment, general helpers
│   │   └── data/               # landing page static content
│   └── vercel.json             # SPA rewrites + /api proxy to server
├── Server/                     # Express backend (ESM)
│   ├── api/index.js            # Vercel serverless entry point
│   ├── app.js                  # Express app + global rate limits
│   ├── index.js                # Local dev entry (listens + local report job)
│   ├── routes/                 # auth, googleAuth, bookings, sales, users, analytics,
│   │                           # reports, recommendations, payments, content, email
│   ├── middleware/             # JWT auth, role guards, rate limiting, validators
│   ├── services/               # email, payment, reports, analytics, cost model, Google Docs
│   ├── jobs/                   # Scheduled report generation (local dev)
│   ├── config/                 # Multi-backend DB adapter (sqlite/turso/postgres)
│   ├── scripts/                # DB init, migrations, seeding, email tests
│   └── data/                   # Menu/package catalog (static)
├── Database/
│   └── schema.sql              # Canonical schema (MySQL-flavored, cross-engine)
└── database.sqlite             # Local development database
```

## System Workflow

```
Client visits → browses services → books event → enters budget
→ receives recommendations → submits booking → confirmation email
→ booking reviewed by staff → approved/rejected → GCash deposit/settled payment
→ sale recorded → analytics updated → reports generated
→ anniversary reminder email (1 year prior)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Server

```bash
cd Server
cp .env.example .env
npm install
npm run dev          # http://localhost:3001
```

### 2. Client

```bash
cd Client
cp .env.example .env
npm install
npm run dev          # http://localhost:5173 (proxies /api to :3001)
```

## Environment Variables

### Server (`Server/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DB_TYPE` | dev | `sqlite` (default), `turso`, or `postgres` |
| `JWT_SECRET` | dev | Sign staff/admin JWTs |
| `PAYMONGO_SECRET_KEY` | payments | GCash checkout via PayMongo |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | email | Gmail SMTP |
| `GOOGLE_CLIENT_ID` | OAuth | Verify Google ID tokens for customers |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` / `GOOGLE_OAUTH_REFRESH_TOKEN` | reports | Upload reports to Google Drive/Docs (OAuth option) |
| `GOOGLE_DRIVE_SHARE_EMAIL` | reports | Recipient the generated document is shared with |
| `CRON_SECRET` | production | Guard `POST /api/cron/monthly-report` |
| `PORT` / `CLIENT_URL` | dev | Server port / allowed CORS origin |

Full reference with Turso and service-account options: `Server/.env.example`.

### Client (`Client/.env`)

Only `VITE_GOOGLE_CLIENT_ID` (Google sign-in for booking identity) — see `Client/.env.example`.

## Database

One schema (`Database/schema.sql`) is adapted at runtime to the active engine:

- **SQLite** — default local dev DB at `database.sqlite` (auto-created).
- **Turso (libSQL)** — hosted SQLite used on Vercel; set `DB_TYPE=turso` plus `TURSO_URL` / `TURSO_AUTH_TOKEN`.
- **PostgreSQL** — staged for Supabase; set `DB_TYPE=postgres` plus `PG_*` vars.

Relevant scripts (`Server/scripts`):

```bash
npm run init-db               # create SQLite schema + default users
npm run init-postgres         # create PostgreSQL schema
npm run migrate-to-turso      # copy SQLite data to Turso
npm run create-users          # (re)create default staff/admin
npm run setup-email           # validate SMTP config
```

## API Overview

All endpoints live under `/api`.

| Group | Key endpoints | Access |
|-------|---------------|--------|
| `auth` | `POST /auth/login`, `GET /auth/me`, `POST /auth/otp/send`, `POST /auth/otp/verify` | Public login; `/me` staff/admin |
| `google-auth` | `POST /google-auth/verify` | Staff/admin (Google ID token) |
| `bookings` | `POST /bookings` (public submit), `GET /bookings`, `PATCH /bookings/:id/status` | Submit public; management staff/admin |
| `recommendations` | `POST /recommendations` — `{ eventType, guests, budget }` → ranked packages | Public |
| `payments` | `GET /payments/config`, `POST /payments/gcash/create-checkout`, `GET /payments/gcash/verify/:sessionId` | Public |
| `sales` | `POST /sales`, `GET /sales`, `PUT /sales/:id` | Staff/admin |
| `analytics` | `GET /analytics/overview`, `/packages`, `/services`, `/revenue`, `/booking-periods` | Admin |
| `reports` | `POST /reports/generate`, `GET /reports`, `GET /reports/:id/download`, google-docs endpoints | Staff/admin |
| `users` | CRUD `/users` | Admin |
| `content` | `GET /packages`, `/services`, `/testimonials` | Public |
| `email` | `GET/PUT /email/settings`, `POST /email/campaign` | Admin |

## Payments

GCash payments go through **PayMongo Checkout** (`payment_method_types: ['gcash']`). The flow:

1. Client books → deposit or full amount is calculated.
2. Server creates a checkout session (`createGCashCheckout`) and returns `checkout_url`.
3. Client is redirected to the official GCash page; on return they land on `/payment/success` or `/payment/cancel`.
4. Payment status is verified with `verifyGCashPayment`.

Set `PAYMONGO_SECRET_KEY` in `Server/.env` to enable the GCash option in the booking UI.

## Reports & Google Docs

- Monthly summary reports are generated as Word (`.docx`) — and optionally PDF.
- In production, **Vercel Cron** hits `POST /api/cron/monthly-report` on the 1st of every month (`Server/vercel.json`); locally the `jobs/monthlyReportJob.js` interval handles it.
- If Google Docs is configured, the finished report is uploaded to Google Drive, converted to a Google Doc, and shared with the admin automatically.

## Scripts Quick Reference

| Location | Command | Description |
|----------|---------|-------------|
| `Client` | `npm run dev` | Vite dev server (proxies `/api` → :3001) |
| `Client` | `npm run build` | Production build |
| `Server` | `npm run dev` | `node --watch index.js` |
| `Server` | `npm run start` | Run server |
| `Server` | `npm run init-db` | Create SQLite schema + default users |
| `Server` | `npm run init-postgres` | Create PostgreSQL schema |
| `Server` | `npm run migrate-to-turso` | Migrate SQLite → Turso |
| `Server` | `npm run create-users` | (Re)create default staff/admin |
| `Server` | `npm run test-email` | Send a test email |
| `Server` | `npm run test-anniversary` | Send a test anniversary reminder |

## Deployment (Vercel)

- **Server** — `Server/vercel.json` rewrites `/api/(.*)` to the serverless function; `maxDuration` 60s; cron for monthly reports.
- **Client** — `Client/vercel.json` rewrites `/api/(.*)` to `https://fmg-catering-server.vercel.app/api/$1` and SPA routes to `/index.html`.
- Set all `Server/.env` values as Vercel environment variables and `DB_TYPE=turso` for a hosted database.

## Domain Notes

- Budget recommendations and analytics are **rule-based** (defines, cost model, and revenue ranks) — not machine learning.
- UTAUT-oriented UX: clean, modern, responsive, easy to navigate.
- ISO/IEC 25010 quality attributes (performance, usability, security, reliability, etc.) apply to all features.
- Branding: white background, gold accents, professional catering presentation.