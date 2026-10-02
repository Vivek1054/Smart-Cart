# 🛒 SmartCart

**A full-stack e-commerce platform with a React storefront, a hardened Express API, and a Supabase (Postgres) backend where authorization is enforced by Row-Level Security — not just application code.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Validation-Zod-3E67B1)](https://zod.dev/)

---

## 📖 Overview

SmartCart is a complete e-commerce application (currently seeded as a sandwich/food storefront) built across three cooperating layers:

- **`frontend/`** — a React 19 + Vite single-page app covering the full customer journey (browse, cart, wishlist, checkout, account) and a parallel admin console (catalog, orders, customers, payments, coupons, analytics).
- **`backend/`** — an Express 5 REST API that sits between the frontend and Supabase, verifying every request's identity, re-validating input with Zod, and running all business logic (cart, checkout, coupons, reviews, admin operations) through a Supabase client scoped to the calling user.
- **`supabase/`** — the Postgres schema, SQL functions/RPCs, and Row-Level Security (RLS) policies that are the actual source of truth for authorization. Checkout, coupon validation, and dashboard aggregation are implemented as atomic Postgres functions (`place_order`, `validate_coupon`, `admin_dashboard`), not client-side logic.

The guiding principle throughout the backend design is: **identity and authorization are derived from a verified Supabase JWT and enforced in the database — the API and UI only mirror that state.**

---

## ✨ Key Features

### Storefront
- Product catalog with search, category/price/rating filters, deals, and sorting
- Product detail pages with reviews (review editing resets status to `Pending` for re-moderation)
- Cart and wishlist, persisted server-side per user (with guest-cart merge on login)
- Multi-address checkout with coupon codes and order placement
- Order history, order status tracking, reorder, and return requests
- Supabase-authenticated accounts with profile management and password reset

### Admin Console
- Dashboard & analytics backed by a single Postgres aggregation function
- Product, category, and inventory management
- Order management with status transitions and order detail drill-down
- Customer management (view, block/unblock)
- Review moderation, coupon & promotion management, returns handling, payments overview
- Role-gated admin login — a route only a user with `profiles.role = 'admin'` can use

### Platform-level
- Supabase Auth for sign-up/login/password reset, with app-level profile/role data in `public.profiles`
- Row-Level Security on every table — the database rejects unauthorized access even if the API layer were bypassed
- Atomic, server-computed checkout (`place_order()` RPC) — prices/totals are never trusted from the client
- Rate limiting, Helmet security headers, strict CORS allow-list, and Zod request validation on the API
- Liveness (`/api/health`) and readiness (`/api/ready`) probes for deployment health checks

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 6, React Router 7, Tailwind CSS 3 + DaisyUI, Framer Motion, React Icons, React Slick |
| **Backend** | Node.js (≥18.18), Express 5, Zod, Helmet, CORS, express-rate-limit, dotenv |
| **Database / Auth** | Supabase (Postgres, Supabase Auth, Row-Level Security, Postgres functions/RPCs) |
| **Tooling** | ESLint 9, Node's built-in test runner (`node --test`), PGlite (in-memory Postgres for RLS tests) |
| **Deployment** | Vercel (frontend), Render (backend API), Supabase Cloud (database) |

---

## 🏗️ Architecture

```
┌─────────────────────┐      HTTPS       ┌─────────────────────┐      service role (reserved)
│   React + Vite SPA   │ ───────────────▶ │   Express API        │ ───────────────▶  (Razorpay webhook,
│   (Vercel)           │ ◀─────────────── │   (Render)            │                    not yet built)
└──────────┬───────────┘   JSON / REST    └──────────┬───────────┘
           │                                          │
           │ anon key (public reads, RLS-limited)     │ per-user client (anon key + user JWT)
           ▼                                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Supabase (Postgres + Auth)                    │
│  • Row-Level Security on every table                              │
│  • SQL functions: place_order(), validate_coupon(),                │
│    admin_dashboard(), has_purchased(), merge_cart(), ...           │
│  • Auth trigger creates a profiles row for every new user          │
└──────────────────────────────────────────────────────────────────┘
```

**Two ways the frontend talks to data, by design:**
1. **Directly to Supabase** (via `@supabase/supabase-js` with the public anon key) for catalog browsing, auth, and most reads/writes — protected entirely by RLS.
2. **Through the Express API** (`frontend/src/services/api.js`, bearer-authenticated with the Supabase access token) for operations that need server-side orchestration: checkout, coupon validation, returns, reviews, and all admin endpoints.

This means authorization is never a single point of failure — even if the Express layer were skipped entirely, RLS policies in Postgres independently enforce the same rules.

---

## 📁 Project Structure

```
SmartCart/
├── frontend/                  # React + Vite SPA
│   └── src/
│       ├── Pages/             # Customer-facing pages (Home, Menu, Cart, Checkout, Account, ...)
│       ├── admin/
│       │   ├── Pages/         # Admin console pages (Dashboard, Orders, Products, Analytics, ...)
│       │   └── components/    # Admin layout, sidebar, data table, KPI cards, product form
│       ├── Components/        # Shared storefront components (Navbar, CouponInput, NotificationBell, ...)
│       ├── context/           # AuthContext, AdminAuthContext, CartContext, WishlistContext, CatalogContext, ToastContext
│       ├── data/               # Supabase-backed data-access modules (catalog, orders, cart, notifications, ...)
│       ├── services/           # api.js — authenticated client for the Express backend
│       ├── lib/                 # Supabase client setup, error helpers
│       └── ui/                  # Shared UI primitives (Button, Modal, Drawer, Skeleton, charts, ...)
│
├── backend/                    # Express REST API
│   └── src/
│       ├── routes/              # catalog, shopper, admin route definitions
│       ├── services/            # Business logic (cart, order, coupon, payment, review, wishlist, address, admin)
│       ├── middleware/          # auth, admin, validation, rate limiting, error handling
│       ├── config/               # Env validation (Zod), Supabase client factories
│       └── validators/           # Zod request schemas
│
└── supabase/                    # Database layer
    ├── migrations/                # Schema, RLS policies & functions, seed data, backend support
    └── tests/                     # RLS/business-logic tests against an in-memory Postgres (PGlite)
```

---

## 🔐 Authentication & Authorization

- **Authentication** is handled entirely by **Supabase Auth** (`supabase.auth.signUp` / `signInWithPassword` / `signOut` / `resetPasswordForEmail`). A database trigger (`handle_new_user`) automatically creates a matching row in `public.profiles` for every new `auth.users` record.
- **Authorization** is layered:
  1. The **Express API** verifies the Supabase JWT on every protected request (`requireAuth` middleware — `supabase.auth.getUser(token)`), loads the caller's `profiles` row, and rejects blocked accounts (`status != 'Active'`).
  2. Admin routes are additionally gated by `requireAdmin` (`profiles.role === 'admin'`).
  3. Every database query — whether issued directly by the frontend or proxied through the API — runs through a **per-user Supabase client** (anon key + that user's JWT), so **Postgres Row-Level Security policies apply regardless of the calling layer.**
- The frontend's `AuthContext`/`AdminAuthContext` only *mirror* this state for UI purposes (e.g., showing/hiding admin links) — they are not a security boundary. As the code itself documents: *"Roles are enforced by the database (RLS), not by this UI state."*
- There is **no admin signup flow** — the first admin is promoted manually via SQL (`update public.profiles set role = 'admin' where email = '...'`), as documented in [`supabase/README.md`](supabase/README.md).

---

## 🔌 API Documentation

All routes are mounted under `/api/v1` unless noted. Responses follow a single envelope: `{ success, data, meta? }` on success, `{ success: false, error: { code, message, details? } }` on failure.

<details>
<summary><strong>Health</strong></summary>

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness probe — no auth, no DB call |
| GET | `/api/ready` | Readiness probe — also checks database connectivity |

</details>

<details>
<summary><strong>Catalog (public)</strong></summary>

| Method | Path | Description |
|---|---|---|
| GET | `/products` | List/search/filter products (search, category, price range, rating, deals, sort, pagination) |
| GET | `/products/:id` | Get a single product |
| GET | `/categories` | List categories |
| GET | `/products/:productId/reviews` | List approved reviews for a product |
| POST | `/products/:productId/reviews` | Create a review *(auth required)* |
| PATCH | `/reviews/:id` | Update own review *(auth required — resets status to `Pending`)* |

</details>

<details>
<summary><strong>Shopper (authenticated)</strong></summary>

| Method | Path | Description |
|---|---|---|
| GET / POST / PATCH / DELETE | `/cart`, `/cart/items`, `/cart/items/:productId` | Manage server-side cart |
| POST | `/cart/merge` | Merge a guest cart into the signed-in account |
| GET / POST / DELETE | `/wishlist`, `/wishlist/:productId` | Manage wishlist |
| GET | `/wishlist/:productId/check` | Check if a product is wishlisted |
| GET / POST / PATCH / DELETE | `/addresses`, `/addresses/:id` | Manage saved addresses |
| POST | `/coupons/validate` | Validate a coupon against cart items (rate-limited) |
| POST | `/orders` | Place an order via the `place_order()` RPC (rate-limited) |
| GET | `/orders`, `/orders/:id`, `/orders/:id/status` | List / view orders and status |
| POST | `/orders/:id/reorder` | Reorder a previous order |
| POST | `/orders/:id/return` | Request a return |
| GET | `/returns`, `/returns/:id` | View return requests |

</details>

<details>
<summary><strong>Admin (requires <code>role = 'admin'</code>)</strong></summary>

| Method | Path | Description |
|---|---|---|
| GET | `/admin/dashboard` | Aggregated metrics via `admin_dashboard()` RPC |
| GET / PATCH | `/admin/customers`, `/admin/customers/:id`, `/admin/customers/:id/status` | Manage customers |
| GET / PATCH | `/admin/orders`, `/admin/orders/:id`, `/admin/orders/:id/status` | Manage orders |
| GET / POST / PATCH / DELETE | `/admin/products`, `/admin/products/:id` | Manage products |
| GET / PATCH | `/admin/inventory`, `/admin/inventory/:id` | Manage stock levels |
| GET / POST / PATCH / DELETE | `/admin/categories`, `/admin/categories/:id` | Manage categories |
| GET / PATCH | `/admin/reviews`, `/admin/reviews/:id` | Moderate reviews |
| GET | `/admin/payments` | View payments |
| GET / PATCH | `/admin/returns`, `/admin/returns/:id` | Manage returns |
| GET / POST / PATCH / DELETE | `/admin/coupons`, `/admin/coupons/:id` | Manage coupons |

</details>

Full endpoint-level detail (and the security rationale behind it) also lives in [`backend/README.md`](backend/README.md).

---

## 🗄️ Database

Managed entirely through Supabase, with four ordered SQL migrations in [`supabase/migrations/`](supabase/migrations):

| Migration | Purpose |
|---|---|
| `20260929000001_schema.sql` | Core tables (`profiles`, `categories`, `products`, `product_reviews`, `cart_items`, `wishlist_items`, `addresses`, `coupons`, `orders`, `order_items`, `order_status_history`, `coupon_redemptions`, `payments`, `returns`, `site_settings`) plus `catalog_products` / `admin_customers` views |
| `20260929000002_security_and_functions.sql` | RLS policies, `is_admin()`, `has_purchased()`, `handle_new_user()` auth trigger, `place_order()`, `validate_coupon()`, `merge_cart()`, `request_return()`, and related guard triggers |
| `20260929000003_seed_data.sql` | Idempotent seed data for categories, products, coupons, and site settings |
| `20260930000004_backend_support.sql` | Review-editing policy and the `admin_dashboard()` aggregation function |

Payments are modeled with provider fields (`provider`, `provider_order_id`, `provider_payment_id`, `paid_at`) ready for a future Razorpay integration (see [Future Improvements](#-future-improvements)).

---

## ✅ Prerequisites

- **Node.js** ≥ 18.18 and npm
- A **Supabase** project (free tier is sufficient) with the Supabase CLI (`npx supabase`) for applying migrations
- Git

---

## ⚙️ Installation & Setup

```bash
git clone <repository-url>
cd SmartCart
```

### 1. Database (Supabase)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push        # applies all 4 migrations
```
(Or paste the migration files into the Supabase SQL Editor in numeric order.) Then, in the Supabase dashboard: disable "Confirm email" for local development convenience, and set the Site URL / redirect URLs once you know your frontend origin. See [`supabase/README.md`](supabase/README.md) for full detail, including how to promote the first admin user.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env    # fill in your Supabase project values
npm run dev              # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # fill in Supabase + backend API URL
npm run dev               # http://localhost:5173
```

---

## 🔑 Environment Variables

**`frontend/.env`** (all `VITE_` variables are public/browser-exposed by design):

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public/anon key |
| `VITE_API_URL` | Base URL of the Express backend (e.g. `http://localhost:5000`) |

**`backend/.env`**:

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` |
| `PORT` | Local port (default `5000`); omit in production on platforms like Render that inject their own |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase public/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | *Optional.* Backend-only, bypasses RLS. Reserved for a future Razorpay webhook — unused by current routes. **Never** expose this to the frontend. |
| `FRONTEND_URL` | Comma-separated list of allowed CORS origins (e.g. `http://localhost:5173`) |

> ⚠️ Never commit real `.env` files or secrets. Use the provided `.env.example` files as templates.

---

## 🖥️ Development Commands

| Location | Command | Description |
|---|---|---|
| `frontend/` | `npm run dev` | Start the Vite dev server |
| `frontend/` | `npm run lint` | Run ESLint |
| `backend/` | `npm run dev` | Start the API with auto-reload (`node --watch`) |
| `backend/` | `npm run verify:db` | Sanity-check the connected Supabase database |

## 📦 Build & Production

| Location | Command | Description |
|---|---|---|
| `frontend/` | `npm run build` | Production build (output in `frontend/dist/`) |
| `frontend/` | `npm run preview` | Preview the production build locally |
| `backend/` | `npm start` | Start the API in production mode |

---

## 🚀 Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | **Vercel** | `frontend/vercel.json` includes an SPA rewrite so client-side routes survive refresh/direct navigation |
| Backend | **Render** | Root directory `backend`, build `npm install`, start `npm start`, health check path `/api/health` |
| Database | **Supabase Cloud** | Hosted Postgres + Auth + RLS |

Deploy steps (from [`backend/README.md`](backend/README.md)):
1. Push to GitHub.
2. On Render: create a Web Service with root directory `backend`, Node runtime, build command `npm install`, start command `npm start`, health check path `/api/health`.
3. Set backend env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FRONTEND_URL` = your Vercel URL, `NODE_ENV=production`). Leave `PORT` and `SUPABASE_SERVICE_ROLE_KEY` unset.
4. Deploy and confirm `GET /api/ready` returns healthy.
5. On Vercel, set `VITE_API_URL` to the Render URL and redeploy the frontend.
6. In Supabase Auth settings, set the Site URL to your Vercel URL and add `<vercel-url>/reset-password` to the allowed redirect URLs.

> Render's free tier cold-starts after inactivity; there is no built-in keep-alive, so an external uptime monitor pinging `/api/health` is recommended for production.

---

## 🧪 Testing

| Location | Command | What it covers |
|---|---|---|
| `backend/` | `npm test` | HTTP-layer tests (routing, auth gate, validation, CORS, error envelope, rate limiting) — no database required |
| `backend/` | `npm run test:live` | Full integration tests against a real Supabase project (cart, wishlist, addresses, coupons, checkout, order isolation, privilege-escalation attempts). Requires migrations applied, "Confirm email" disabled, and optional `TEST_ADMIN_EMAIL`/`TEST_ADMIN_PASSWORD` for the admin section. Leaves behind `smartcart-test-*@example.com` throwaway users that should be cleaned up manually. |
| `supabase/tests/` | `npm install && npm test` | 100+ Row-Level Security and business-logic checks run against an in-memory Postgres via PGlite — no live Supabase project needed |

> The frontend currently has no automated test suite (`frontend/package.json` defines no `test` script).

---

## 🩺 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend exits immediately on startup | Missing/invalid env vars | Check the console error — it lists exactly which Zod-validated variable is missing, without leaking secrets |
| `GET /api/ready` returns 503 | Supabase migrations not applied, or wrong `SUPABASE_URL`/key | Re-check `supabase db push` ran successfully against the correct project |
| Frontend requests to the API fail with CORS errors | `FRONTEND_URL` on the backend doesn't match the frontend's origin | Update `FRONTEND_URL` in `backend/.env` (comma-separated for multiple origins) |
| Login works but admin pages are inaccessible | Account's `profiles.role` isn't `admin` | Promote the account manually in the Supabase SQL editor (see `supabase/README.md`) |
| Password reset emails link to the wrong domain | Site URL/redirect URLs not configured in Supabase Auth | Set them under Authentication → URL Configuration in the Supabase dashboard |

---

## 🔄 Development Workflow

1. Apply/confirm the latest Supabase migrations against your project.
2. Run the backend (`npm run dev`) and frontend (`npm run dev`) locally against that project.
3. Validate backend changes with `npm test` (fast) and `npm run test:live` (full, against a real project) before relying on them.
4. For schema/RLS changes, add or update the corresponding checks in `supabase/tests/rls.test.mjs` and re-run `npm test` there.
5. Keep secrets out of the frontend — anything prefixed `VITE_` is shipped to the browser.

---

## 🔮 Future Improvements

Based on explicit "not yet implemented" markers in the codebase:

- **Razorpay payment integration** — the `payments` table and service layer already model provider fields (`provider`, `provider_order_id`, `provider_payment_id`), but the actual payment gateway integration (Edge Function + webhook using the service-role key) has not been built yet. Currently, COD orders are auto-marked `Paid` on delivery, and card/UPI orders remain `Pending` until this is implemented.
- Automated frontend test coverage.
- CI/CD automation (no GitHub Actions workflows currently exist in this repository).

---

## 📄 License

No license file is currently included in this repository. All rights reserved by the author unless a license is added.

## 👤 Author

**Vivek** — [GitHub](https://github.com/Vivek1054)
