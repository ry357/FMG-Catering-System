# FMG Catering — Frontend

React 19 + Vite 6 + Tailwind CSS client for the FMG Catering System. Public landing, booking with budget recommendations, and GCash payments.

## Setup

```bash
cd Client
cp .env.example .env
npm install
npm run dev
```

Set your Google Client ID in `Client/.env` (used for booking identity):

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

The dev server proxies `/api` to the backend on `http://localhost:3001` (see `vite.config.js`). Start the backend first — see the root `README.md` or `Server/README.md`.

## Pages & Routing

| Route | Page |
|-------|------|
| `/` | Landing (hero, services, packages, testimonials, contact) |
| `/book` | Booking form + budget recommendations + GCash payment |
| `/payment/success` | Payment confirmation |
| `/payment/cancel` | Payment cancelled |
| `/login` | Staff/admin login (JWT) |
| `/staff/dashboard` | Staff dashboard (bookings, sales, reports) |
| `/admin/dashboard` | Admin dashboard (users, analytics, trends, reports) |

Staff/admin pages are wrapped in `ProtectedRoute` and check roles via `AuthContext`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (proxies `/api` to port 3001) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Layout

```
src/
├── components/   # landing/, admin/, payment/, layout/, ui/ + ProtectedRoute
├── pages/        # Route-level pages
├── context/      # AuthContext (staff/admin JWT + google identity)
├── services/     # googleAuthService, paymentService
├── utils/        # booking, payment, and general helpers
└── data/         # Landing page static content
```

## Notes

- The client is deployed on Vercel; `vercel.json` rewrites `/api/*` to the backend server and SPA routes to `index.html`.