# API Endpoints Reference

Base URL: `/api`

## Auth (Staff/Admin)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/login` | Public | Returns JWT |
| GET | `/auth/me` | Staff/Admin | Current user profile |

## Bookings

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/bookings` | Public | Submit new booking request |
| GET | `/bookings` | Staff/Admin | List all bookings (filterable) |
| GET | `/bookings/:id` | Staff/Admin | Single booking detail |
| PATCH | `/bookings/:id/status` | Staff/Admin | Approve, reject, complete |

## Recommendations

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/recommendations` | Public | Body: `{ eventType, guests, budget }` → ranked packages |

## Sales

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/sales` | Staff/Admin | Record sale for completed booking |
| GET | `/sales` | Staff/Admin | Sales history |
| PUT | `/sales/:id` | Staff/Admin | Update sale record |

## Analytics

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/analytics/overview` | Admin | Dashboard summary |
| GET | `/analytics/packages` | Admin | Most booked packages |
| GET | `/analytics/services` | Admin | Most popular services |
| GET | `/analytics/revenue` | Admin | Monthly revenue trends |
| GET | `/analytics/booking-periods` | Admin | Peak and low demand periods |

## Reports

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/reports/generate` | Staff/Admin | Body: `{ type: daily\|weekly\|monthly\|annual }` |
| GET | `/reports` | Staff/Admin | List generated reports |
| GET | `/reports/:id/download` | Staff/Admin | Download PDF or Excel |

## Users (Admin)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/users` | Admin | List staff/admin users |
| POST | `/users` | Admin | Create user |
| PUT | `/users/:id` | Admin | Update user |
| DELETE | `/users/:id` | Admin | Deactivate/delete user |

## Public Content

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/packages` | Public | Active packages for landing page |
| GET | `/services` | Public | Active services for landing page |
| GET | `/testimonials` | Public | Testimonials for landing page |

## Email Config (Admin)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/email/settings` | Admin | SMTP and template settings |
| PUT | `/email/settings` | Admin | Update email configuration |
| POST | `/email/campaign` | Admin | Send promotional campaign |
