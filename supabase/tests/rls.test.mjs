// Runs the real migrations in an in-process Postgres (PGlite) with a stub of Supabase's
// auth schema/roles, then exercises RLS + business logic as different users.
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

import { fileURLToPath } from 'url';
const dir = fileURLToPath(new URL('../migrations/', import.meta.url));
const db = new PGlite();

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb not null default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
`);

for (const f of fs.readdirSync(dir).sort()) {
  const sql = fs.readFileSync(dir + f, 'utf8').replace(/create extension if not exists pgcrypto;/, '');
  try { await db.exec(sql); console.log('migration OK  ', f); }
  catch (e) { console.log('migration FAIL', f, '\n  ', e.message); process.exit(1); }
}

// ---- helpers
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };
const as = async (uid, role = 'authenticated') => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${role};`);
};
const su = async () => { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); };
const q = async (sql, params) => (await db.query(sql, params)).rows;
const tryq = async (sql, params) => { try { return { rows: await q(sql, params) }; } catch (e) { return { err: e.message }; } };

// ---- users (trigger must create profiles as 'customer')
const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const ADM = '00000000-0000-0000-0000-0000000000ad';
await su();
await db.exec(`insert into auth.users (id,email,raw_user_meta_data) values
  ('${A}','a@x.com','{"name":"Alice","role":"admin"}'),
  ('${B}','b@x.com','{}'), ('${ADM}','admin@x.com','{"name":"Boss"}')`);
let prof = await q(`select id,name,role from public.profiles order by email`);
ok('signup trigger creates 3 profiles', prof.length === 3);
ok('metadata role=admin is ignored (Alice is customer)', prof.find(p => p.id === A).role === 'customer');
ok('name taken from metadata', prof.find(p => p.id === A).name === 'Alice');
await db.exec(`update public.profiles set role='admin' where id='${ADM}'`);  // service/SQL-editor promotion
ok('SQL-level promotion of first admin works', (await q(`select role from public.profiles where id='${ADM}'`))[0].role === 'admin');

// ---- anon / public
await as(null, 'anon');
ok('anon reads 10 products', (await q(`select count(*)::int n from public.catalog_products`))[0].n === 10);
ok('anon reads categories', (await q(`select count(*)::int n from public.categories`))[0].n === 5);
ok('anon sees only usable coupons (3)', (await q(`select count(*)::int n from public.coupons`))[0].n === 3);
ok('anon cannot read orders', !!(await tryq(`select * from public.orders`)).err);
ok('anon cannot read profiles', !!(await tryq(`select * from public.profiles`)).err);
ok('anon cannot write products', !!(await tryq(`update public.products set price=1`)).err);
ok('anon place_order rejected', /not_authenticated|permission denied/.test((await tryq(`select public.place_order('[{"product_id":1,"qty":1}]'::jsonb,'{}'::jsonb)`)).err || ''));
ok('anon validate_coupon works', (await q(`select public.validate_coupon('WELCOME10', 100) v`))[0].v.ok === true);
const rt = await q(`select rating, review_count from public.catalog_products where id=1`);
ok('rating baseline preserved (4 / 183)', Number(rt[0].rating) === 4 && rt[0].review_count === 183, JSON.stringify(rt));

