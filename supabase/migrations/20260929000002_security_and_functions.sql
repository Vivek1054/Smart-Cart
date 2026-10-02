-- SmartCart: security model + server-side business logic (Phase 2)
-- RLS is enabled on EVERY table. Clients get no direct write access to orders,
-- payments, returns or stock: those go through SECURITY DEFINER functions.

-- ------------------------------------------------------------ role helpers
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'Active'
  );
$$;

create or replace function public.has_purchased(p_product_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = p_product_id
      and o.user_id = auth.uid()
      and o.status = 'Delivered'
  );
$$;

-- ----------------------------------------------- profile creation on signup
-- Role is ALWAYS 'customer' here; nothing the client sends can change that.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill profiles for any auth users that already exist
insert into public.profiles (id, email, name)
select u.id, coalesce(u.email, ''),
       coalesce(nullif(btrim(u.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
on conflict (id) do nothing;

-- Users cannot change their own role/status/email; admins cannot lock themselves out.
-- (auth.uid() is null for the SQL editor / service role, which is how the first
--  admin is promoted.)
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    if new.id is distinct from old.id or new.email is distinct from old.email then
      raise exception 'not_allowed';
    end if;
    if new.role is distinct from old.role or new.status is distinct from old.status then
      if not public.is_admin() or auth.uid() = old.id then
        raise exception 'not_allowed';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------- order triggers
-- Immutable financials, status history, restock/coupon release on cancel,
-- COD payment settlement on delivery.
create or replace function public.orders_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    if new.order_number is distinct from old.order_number
       or new.user_id is distinct from old.user_id
       or new.subtotal is distinct from old.subtotal
       or new.delivery_fee is distinct from old.delivery_fee
       or new.savings is distinct from old.savings
       or new.coupon_code is distinct from old.coupon_code
       or new.coupon_discount is distinct from old.coupon_discount
       or new.total is distinct from old.total
       or new.stock_restored is distinct from old.stock_restored then
      raise exception 'order_financials_locked';
    end if;
  end if;

  if new.status is distinct from old.status then
    if old.status = 'Cancelled' then
      raise exception 'order_cancelled';
    end if;

    if new.status = 'Cancelled' and not old.stock_restored then
      update public.products p
         set stock_count = p.stock_count + oi.qty
        from public.order_items oi
       where oi.order_id = old.id and oi.product_id = p.id;

      update public.coupons c
         set used_count = greatest(0, c.used_count - 1)
        from public.coupon_redemptions cr
       where cr.order_id = old.id and cr.coupon_id = c.id;
      delete from public.coupon_redemptions where order_id = old.id;

      update public.payments set status = 'Failed' where order_id = old.id and status = 'Pending';
      new.stock_restored := true;
    end if;

    -- cash on delivery: the cash is collected when the order is delivered
    if new.status = 'Delivered' then
      update public.payments
         set status = 'Paid', paid_at = now()
       where order_id = old.id and method = 'cod' and status = 'Pending';
    end if;
  end if;
  return new;
end $$;
create trigger orders_before_update before update on public.orders
  for each row execute function public.orders_before_update();

create or replace function public.orders_after_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger orders_after_update after update on public.orders
  for each row execute function public.orders_after_update();

-- Payments can only become 'Paid' with real confirmation:
--   * cod  -> set to Paid automatically on delivery (or by an admin)
--   * card/upi -> only by the service role (payment webhook, Razorpay stage)
create or replace function public.payments_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    if new.order_id is distinct from old.order_id
       or new.method is distinct from old.method
       or new.amount is distinct from old.amount
       or new.provider is distinct from old.provider
       or new.provider_order_id is distinct from old.provider_order_id
       or new.provider_payment_id is distinct from old.provider_payment_id then
      raise exception 'payment_locked';
    end if;
    if new.status = 'Paid' and old.status is distinct from 'Paid' and new.method <> 'cod' then
      -- allowed only from the trusted orders trigger (which is cod-only), never from a client
      raise exception 'payment_requires_confirmation';
    end if;
  end if;
  if new.status = 'Paid' and old.status is distinct from 'Paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  return new;
end $$;
create trigger payments_before_update before update on public.payments
  for each row execute function public.payments_before_update();

-- ------------------------------------------------------------------ coupons
-- Single source of truth for coupon rules (same rules as the old client code).
create or replace function public._eval_coupon(p_code text, p_subtotal numeric, p_lock boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c public.coupons;
  raw numeric;
  d numeric;
  today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if p_code is null or btrim(p_code) = '' then
    return jsonb_build_object('ok', false, 'error', 'Invalid coupon code.');
  end if;

  if p_lock then
    select * into c from public.coupons where code = upper(btrim(p_code)) for update;
  else
    select * into c from public.coupons where code = upper(btrim(p_code));
  end if;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid coupon code.');
  end if;
  if c.status <> 'Active' then
    return jsonb_build_object('ok', false, 'error', 'This coupon is no longer active.');
  end if;
  if c.expiry < today then
    return jsonb_build_object('ok', false, 'error', 'This coupon has expired.');
  end if;
  if c.used_count >= c.usage_limit then
    return jsonb_build_object('ok', false, 'error', 'This coupon has reached its usage limit.');
  end if;
  if p_subtotal < c.min_order then
    return jsonb_build_object('ok', false, 'error', 'Minimum order of ₹' || trim_scale(c.min_order)::text || ' required.');
  end if;

  raw := case when c.type = 'percentage' then p_subtotal * c.value / 100 else c.value end;
  d := round(least(raw, c.max_discount));

  return jsonb_build_object(
    'ok', true,
    'discount', d,
    'coupon', jsonb_build_object(
      'id', c.id, 'code', c.code, 'type', c.type, 'value', c.value,
      'minOrder', c.min_order, 'maxDiscount', c.max_discount
    )
  );
end $$;
revoke all on function public._eval_coupon(text, numeric, boolean) from public, anon, authenticated;

-- Preview only (cart/checkout display). place_order() re-evaluates everything.
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb language sql stable security definer set search_path = public as $$
  select public._eval_coupon(p_code, coalesce(p_subtotal, 0), false);
$$;

-- ------------------------------------------------------------- place_order
-- Atomic, server-authoritative checkout. Prices, stock, coupon, delivery fee
-- and totals are all computed here; nothing numeric is trusted from the client.
-- Any exception rolls the whole function back (no partial orders).
create or replace function public.place_order(
  p_items jsonb,
  p_shipping jsonb,
  p_coupon_code text default null,
  p_payment_method text default 'cod'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  prof public.profiles;
  r record;
  prod public.products;
  ord public.orders;
  cfg jsonb;
  fee numeric;
  free_above numeric;
  v_subtotal numeric := 0;
  v_savings numeric := 0;
  v_delivery numeric := 0;
  v_discount numeric := 0;
  v_total numeric;
  v_coupon jsonb;
  v_coupon_id bigint;
  v_coupon_code text;
  v_status text;
  s_name text  := btrim(coalesce(p_shipping ->> 'fullName', ''));
  s_email text := btrim(coalesce(p_shipping ->> 'email', ''));
  s_phone text := btrim(coalesce(p_shipping ->> 'phone', ''));
  s_line1 text := btrim(coalesce(p_shipping ->> 'line1', ''));
  s_city text  := btrim(coalesce(p_shipping ->> 'city', ''));
  s_pin text   := btrim(coalesce(p_shipping ->> 'pincode', ''));
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  select * into prof from public.profiles where id = uid;
  if not found then raise exception 'not_authenticated'; end if;
  if prof.status <> 'Active' then raise exception 'account_blocked'; end if;

  if p_payment_method not in ('card', 'upi', 'cod') then
    raise exception 'invalid_payment_method';
  end if;
  if s_name = '' or s_line1 = '' or s_city = '' or s_email !~ '^\S+@\S+\.\S+$'
     or s_phone !~ '^[0-9]{10}$' or s_pin !~ '^[0-9]{6}$' then
    raise exception 'invalid_shipping';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(product_id bigint, qty int)
    where x.product_id is null or x.qty is null or x.qty < 1 or x.qty > 99
  ) then
    raise exception 'invalid_items';
  end if;

  -- pass 1: lock products (deterministic order avoids deadlocks), check stock, price from DB
  for r in
    select x.product_id, sum(x.qty)::int as qty
    from jsonb_to_recordset(p_items) as x(product_id bigint, qty int)
    group by x.product_id order by x.product_id
  loop
    select p.* into prod
    from public.products p
    join public.categories c on c.id = p.category_id and c.status = 'Active'
    where p.id = r.product_id and p.is_active
    for update of p;
    if not found then
      raise exception 'product_unavailable';
    end if;
    if prod.stock_count < r.qty then
      raise exception 'insufficient_stock: %', prod.name;
    end if;
    v_subtotal := v_subtotal + prod.price * r.qty;
    v_savings  := v_savings + greatest(0, prod.original_price - prod.price) * r.qty;
  end loop;

  -- delivery rule (same as the old client rule: fee below the free-delivery threshold)
  select value into cfg from public.site_settings where key = 'delivery';
  fee        := coalesce((cfg ->> 'fee')::numeric, 25);
  free_above := coalesce((cfg ->> 'free_above')::numeric, 200);
  v_delivery := case when v_subtotal > 0 and v_subtotal < free_above then fee else 0 end;

  -- coupon (row-locked so usage_limit can't be exceeded by concurrent orders)
  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    v_coupon := public._eval_coupon(p_coupon_code, v_subtotal, true);
    if not (v_coupon ->> 'ok')::boolean then
      raise exception 'coupon_invalid: %', v_coupon ->> 'error';
    end if;
    v_discount    := (v_coupon ->> 'discount')::numeric;
    v_coupon_id   := ((v_coupon -> 'coupon') ->> 'id')::bigint;
    v_coupon_code := (v_coupon -> 'coupon') ->> 'code';
  end if;

  v_total  := greatest(0, v_subtotal + v_delivery - v_discount);
  -- COD is confirmed immediately; card/UPI stay Pending until payment is verified.
  v_status := case when p_payment_method = 'cod' then 'Confirmed' else 'Pending' end;

  insert into public.orders (
    user_id, status, subtotal, delivery_fee, savings, coupon_code, coupon_discount, total,
    ship_name, ship_email, ship_phone, ship_line1, ship_city, ship_pincode
  ) values (
    uid, v_status, v_subtotal, v_delivery, v_savings, v_coupon_code, v_discount, v_total,
    s_name, s_email, s_phone, s_line1, s_city, s_pin
  ) returning * into ord;

  -- pass 2: order items (snapshots) + stock decrement
  for r in
    select x.product_id, sum(x.qty)::int as qty
    from jsonb_to_recordset(p_items) as x(product_id bigint, qty int)
    group by x.product_id order by x.product_id
  loop
    select * into prod from public.products where id = r.product_id;
    insert into public.order_items (order_id, product_id, name, image, price, qty)
    values (ord.id, prod.id, prod.name, prod.image, prod.price, r.qty);
    update public.products set stock_count = stock_count - r.qty where id = prod.id;
  end loop;

  insert into public.order_status_history (order_id, status, changed_by) values (ord.id, v_status, uid);
  insert into public.payments (order_id, method, status, amount)
  values (ord.id, p_payment_method, 'Pending', v_total);

  if v_coupon_id is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon_id;
    insert into public.coupon_redemptions (coupon_id, order_id, user_id, discount)
    values (v_coupon_id, ord.id, uid, v_discount);
  end if;

  delete from public.cart_items where user_id = uid;

  return jsonb_build_object(
    'id', ord.id, 'order_number', ord.order_number, 'status', ord.status,
    'subtotal', ord.subtotal, 'delivery_fee', ord.delivery_fee, 'savings', ord.savings,
    'coupon_discount', ord.coupon_discount, 'total', ord.total,
    'payment_method', p_payment_method, 'payment_status', 'Pending'
  );
end $$;

-- ------------------------------------------------------------- request_return
create or replace function public.request_return(p_order_id bigint, p_order_item_id bigint, p_reason text)
returns public.returns
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ord public.orders;
  itm public.order_items;
  v_amount numeric;
  res public.returns;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if p_reason is null or btrim(p_reason) = '' then raise exception 'reason_required'; end if;

  select * into ord from public.orders where id = p_order_id and user_id = uid;
  if not found then raise exception 'order_not_found'; end if;
  if ord.status <> 'Delivered' then raise exception 'return_not_allowed'; end if;

  if p_order_item_id is not null then
    select * into itm from public.order_items where id = p_order_item_id and order_id = ord.id;
    if not found then raise exception 'order_not_found'; end if;
    v_amount := itm.price * itm.qty;
  else
    v_amount := ord.total;
  end if;

  if exists (
    select 1 from public.returns
    where order_id = ord.id and order_item_id is not distinct from p_order_item_id
      and status in ('Requested', 'Approved', 'Completed')
  ) then
    raise exception 'return_exists';
  end if;

  insert into public.returns (order_id, order_item_id, user_id, reason, amount)
  values (ord.id, p_order_item_id, uid, btrim(p_reason), v_amount)
  returning * into res;
  return res;
end $$;

-- ---------------------------------------------------------------- merge cart
-- Guest cart -> account cart on login (quantities add up, capped at 99).
create or replace function public.merge_cart(p_items jsonb)
returns void language sql security invoker set search_path = public as $$
  insert into public.cart_items (user_id, product_id, qty)
  select auth.uid(), x.product_id, least(sum(x.qty), 99)::int
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as x(product_id bigint, qty int)
  join public.products p on p.id = x.product_id and p.is_active
  where x.qty > 0 and auth.uid() is not null
  group by x.product_id
  on conflict (user_id, product_id)
  do update set qty = least(public.cart_items.qty + excluded.qty, 99);
$$;

-- ----------------------------------------------------------------- RLS
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_reviews      enable row level security;
alter table public.cart_items           enable row level security;
alter table public.wishlist_items       enable row level security;
alter table public.addresses            enable row level security;
alter table public.coupons              enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.coupon_redemptions   enable row level security;
alter table public.payments             enable row level security;
alter table public.returns              enable row level security;
alter table public.site_settings        enable row level security;

-- profiles: own row (+ admin all). No client INSERT/DELETE (trigger creates rows).
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- categories: public sees Active; admin manages all
create policy categories_select on public.categories for select to anon, authenticated
  using (status = 'Active' or public.is_admin());
create policy categories_admin_write on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- products: public sees active products in active categories; admin manages all.
-- Customers can NEVER write products (so never stock).
create policy products_select on public.products for select to anon, authenticated
  using ((is_active and exists (select 1 from public.categories c where c.id = category_id and c.status = 'Active'))
         or public.is_admin());
create policy products_admin_write on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- reviews: public sees Approved; owner sees own; admin moderates.
-- Customers may only create a Pending review for a product they received.
create policy reviews_select on public.product_reviews for select to anon, authenticated
  using (status = 'Approved' or user_id = (select auth.uid()) or public.is_admin());
create policy reviews_insert_own on public.product_reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'Pending'
    and author = 'Verified Buyer'
    and public.has_purchased(product_id)
  );
create policy reviews_admin_update on public.product_reviews for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy reviews_admin_delete on public.product_reviews for delete to authenticated
  using (public.is_admin());

-- cart / wishlist / addresses: strictly owner-only
create policy cart_owner on public.cart_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy wishlist_owner on public.wishlist_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy addresses_owner on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- coupons: only currently-usable coupons are public (the checkout suggestions
-- need them); admin sees/manages all. Discounts are computed server-side.
create policy coupons_select on public.coupons for select to anon, authenticated
  using ((status = 'Active'
          and expiry >= (now() at time zone 'Asia/Kolkata')::date
          and used_count < usage_limit)
         or public.is_admin());
create policy coupons_admin_write on public.coupons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- orders & children: owner reads own, admin reads all. Only admins can UPDATE
-- (status). Nobody inserts/deletes directly: place_order() does that.
create policy orders_select on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy orders_admin_update on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy order_items_select on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_admin())));
create policy order_history_select on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_admin())));
create policy redemptions_select on public.coupon_redemptions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- payments: owner reads own; admin reads/updates (guarded by trigger); no client insert.
create policy payments_select on public.payments for select to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_admin())));
create policy payments_admin_update on public.payments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- returns: owner reads own (created via request_return()); admin manages.
create policy returns_select on public.returns for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy returns_admin_update on public.returns for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- site settings: public read (banner, store name, delivery rule); admin write
create policy settings_select on public.site_settings for select to anon, authenticated
  using (true);
