# FMG Catering System — Agent Guide

Web-based catering management for internal sales optimization, analytics, automated reporting, and customer booking.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, Tailwind CSS, Chart.js |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (production) / SQLite (development) |
| Auth | JWT (Staff + Admin only) |
| Email | Nodemailer |

## Users & Access

| Role | Auth | Access |
|------|------|--------|
| Public Client | None | Landing, services, packages, booking, budget recommendations, email notifications |
| Staff | JWT | Bookings, sales, reports, customer requests |
| Admin | JWT | All staff capabilities + users, analytics, email config |

**Never** add customer login. **Never** expose admin/staff routes publicly.

## Deployment

- After every accepted change, commit, push to `main`, and deploy to Vercel (CLI, no Git integration):
  - Client: `vercel deploy --prod` in `Client/` (live: `https://fmg-catering-client.vercel.app`)
  - Server: `vercel deploy --prod` in `Server/` (live: `https://fmg-catering-server.vercel.app`)

## Core Constraints

- Budget recommendations and analytics are **rule-based** — not machine learning. Do not use ML terminology.
- White background, gold accents, professional catering branding.
- UTAUT-oriented UX: clean, modern, responsive, easy to navigate.
- ISO/IEC 25010 quality attributes apply to all features.

## Recommended Folder Structure

```
FMG-Catering System/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── hooks/
│   │   ├── services/       # API client functions
│   │   ├── utils/
│   │   └── context/        # Auth context (staff/admin only)
├── server/                 # Express backend
│   ├── routes/
│   ├── controllers/
│   ├── middleware/         # JWT auth, role guards
│   ├── services/           # Email, reports, analytics, recommendations
│   ├── jobs/               # Scheduled tasks (reports, anniversary emails)
│   └── config/
├── database/
│   ├── schema.sql
│   └── seeds/
└── .cursor/
    ├── rules/
    └── skills/
```

## Database Tables

`Users`, `Customers`, `Bookings`, `Sales`, `Reports`, `EmailLogs`

## System Workflow

```
Client visits → browses services → books event → enters budget
→ receives recommendations → submits booking → confirmation email
→ booking in dashboard → staff processes → sale recorded
→ analytics updated → reports generated → anniversary email (1 year prior)
```

## Skills & Rules

- Skill: `.cursor/skills/fmg-catering-system/SKILL.md` — domain workflows and business rules
- Rules: `.cursor/rules/` — coding standards per layer

When implementing features, read the relevant skill reference files before writing code.