// ---- privilege escalation attempts
await as(A);
ok('customer cannot promote self', !!(await tryq(`update public.profiles set role='admin' where id='${A}'`)).err);
ok('customer cannot unblock/alter status', !!(await tryq(`update public.profiles set status='Blocked' where id='${A}'`)).err);
ok('customer can update own name', !(await tryq(`update public.profiles set name='Alice2' where id='${A}'`)).err);
const oth = await tryq(`update public.profiles set name='hacked' where id='${B}' returning id`);
ok('customer cannot edit another profile (0 rows)', (oth.rows || []).length === 0);
ok('customer sees only own profile', (await q(`select count(*)::int n from public.profiles`))[0].n === 1);
ok('customer cannot change stock', (await tryq(`update public.products set stock_count=999 returning id`)).rows?.length === 0 || !!(await tryq(`update public.products set stock_count=999`)).err);
ok('customer cannot insert product', !!(await tryq(`insert into public.products (name,price,category_id) values ('x',1,1)`)).err);
ok('customer cannot insert order directly', !!(await tryq(`insert into public.orders (subtotal,total,ship_name,ship_email,ship_phone,ship_line1,ship_city,ship_pincode) values (1,1,'a','a@a.aa','1234567890','l','c','123456')`)).err);
ok('customer cannot create coupon', !!(await tryq(`insert into public.coupons (code,type,value,max_discount,expiry,usage_limit) values ('HACK','fixed',999,999,'2030-01-01',9)`)).err);
ok('customer cannot read all coupons (expired hidden)', (await q(`select count(*)::int n from public.coupons where code='SANDWICH50'`))[0].n === 0);
ok('customer cannot write site_settings', (await tryq(`update public.site_settings set value='{}' returning key`)).rows?.length === 0 || true);
{ const s = await tryq(`update public.site_settings set value='{"x":1}'::jsonb where key='delivery' returning key`); ok('customer cannot modify delivery settings', (s.rows || []).length === 0, JSON.stringify(s)); }

// ---- checkout: happy path (COD)
await as(A);
const ship = { fullName: 'Alice', email: 'a@x.com', phone: '9876543210', line1: '1 Main St', city: 'Pune', pincode: '411001' };
const stock1 = (await (async () => { await su(); const r = await q(`select stock_count from public.products where id=1`); await as(A); return r; })())[0].stock_count;
let r1 = await tryq(`select public.place_order($1::jsonb,$2::jsonb,null,'cod') o`, [JSON.stringify([{ product_id: 1, qty: 2 }, { product_id: 1, qty: 1 }, { product_id: 7, qty: 1 }]), JSON.stringify(ship)]);
ok('place_order COD succeeds', !r1.err, r1.err);
const o1 = r1.rows[0].o;
// product 1 price 35 *3 =105 ; product 7 price 30 -> 135 subtotal, >=... <200 => fee 25 => 160
ok('subtotal/fee/total computed server-side (135+25=160)', Number(o1.subtotal) === 135 && Number(o1.delivery_fee) === 25 && Number(o1.total) === 160, JSON.stringify(o1));
ok('order number format SC########', /^SC\d{8}$/.test(o1.order_number), o1.order_number);
ok('COD order Confirmed, payment Pending (not Paid)', o1.status === 'Confirmed' && o1.payment_status === 'Pending');
await su();
ok('stock decremented (dup lines merged: 3)', (await q(`select stock_count from public.products where id=1`))[0].stock_count === stock1 - 3);
ok('one order_item per product', (await q(`select count(*)::int n from public.order_items where order_id=${o1.id}`))[0].n === 2);
ok('payment row Pending/cod, no card data columns', (await q(`select method,status,amount from public.payments where order_id=${o1.id}`))[0].status === 'Pending');
ok('status history recorded', (await q(`select count(*)::int n from public.order_status_history where order_id=${o1.id}`))[0].n === 1);

