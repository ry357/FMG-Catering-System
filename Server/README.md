# FMG Catering — Payment Server

Handles PayPal and GCash (via PayMongo) payments for booking deposits.

## Setup

1. Copy `.env.example` to `.env`
2. Add your credentials:

| Variable | Source |
|----------|--------|
| `PAYPAL_CLIENT_ID` | [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox) |
| `PAYPAL_CLIENT_SECRET` | Same PayPal app |
| `PAYMONGO_SECRET_KEY` | [PayMongo Dashboard](https://dashboard.paymongo.com) — use test key for development |

3. Install and run:

```bash
cd server
npm install
npm run dev
```

Server runs on **http://localhost:3001**

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server and provider status |
| GET | `/api/payments/config` | Payment provider availability |
| POST | `/api/payments/paypal/create-order` | Create PayPal order |
| POST | `/api/payments/paypal/capture-order` | Capture PayPal payment |
| POST | `/api/payments/gcash/create-checkout` | Create GCash checkout session |
| GET | `/api/payments/gcash/verify/:sessionId` | Verify GCash payment status |

## GCash via PayMongo

GCash payments use PayMongo Checkout with `payment_method_types: ['gcash']`. Users are redirected to the official GCash payment page and returned to `/payment/success` or `/payment/cancel`.

## PayPal

PayPal orders are created and captured server-side using the PayPal REST API. The frontend renders PayPal Smart Buttons via `@paypal/react-paypal-js`.
