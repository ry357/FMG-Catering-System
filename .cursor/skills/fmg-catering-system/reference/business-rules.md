# Business Rules Reference

## Budget-Based Package Recommendations

Rule-based decision support. **Not machine learning.**

### Input

- `eventType` — must match package `supported_event_types`
- `guests` — must be within package `min_guests` to `max_guests`
- `budget` — total event budget in currency

### Filtering

1. Exclude inactive packages
2. Exclude packages that do not support the event type
3. Exclude packages where `guests` is outside min/max range
4. Exclude packages where estimated total (`price_per_guest * guests`) exceeds `budget`

### Ranking (fit score)

```
fitScore = (estimatedTotal / budget) * 0.6 + (guestCapacityMatch) * 0.4
```

- `estimatedTotal` = `price_per_guest * guests`
- `guestCapacityMatch` = 1.0 if guests near package sweet spot, lower if at extremes
- Return top 3 packages sorted by fit score descending

### Response Copy

Use: "Recommended packages based on your event details"
Avoid: "AI-powered", "machine learning", "smart algorithm"

## Booking Validation

| Field | Rules |
|-------|-------|
| name | Required, 2–100 chars |
| contact_number | Required, valid phone format |
| email | Required, valid email format |
| event_type | Required, from allowed list |
| event_date | Required, must be future date |
| number_of_guests | Required, integer ≥ 1 |
| budget | Required, positive number |
| preferred_package_id | Optional, must exist if provided |
| additional_requests | Optional, max 1000 chars |

## Booking Status Transitions

```
pending → approved | rejected
approved → completed
rejected → (terminal)
completed → (terminal, triggers sale + retention)
```

## Customer Retention / Anniversary Email

**Trigger:** Booking marked `completed`

**Store:** customer name, event type, event date, email

**Schedule:** `scheduled_email_date = anniversary_date - 30 days`

**Example:** Birthday booked June 15, 2025 → promotional email May 15, 2026

**Cron job:** Daily check `RetentionSchedule` where `scheduled_email_date = today` AND `sent = false`

## Analytics Calculations

| Metric | Query Logic |
|--------|-------------|
| Most booked package | `COUNT(*)` on bookings grouped by `preferred_package_id`, status in (approved, completed) |
| Most popular service | Join packages/services; count by service association |
| Monthly revenue | `SUM(amount)` from sales grouped by `YEAR(sale_date), MONTH(sale_date)` |
| Peak booking periods | `COUNT(*)` bookings grouped by month, order DESC |
| Low-demand periods | Same query, order ASC |

## Report Generation

| Type | Period |
|------|--------|
| Daily | Previous calendar day |
| Weekly | Previous Mon–Sun |
| Monthly | Previous calendar month |
| Annual | Previous calendar year |

**Contents:** booking counts, revenue totals, top packages, status breakdown.

**Export:** PDF (summary layout) and Excel (tabular data).

## Email Notification Types

| Type | Trigger |
|------|---------|
| confirmation | Booking submitted (status pending) |
| approval | Staff approves booking |
| promotional | Admin campaign or anniversary reminder |
| anniversary | Retention schedule cron (1 year prior) |

All emails logged in `EmailLogs` with status `sent` or `failed`.