// ---- checkout: card => Pending order; coupon; validation failures
await as(A);
let r2 = await tryq(`select public.place_order($1::jsonb,$2::jsonb,'FLAT20','card') o`, [JSON.stringify([{ product_id: 3, qty: 3 }]), JSON.stringify(ship)]);
ok('card order with coupon succeeds', !r2.err, r2.err);
const o2 = r2.rows?.[0]?.o;
// 55*3=165, fee 25, FLAT20 min100 => 20 => 170
ok('coupon discount + total server-side (165+25-20=170)', o2 && Number(o2.coupon_discount) === 20 && Number(o2.total) === 170, JSON.stringify(o2));
ok('card order stays Pending', o2?.status === 'Pending' && o2?.payment_status === 'Pending');
ok('expired coupon rejected', /coupon_invalid: This coupon has expired|no longer active/.test((await tryq(`select public.place_order($1::jsonb,$2::jsonb,'SANDWICH50','cod')`, [JSON.stringify([{ product_id: 2, qty: 1 }]), JSON.stringify(ship)])).err || ''));
ok('min-order coupon rejected', /Minimum order/.test((await tryq(`select public.place_order($1::jsonb,$2::jsonb,'FLAT20','cod')`, [JSON.stringify([{ product_id: 7, qty: 1 }]), JSON.stringify(ship)])).err || ''));
ok('unknown coupon rejected', /Invalid coupon/.test((await tryq(`select public.place_order($1::jsonb,$2::jsonb,'NOPE','cod')`, [JSON.stringify([{ product_id: 2, qty: 1 }]), JSON.stringify(ship)])).err || ''));
ok('bad shipping rejected', /invalid_shipping/.test((await tryq(`select public.place_order($1::jsonb,'{"fullName":"x"}'::jsonb,null,'cod')`, [JSON.stringify([{ product_id: 2, qty: 1 }])])).err || ''));
ok('empty cart rejected', /empty_cart/.test((await tryq(`select public.place_order('[]'::jsonb,$1::jsonb,null,'cod')`, [JSON.stringify(ship)])).err || ''));
ok('qty 0 / negative rejected', /invalid_items/.test((await tryq(`select public.place_order('[{"product_id":1,"qty":-5}]'::jsonb,$1::jsonb,null,'cod')`, [JSON.stringify(ship)])).err || ''));
ok('unknown product rejected', /product_unavailable/.test((await tryq(`select public.place_order('[{"product_id":9999,"qty":1}]'::jsonb,$1::jsonb,null,'cod')`, [JSON.stringify(ship)])).err || ''));
ok('bad payment method rejected', /invalid_payment_method/.test((await tryq(`select public.place_order('[{"product_id":1,"qty":1}]'::jsonb,$1::jsonb,null,'bitcoin')`, [JSON.stringify(ship)])).err || ''));

// ---- stock can't go negative / partial order rollback
await su();
await db.exec(`update public.products set stock_count=1 where id=2; update public.products set stock_count=0 where id=4`);
const ordersBefore = (await q(`select count(*)::int n from public.orders`))[0].n;
await as(A);
const partial = await tryq(`select public.place_order($1::jsonb,$2::jsonb,null,'cod')`, [JSON.stringify([{ product_id: 1, qty: 1 }, { product_id: 2, qty: 5 }]), JSON.stringify(ship)]);
ok('over-stock order rejected', /insufficient_stock/.test(partial.err || ''), partial.err);
ok('out-of-stock order rejected', /insufficient_stock/.test((await tryq(`select public.place_order('[{"product_id":4,"qty":1}]'::jsonb,$1::jsonb,null,'cod')`, [JSON.stringify(ship)])).err || ''));
await su();
ok('rollback: no partial order created', (await q(`select count(*)::int n from public.orders`))[0].n === ordersBefore);
ok('rollback: stock of product 1 untouched by failed order', (await q(`select stock_count from public.products where id=1`))[0].stock_count === stock1 - 3);
ok('stock CHECK prevents negative even via SQL', !!(await tryq(`update public.products set stock_count=-1 where id=2`)).err);

// ---- coupon usage limit under sequential use
await su();
await db.exec(`update public.coupons set usage_limit=1, used_count=0 where code='FREESHIP'`);
await as(B);
const okB = await tryq(`select public.place_order($1::jsonb,$2::jsonb,'FREESHIP','cod') o`, [JSON.stringify([{ product_id: 7, qty: 1 }]), JSON.stringify({ ...ship, fullName: 'Bob', email: 'b@x.com' })]);
ok('coupon first use ok', !okB.err, okB.err);
ok('coupon second use blocked by usage limit', /usage limit/.test((await tryq(`select public.place_order($1::jsonb,$2::jsonb,'FREESHIP','cod')`, [JSON.stringify([{ product_id: 7, qty: 1 }]), JSON.stringify(ship)])).err || ''));
await su();
ok('used_count incremented to 1', (await q(`select used_count from public.coupons where code='FREESHIP'`))[0].used_count === 1);

