-- SmartCart: support for the Express API layer (new migration, earlier ones untouched)
--   1. customers can edit their OWN review (it always goes back to moderation)
--   2. admin_dashboard(): real aggregates computed in the database

-- ------------------------------------------------------------ own-review edit
-- A customer may change the rating/text of their own review. A trigger forces the
-- status back to 'Pending' (so an edit can never bypass moderation) and freezes
-- product_id / user_id / author. Admins are unaffected and can still moderate.
create or replace function public.guard_review_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.product_id is distinct from old.product_id
       or new.user_id is distinct from old.user_id
       or new.author is distinct from old.author then
      raise exception 'not_allowed';
    end if;
    new.status := 'Pending';
  end if;
  return new;
end $$;

drop trigger if exists product_reviews_guard on public.product_reviews;
create trigger product_reviews_guard before update on public.product_reviews
  for each row execute function public.guard_review_update();

drop policy if exists reviews_update_own on public.product_reviews;
create policy reviews_update_own on public.product_reviews for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- --------------------------------------------------------------- dashboard
-- Everything the admin dashboard shows, from real rows. Empty database => zeros
-- and empty lists (nothing is fabricated). Runs as the caller (security invoker)
-- and additionally refuses non-admins.
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Kolkata')::date;
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  with rev as (
    select * from public.orders where status not in ('Cancelled', 'Returned')
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'revenue',        coalesce((select sum(total) from rev), 0),
      'orders',         (select count(*) from public.orders),
      'customers',      (select count(*) from public.profiles where role = 'customer'),
      'products',       (select count(*) from public.products),
      'todaysSales',    coalesce((select sum(total) from rev where (created_at at time zone 'Asia/Kolkata')::date = today), 0),
      'pendingOrders',  (select count(*) from public.orders where status in ('Pending', 'Processing')),
      'avgOrderValue',  coalesce((select round(avg(total)) from rev), 0),
      'lowStock',       (select count(*) from public.products where is_active and stock_count > 0 and stock_count <= 8),
      'outOfStock',     (select count(*) from public.products where is_active and stock_count = 0),
      'pendingReviews', (select count(*) from public.product_reviews where status = 'Pending'),
      'openReturns',    (select count(*) from public.returns where status = 'Requested'),
      'paymentsPaid',    (select count(*) from public.payments where status = 'Paid'),
      'paymentsPending', (select count(*) from public.payments where status = 'Pending'),
      'paymentsFailed',  (select count(*) from public.payments where status = 'Failed')
    ),
    'ordersByStatus', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status, count(*) as n from public.orders group by status) s
    ),
    'revenueByDay', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'date', d::date, 'revenue', coalesce(r.revenue, 0), 'orders', coalesce(r.n, 0)
             ) order by d), '[]'::jsonb)
      from generate_series(today - 29, today, interval '1 day') d
      left join (
        select (created_at at time zone 'Asia/Kolkata')::date as day, sum(total) as revenue, count(*) as n
        from rev group by 1
      ) r on r.day = d::date
    ),
    'revenueByMonth', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'month', to_char(m, 'YYYY-MM'), 'label', to_char(m, 'Mon'), 'revenue', coalesce(r.revenue, 0)
             ) order by m), '[]'::jsonb)
      from generate_series(date_trunc('month', today::timestamp) - interval '11 months',
                           date_trunc('month', today::timestamp), interval '1 month') m
      left join (
        select date_trunc('month', created_at at time zone 'Asia/Kolkata') as month, sum(total) as revenue
        from rev group by 1
      ) r on r.month = m
    ),
    'topProducts', (
      select coalesce(jsonb_agg(jsonb_build_object('name', name, 'units', units, 'revenue', revenue)), '[]'::jsonb)
      from (
        select oi.name, sum(oi.qty)::int as units, sum(oi.qty * oi.price) as revenue
        from public.order_items oi join rev o on o.id = oi.order_id
        group by oi.name order by units desc, oi.name limit 5
      ) t
    ),
    'recentOrders', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'orderNumber', order_number, 'customer', ship_name, 'total', total,
               'status', status, 'createdAt', created_at,
               'itemCount', (select count(*) from public.order_items oi where oi.order_id = t.id)
             ) order by created_at desc), '[]'::jsonb)
      from (select * from public.orders order by created_at desc limit 6) t
    )
  ) into result;

  return result;
end $$;

revoke all on function public.admin_dashboard() from public, anon;
grant execute on function public.admin_dashboard() to authenticated;