create policy settings_admin_write on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- grants
-- Least privilege: RLS decides row access, GRANT decides which operations exist at all.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.categories, public.products, public.product_reviews,
                public.coupons, public.site_settings, public.catalog_products to anon;

grant select on public.categories, public.products, public.product_reviews,
                public.coupons, public.site_settings, public.catalog_products,
                public.profiles, public.cart_items, public.wishlist_items, public.addresses,
                public.orders, public.order_items, public.order_status_history,
                public.coupon_redemptions, public.payments, public.returns,
                public.admin_customers
  to authenticated;

grant insert, update, delete on public.cart_items, public.wishlist_items, public.addresses to authenticated;
grant update on public.profiles to authenticated;
grant insert on public.product_reviews to authenticated;
-- admin-only by RLS:
grant insert, update, delete on public.categories, public.products, public.coupons, public.site_settings to authenticated;
grant update, delete on public.product_reviews to authenticated;
grant update on public.orders, public.payments, public.returns to authenticated;

grant execute on function public.is_admin()                          to anon, authenticated;
grant execute on function public.validate_coupon(text, numeric)      to anon, authenticated;
grant execute on function public.has_purchased(bigint)               to authenticated;
grant execute on function public.place_order(jsonb, jsonb, text, text) to authenticated;
grant execute on function public.request_return(bigint, bigint, text)  to authenticated;
grant execute on function public.merge_cart(jsonb)                   to authenticated;

-- keep future objects locked down by default too
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;