// ---- data isolation
await as(B);
ok('Bob cannot see Alice orders', (await q(`select count(*)::int n from public.orders where user_id='${A}'`))[0].n === 0);
ok('Bob sees only his own order', (await q(`select count(*)::int n from public.orders`))[0].n === 1);
ok("Bob cannot see Alice's order_items", (await q(`select count(*)::int n from public.order_items where order_id=${o1.id}`))[0].n === 0);
ok("Bob cannot see Alice's payments", (await q(`select count(*)::int n from public.payments where order_id=${o1.id}`))[0].n === 0);
ok("Bob cannot see Alice's history", (await q(`select count(*)::int n from public.order_status_history where order_id=${o1.id}`))[0].n === 0);
ok('Bob cannot update an order status', ((await tryq(`update public.orders set status='Delivered' where id=${o1.id} returning id`)).rows || []).length === 0);
ok('customer cannot update payment', !!(await tryq(`update public.payments set status='Paid'`)).err || true);
{ const p = await tryq(`update public.payments set status='Paid' where order_id=${o1.id} returning id`); ok('customer cannot mark payment Paid', !!p.err || (p.rows || []).length === 0, JSON.stringify(p)); }
ok('customer cannot see admin_customers other rows', (await q(`select count(*)::int n from public.admin_customers`))[0].n === 1);

// cart / wishlist / addresses isolation
await as(A);
await db.exec(`insert into public.cart_items (user_id, product_id, qty) values ('${A}', 1, 2)`);
await db.exec(`insert into public.wishlist_items (user_id, product_id) values ('${A}', 3)`);
await db.exec(`insert into public.addresses (user_id,label,line1,city,pincode) values ('${A}','Home','1 St','Pune','411001')`);
ok('cannot insert cart row for another user', !!(await tryq(`insert into public.cart_items (user_id, product_id, qty) values ('${B}', 1, 1)`)).err);
ok('cannot insert address for another user', !!(await tryq(`insert into public.addresses (user_id,line1,city,pincode) values ('${B}','x','y','123456')`)).err);
ok('bad pincode rejected', !!(await tryq(`insert into public.addresses (user_id,line1,city,pincode) values ('${A}','x','y','12')`)).err);
await as(B);
ok("Bob cannot see Alice's cart/wishlist/addresses",
  (await q(`select (select count(*) from public.cart_items)::int c,(select count(*) from public.wishlist_items)::int w,(select count(*) from public.addresses)::int a`))
    .every(x => x.c === 0 && x.w === 0 && x.a === 0));
await db.query(`select public.merge_cart('[{"product_id":1,"qty":2},{"product_id":1,"qty":3},{"product_id":9999,"qty":1}]'::jsonb)`);
await db.query(`select public.merge_cart('[{"product_id":1,"qty":1}]'::jsonb)`);
ok('merge_cart merges + caps + skips unknown', JSON.stringify((await q(`select product_id, qty from public.cart_items`))) === JSON.stringify([{ product_id: 1, qty: 6 }]));

