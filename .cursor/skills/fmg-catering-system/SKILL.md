---
name: fmg-catering-system
description: >-
  FMG Catering web system for bookings, sales, rule-based analytics, automated
  reporting, and email notifications. Use when building or modifying features
  for this catering management project, including booking flows, budget
  recommendations, sales tracking, reports, analytics, or customer retention
  emails.
---

# FMG Catering System

## Quick Reference

| Topic | File |
|-------|------|
| Database schema | [reference/database-schema.md](reference/database-schema.md) |
| API endpoints | [reference/api-endpoints.md](reference/api-endpoints.md) |
| Business rules | [reference/business-rules.md](reference/business-rules.md) |

## Feature Checklist

When implementing a feature, verify:

- [ ] Input validation (client + server)
- [ ] Correct role access (public / staff / admin)
- [ ] Email notification triggered if applicable
- [ ] Analytics data source updated if applicable
- [ ] Responsive UI with gold/white theme
- [ ] No ML terminology in code or UI copy

## Landing Page Sections

Hero → About Us → Services → Packages → Testimonials → Contact → Book Now

## Booking Flow

1. Client fills form (all fields validated)
2. Optional: call `/api/recommendations` with event type, guests, budget
3. Display rule-based package suggestions
4. Submit booking → status `pending`
5. Send confirmation email → log to `EmailLogs`
6. Staff reviews in dashboard → approve/reject
7. On approval: send approval email
8. On completion: record sale, store retention data for anniversary email

## Budget Recommendations (Rule-Based)

Analyze: event type, number of guests, budget.

Return packages where `price_per_guest * guests <= budget` and event type is supported. Rank by fit score (budget utilization, guest capacity). **Not machine learning.**

## Analytics (Predefined Logic)

- Most booked package — `COUNT` grouped by package
- Most popular service — join bookings to services
- Monthly revenue trends — `SUM(sales.amount)` by month
- Peak/low booking periods — `COUNT` bookings by month/week

## Automated Reporting

Generate daily, weekly, monthly, annual reports. Export PDF and Excel. Store metadata in `Reports` table.

## Customer Retention

When booking status = `completed`, store customer name, event type, event date, email.

Schedule promotional email 1 year before next anniversary (e.g., birthday June 15 2025 → email May 15 2026).

## Development Model

Extreme Programming (XP): Planning → Design → Coding → Testing → Feedback → Deployment.

Evaluate against ISO/IEC 25010 and UTAUT usability principles.
