# SmartCart API (Node.js + Express)

An API layer on top of the existing Supabase project. Supabase stays the database
(PostgreSQL), the login system (Auth) and the security layer (Row Level Security).
There is **no second login system** and no second database.

```
React/Vite (Vercel) ──► Express (Render) ──► Supabase (Postgres · Auth · RLS)
                                        └──► Razorpay (later, webhook)
```

## How security works

* **Identity** comes only from the Supabase access token: `Authorization: Bearer <token>`.
  `requireAuth` asks Supabase Auth to verify it, then loads the caller's `profiles` row
  (role + status). A `user_id`, `role` or `isAdmin` in a request body is never used.
* **Every authenticated query runs *as the user*.** The API builds a Supabase client with the
  public anon key **plus the user's JWT**, so Postgres sees `auth.uid()` and RLS decides what is
  visible/writable — the same rules the browser has. A bug in a route can't expose another
  user's cart/orders; RLS still blocks it.
* **Admin routes** (`/api/v1/admin/*`) need `requireAuth` **and** `requireAdmin`
  (`profiles.role = 'admin'`, read from the database). RLS enforces the same rule independently.
* **Checkout** (`POST /orders`) reads the user's server-side cart and calls the
  `place_order()` database function: prices, stock, coupon, delivery fee and totals are
  computed inside one transaction. The request may not contain any price/total/discount
  (unknown fields are rejected with 400).
* **The service-role key is not used by any route.** It is optional and reserved for the
  Razorpay webhook (no user session there). Never put it in the frontend or in git.
* Helmet, CORS allow-list (no `*`), rate limits (global 300/min, coupons 30/min, orders 20/min),
  body size limit (100 kB), Zod validation on every input, one error envelope, no stack
  traces/DB messages/tokens in responses or logs.

## Run locally

```bash
cd backend
npm install
cp .env.example .env        # then fill it in (see below)
npm run dev                 # http://localhost:5000
```

`.env` (only the first two are required):

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_ANON_KEY` | The **public** anon/publishable key (same one the frontend uses) |
| `FRONTEND_URL` | Allowed browser origin(s), comma-separated. Dev: `http://localhost:5173` |
| `PORT` | Local default `5000`. On Render it is provided for you |
| `NODE_ENV` | `development` / `production` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Optional, backend only.** Bypasses RLS. Not needed yet |

The frontend needs `VITE_API_URL=http://localhost:5000` (see `frontend/.env.example`).

**Before the API can work, apply the migrations** in `supabase/migrations/` (see `supabase/README.md`).
Check with `GET /api/ready` → `{"status":"ok","database":"connected"}`.

## Health checks

| URL | Auth | Meaning |
|---|---|---|
| `GET /api/health` | none | Process is up. Cheap, no database call. Use this for uptime monitors / Render health check |
| `GET /api/ready` | none | Also proves the database is reachable and the schema is applied (`503` otherwise) |

There is intentionally **no self-ping/keep-alive loop** in the server. Point an external monitor
(e.g. UptimeRobot, Better Stack) at `https://<your-service>.onrender.com/api/health`.

## Tests

```bash
npm test          # HTTP-layer tests, no database needed (routing, 401s, validation, CORS, headers, rate limit)
npm run test:live # full flow against your real Supabase (needs migrations + "Confirm email" OFF)
```

`test:live` signs up two throw-away customers and exercises cart, wishlist, addresses, coupons,
checkout, order isolation and privilege escalation. To include the admin section, export an admin
account in the git-ignored `backend/.env` (or your shell) - never in chat or committed files:

```bash
TEST_ADMIN_EMAIL=you@example.com
TEST_ADMIN_PASSWORD=your-admin-password
```

Test data left behind: the `smartcart-test-*@example.com` users. With admin credentials the test
orders are cancelled at the end (stock and coupon usage are restored). To remove the users:
Supabase Dashboard → Authentication → Users → delete `smartcart-test-*` (their profiles cascade).

## API (all under `/api/v1`, JSON envelope `{ success, data, meta? }`)

Errors: `{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "…", "details"?: [] } }`