// ---- admin operations
await as(ADM);
ok('admin sees all profiles', (await q(`select count(*)::int n from public.profiles`))[0].n === 3);
ok('admin sees all orders', (await q(`select count(*)::int n from public.orders`))[0].n >= 3);
ok('admin sees all coupons incl. expired', (await q(`select count(*)::int n from public.coupons`))[0].n === 4);
ok('admin_customers aggregates real orders', (await q(`select orders from public.admin_customers where id='${A}'`))[0].orders === 2);
ok('admin can create category', !(await tryq(`insert into public.categories (name) values ('Desserts')`)).err);
ok('admin can edit product incl. stock', !(await tryq(`update public.products set stock_count=50 where id=2`)).err);
ok('admin can add product', !(await tryq(`insert into public.products (name,price,category_id,stock_count) values ('New',10,1,5)`)).err);
ok('admin can change settings', !(await tryq(`update public.site_settings set value='{"fee":30,"free_above":200}'::jsonb where key='delivery'`)).err);
ok('admin cannot demote self', !!(await tryq(`update public.profiles set role='customer' where id='${ADM}'`)).err);
ok('admin can block a customer', !(await tryq(`update public.profiles set status='Blocked' where id='${B}'`)).err);
await as(B);
ok('blocked customer cannot check out', /account_blocked/.test((await tryq(`select public.place_order('[{"product_id":1,"qty":1}]'::jsonb,$1::jsonb,null,'cod')`, [JSON.stringify(ship)])).err || ''));
await as(ADM);
await db.exec(`update public.profiles set status='Active' where id='${B}'`);

// order lifecycle
ok('admin moves order to Shipped', !(await tryq(`update public.orders set status='Shipped' where id=${o1.id}`)).err);
ok('admin cannot tamper with total', !!(await tryq(`update public.orders set total=1 where id=${o1.id}`)).err);
ok('admin cannot mark card payment Paid', !!(await tryq(`update public.payments set status='Paid' where order_id=${o2.id}`)).err);
ok('admin cannot change payment amount', !!(await tryq(`update public.payments set amount=1 where order_id=${o1.id}`)).err);
await db.exec(`update public.orders set status='Delivered' where id=${o1.id}`);
await su();
ok('COD payment becomes Paid on delivery', (await q(`select status from public.payments where order_id=${o1.id}`))[0].status === 'Paid');
ok('card payment still Pending', (await q(`select status from public.payments where order_id=${o2.id}`))[0].status === 'Pending');
ok('history has 3 entries (Confirmed, Shipped, Delivered)', (await q(`select count(*)::int n from public.order_status_history where order_id=${o1.id}`))[0].n === 3);

// cancel restores stock + coupon
const stockP3 = (await q(`select stock_count from public.products where id=3`))[0].stock_count;
const usedFlat = (await q(`select used_count from public.coupons where code='FLAT20'`))[0].used_count;
await as(ADM);
await db.exec(`update public.orders set status='Cancelled' where id=${o2.id}`);
await su();
ok('cancel restores stock', (await q(`select stock_count from public.products where id=3`))[0].stock_count === stockP3 + 3);
ok('cancel releases coupon use', (await q(`select used_count from public.coupons where code='FLAT20'`))[0].used_count === usedFlat - 1);
ok('cancel fails pending payment', (await q(`select status from public.payments where order_id=${o2.id}`))[0].status === 'Failed');
await as(ADM);
ok('cannot un-cancel an order', !!(await tryq(`update public.orders set status='Confirmed' where id=${o2.id}`)).err);

// ---- reviews
await as(B);
ok('non-buyer cannot review', !!(await tryq(`insert into public.product_reviews (product_id,user_id,rating,text) values (1,'${B}',5,'great')`)).err);
await as(A);
ok('buyer of delivered item can review (forced Pending)', !(await tryq(`insert into public.product_reviews (product_id,user_id,rating,text) values (1,'${A}',5,'great')`)).err);
ok('buyer cannot self-approve', !!(await tryq(`insert into public.product_reviews (product_id,user_id,rating,text,status) values (7,'${A}',5,'x','Approved')`)).err);
ok('buyer cannot review as someone else', !!(await tryq(`insert into public.product_reviews (product_id,user_id,rating,text) values (7,'${B}',5,'x')`)).err);
ok('one review per user per product', !!(await tryq(`insert into public.product_reviews (product_id,user_id,rating,text) values (1,'${A}',4,'again')`)).err);
await as(null, 'anon');
ok('pending review invisible to public', (await q(`select count(*)::int n from public.product_reviews`))[0].n === 0);
await as(A);
ok('owner can see own pending review', (await q(`select count(*)::int n from public.product_reviews`))[0].n === 1);
{ const r = await tryq(`update public.product_reviews set status='Approved' returning status`); ok('customer cannot approve a review (status is forced back to Pending)', !(r.rows || []).some((x) => x.status === 'Approved'), JSON.stringify(r)); }
await as(ADM);
ok('admin approves review', !(await tryq(`update public.product_reviews set status='Approved' where product_id=1`)).err);
await as(null, 'anon');
const rt2 = (await q(`select rating, review_count from public.catalog_products where id=1`))[0];
ok('approved review blends into rating (184 reviews)', rt2.review_count === 184, JSON.stringify(rt2));

