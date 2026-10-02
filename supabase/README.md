# SmartCart · Supabase backend

Supabase is the backend (PostgreSQL + Auth + RLS). There is no separate server.
The frontend talks to it with the public **publishable/anon** key only.

## 1. Apply the migrations

Project ref: `ttlgsrmnhvbpqhuttdbm`

**Option A – Supabase CLI (recommended)**

```bash
cd SmartCart
npx supabase login
npx supabase link --project-ref ttlgsrmnhvbpqhuttdbm     # asks for the DB password
npx supabase db push
```

**Option B – SQL Editor** (Dashboard → SQL Editor → New query). Paste and run, in this order:

1. `migrations/20260929000001_schema.sql`
2. `migrations/20260929000002_security_and_functions.sql`
3. `migrations/20260929000003_seed_data.sql`
4. `migrations/20260930000004_backend_support.sql` (review editing + `admin_dashboard()` used by the Express API)

The seed is idempotent. Migrations 1, 2 and 4 create objects and are meant to be run once each.

## 2. Dashboard settings

- **Authentication → Providers → Email**
  - For development turn **Confirm email OFF** so sign-up logs the user in immediately.
    (With it ON, the app already handles it: signup shows "check your email" and sends the user to /login.)
  - Keep "Minimum password length" at 6 (the signup form validates 6).
- **Authentication → URL Configuration**
  - Site URL: your deployed URL (and `http://localhost:5173` for local dev).
  - Add `<site>/reset-password` to **Redirect URLs** so password-reset emails land on the app.

## 3. Create the first admin

Admins are never created from the app. Sign up normally (`/signup`) with the email you want
to use as admin, then promote it **in the SQL Editor** (the editor runs as the database owner,
which is the only place the role guard allows this):

```sql
update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL';
```

Then log in at `/admin/login`. To demote/block someone later use the same editor,
or the Block/Unblock button on the admin customer page (blocking works from the app; promoting does not).

## 4. Tests

`tests/rls.test.mjs` applies every migration to an in-process Postgres (PGlite) with a stub of
Supabase's `auth` schema and runs 100+ checks: RLS isolation, privilege escalation attempts,
atomic checkout, stock, coupons, payments, reviews, returns.

```bash
cd supabase/tests && npm install && npm test
```

## What is where

| Area | Tables / functions |
|---|---|
| Identity | `profiles` (role, status) created by a trigger on `auth.users`; `is_admin()` |
| Catalog | `categories`, `products`, `product_reviews`, view `catalog_products` |
| Shopper state | `cart_items`, `wishlist_items`, `addresses`, RPC `merge_cart` |
| Coupons | `coupons`, `coupon_redemptions`, RPC `validate_coupon` (preview) |
| Checkout | RPC `place_order` (atomic, server-side pricing) → `orders`, `order_items`, `order_status_history`, `payments` |
| After-sales | `returns`, RPC `request_return` |
| Site | `site_settings` (`promo_banner`, `delivery`, `store`) |

## Razorpay (next stage)

`payments` already has `provider`, `provider_order_id`, `provider_payment_id`, `paid_at`.
A card/UPI payment can only become `Paid` from the **service role** (Edge Function + webhook);
clients and admins are blocked by a trigger. COD becomes `Paid` automatically when an order is marked `Delivered`.