**Public**
`GET /products?search&category&minPrice&maxPrice&minRating&deals&sort&page&limit` ·
`GET /products/:id` · `GET /categories` · `GET /products/:productId/reviews` ·
`POST /coupons/validate` `{ code, items?: [{productId, qty}] }`

**Signed-in customer**
Cart: `GET /cart` · `POST /cart/items` · `PATCH /cart/items/:productId` · `DELETE /cart/items/:productId` · `DELETE /cart` · `POST /cart/merge` (guest cart → account)
Wishlist: `GET /wishlist` · `POST /wishlist/:productId` · `DELETE /wishlist/:productId` · `GET /wishlist/:productId/check`
Addresses: `GET/POST /addresses` · `PATCH/DELETE /addresses/:id`
Orders: `POST /orders` `{ shipping, couponCode?, paymentMethod }` · `GET /orders` · `GET /orders/:id` · `GET /orders/:id/status` · `POST /orders/:id/reorder` · `POST /orders/:id/return`
Returns: `GET /returns` · `GET /returns/:id`
Reviews: `POST /products/:productId/reviews` (created as *Pending*) · `PATCH /reviews/:id` (own review; goes back to *Pending*)

`:id` for orders is the order number (`SC10000001`) or the numeric id.

**Admin** (`/admin/...`)
`GET dashboard` · `GET customers`, `GET customers/:id`, `PATCH customers/:id/status` ·
`GET orders`, `GET orders/:id`, `PATCH orders/:id/status` ·
`GET/POST products`, `PATCH/DELETE products/:id` · `GET inventory`, `PATCH inventory/:id` ·
`GET/POST categories`, `PATCH/DELETE categories/:id` · `GET reviews`, `PATCH reviews/:id` ·
`GET payments` · `GET returns`, `PATCH returns/:id` ·
`GET/POST coupons`, `PATCH/DELETE coupons/:id`

The dashboard is one database function (`admin_dashboard()`); with no data it returns zeros and empty lists.

## Payments (Razorpay is NOT implemented yet)

Every order gets a `payments` row (`Pending`). COD becomes `Paid` automatically when an admin marks
the order `Delivered`. Card/UPI stay `Pending`: a database trigger stops *anyone* except the
service role from setting them to `Paid`. Card numbers/CVV are never collected or stored.
See `src/services/payment.service.js` for the planned flow:
create Razorpay order (server) → Checkout in the browser → signed webhook → service role marks `Paid`.

## Deploy to Render

1. Push the repo to GitHub.
2. Render → **New → Web Service** → pick the repo.
3. Settings:
   * **Root Directory:** `backend`
   * **Runtime:** Node
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Health Check Path:** `/api/health`
4. **Environment variables** (Render → Environment):
   * `SUPABASE_URL`
   * `SUPABASE_ANON_KEY`
   * `FRONTEND_URL` = your Vercel URL(s), e.g. `https://smartcart.vercel.app` (comma-separated, no trailing slash)
   * `NODE_ENV` = `production`
   * `PORT` — **do not set it**; Render injects it and the server already listens on `process.env.PORT` at `0.0.0.0`.
   * `SUPABASE_SERVICE_ROLE_KEY` — leave unset for now.
5. Deploy, then open `https://<service>.onrender.com/api/ready` — expect `"database":"connected"`.
6. In **Vercel** set `VITE_API_URL=https://<service>.onrender.com` and redeploy the frontend.
7. In Supabase → Authentication → URL Configuration, set the Site URL to the Vercel URL and add `<vercel-url>/reset-password` to Redirect URLs.

Render Free spins the service down after ~15 min idle, so the first request after a pause is slow
(cold start). An external uptime monitor on `/api/health` keeps it warm; nothing inside the app does.

## Layout

```
backend/src
├── config/        env.js (validated env), supabase.js (anon / per-user / service clients)
├── middleware/    auth, admin, validate, rateLimit, error, notFound
├── routes/        catalog, shopper (cart · wishlist · addresses · coupons · orders · returns), admin
├── services/      Supabase queries + business rules (thin: the database owns the hard invariants)
├── validators/    Zod schemas
└── utils/         AppError + Supabase error mapping, logger (no secrets), response helpers
```