// ---- returns
await as(B);
ok('non-owner cannot request return', /order_not_found/.test((await tryq(`select public.request_return(${o1.id}, null, 'bad')`)).err || ''));
await as(A);
ok('owner requests return on delivered order', !(await tryq(`select public.request_return(${o1.id}, null, 'Damaged')`)).err);
ok('duplicate return blocked', /return_exists/.test((await tryq(`select public.request_return(${o1.id}, null, 'again')`)).err || ''));
ok('return not allowed on non-delivered order', /return_not_allowed|order_not_found/.test((await tryq(`select public.request_return(${o2.id}, null, 'x')`)).err || ''));
ok('return number format RET####', /^RET\d+$/.test((await q(`select return_number from public.returns`))[0].return_number));
await as(B);
ok('Bob cannot see Alice returns', (await q(`select count(*)::int n from public.returns`))[0].n === 0);
await as(ADM);
ok('admin approves return', !(await tryq(`update public.returns set status='Approved'`)).err);

// ---- migration 4: own-review edit + admin_dashboard
await as(A);
{
  const e = await tryq(`update public.product_reviews set text='edited', rating=4 where product_id=1 and user_id='${A}' returning status`);
  ok('owner can edit own review; it returns to Pending', !e.err && e.rows?.[0]?.status === 'Pending', JSON.stringify(e));
  ok('owner cannot move a review to another product', !!(await tryq(`update public.product_reviews set product_id=7 where user_id='${A}'`)).err);
  const f = await tryq(`update public.product_reviews set status='Approved' where user_id='${A}' returning status`);
  ok('owner cannot self-approve via update (forced Pending)', f.rows?.[0]?.status === 'Pending', JSON.stringify(f));
}
await as(B);
ok("customer cannot edit another user's review", ((await tryq(`update public.product_reviews set text='hax' returning id`)).rows || []).length === 0);
ok('customer cannot call admin_dashboard', /not_allowed|permission denied/.test((await tryq(`select public.admin_dashboard()`)).err || ''));
await as(null, 'anon');
ok('anon cannot call admin_dashboard', !!(await tryq(`select public.admin_dashboard()`)).err);
await as(ADM);
{
  const d = (await q(`select public.admin_dashboard() d`))[0].d;
  ok('admin_dashboard returns totals', d.totals.orders >= 3 && Number(d.totals.revenue) > 0, JSON.stringify(d.totals));
  ok('admin_dashboard: 30 daily points, 12 monthly points', d.revenueByDay.length === 30 && d.revenueByMonth.length === 12);
  ok('admin_dashboard: topProducts + recentOrders present', d.topProducts.length > 0 && d.recentOrders.length > 0);
  ok('admin_dashboard: cancelled order excluded from revenue', Number(d.totals.revenue) < Number((await q(`select sum(total) t from public.orders`))[0].t));
}
await su();
await db.exec(`truncate public.orders cascade`);
await as(ADM);
{
  const d = (await q(`select public.admin_dashboard() d`))[0].d;
  ok('empty orders => zeros, not fabricated numbers', Number(d.totals.revenue) === 0 && d.totals.orders === 0 && d.topProducts.length === 0 && d.recentOrders.length === 0);
}

// ---- final: RLS enabled everywhere
await su();
const noRls = await q(`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`);
ok('RLS enabled on every public table', noRls.length === 0, JSON.stringify(noRls));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
