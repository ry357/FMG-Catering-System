# FMG Catering — Frontend

React + Vite + Tailwind CSS landing page with GCash and PayPal booking payments.

## Setup

### 1. Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Add your PayPal Client ID to `client/.env`:
```
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### 2. Payment server (required for payments)

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Configure PayPal and PayMongo credentials in `server/.env`. See `server/README.md`.

Open [http://localhost:5173](http://localhost:5173).

## Booking & Payment Flow

1. **Event Details** — Fill in booking form and select a package
2. **Payment** — Pay 30% deposit via GCash or PayPal
3. **Confirmation** — Receive booking reference and transaction ID

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (proxies `/api` to port 3001) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Payment Methods

| Method | Provider | Notes |
|--------|----------|-------|
| **PayPal** | PayPal REST API | Smart Buttons, server-side capture |
| **GCash** | PayMongo Checkout | Redirects to official GCash payment page |

## Notes

- Static mock data in `src/data/landingData.js` — database integration coming later
- Completed bookings stored in `sessionStorage` until backend is connected
