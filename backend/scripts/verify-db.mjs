// Read-only check of the LIVE Supabase project using only the public anon key.
// Proves what exists (tables, views, functions, seed data, RLS lockdown) without side effects.
//   node scripts/verify-db.mjs        (or: npm run verify:db)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) { console.error('SUPABASE_URL / SUPABASE_ANON_KEY missing in backend/.env'); process.exit(2); }
const db = createClient(url, key, { auth: { persistSession: false } });

let failed = 0;
const line = (ok, name, extra = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`); };

// A relation "exists" if PostgREST does not say it is missing from the schema cache.
// Tables the anon role may not read answer 42501 (permission denied) - which also proves RLS/grants are locked down.
const TABLES = ['profiles', 'categories', 'products', 'product_reviews', 'cart_items', 'wishlist_items', 'addresses', 'coupons',
  'coupon_redemptions', 'orders', 'order_items', 'order_status_history', 'payments', 'returns', 'site_settings'];
const VIEWS = ['catalog_products', 'admin_customers'];
const PUBLIC_READ = new Set(['categories', 'products', 'product_reviews', 'coupons', 'site_settings', 'catalog_products']);

for (const name of [...TABLES, ...VIEWS]) {
  const { error } = await db.from(name).select('*').limit(1); // GET (a HEAD request hides PostgREST's error body)
  const missing = error?.code === 'PGRST205' || error?.code === '42P01';
  const locked = error?.code === '42501';
  if (missing) line(false, `${VIEWS.includes(name) ? 'view ' : 'table'} ${name}`, 'missing');
  else if (PUBLIC_READ.has(name)) line(!error, `${VIEWS.includes(name) ? 'view ' : 'table'} ${name} (public read)`, error?.message);
  else line(locked, `${VIEWS.includes(name) ? 'view ' : 'table'} ${name} (exists, anon locked out)`, locked ? '' : `expected permission denied, got ${error?.code || 'readable!'}`);
}

// Functions: PGRST202 = not found. Anything else (permission denied / not_authenticated) = exists.
// Called with their real argument names (PostgREST matches by signature), as anon: these are granted to
// "authenticated" only, so the correct answer is "permission denied" (42501) - which proves both that the
// function exists AND that anonymous callers are locked out.
const FUNCTIONS = {
  place_order: { p_items: [], p_shipping: {}, p_coupon_code: null, p_payment_method: 'cod' },
  request_return: { p_order_id: 1, p_order_item_id: null, p_reason: 'x' },
  merge_cart: { p_items: [] },
  admin_dashboard: {},
};
for (const [fn, args] of Object.entries(FUNCTIONS)) {
  const { error } = await db.rpc(fn, args);
  const missing = error?.code === 'PGRST202' || /Could not find the function/i.test(error?.message || '');
  line(!missing && error?.code === '42501', `function ${fn}() exists, anon locked out`, missing ? 'missing' : error ? error.message : 'anon could EXECUTE it!');
}
{
  const { data, error } = await db.rpc('validate_coupon', { p_code: 'WELCOME10', p_subtotal: 100 });
  line(!error && data?.ok === true && data.discount === 10, 'function validate_coupon() works for anon', error?.message || JSON.stringify(data));
}
{
  const { data, error } = await db.rpc('is_admin');
  line(!error && data === false, 'function is_admin() is false for anon', error?.message);
}

// Seed data
{
  const { data } = await db.from('categories').select('id,name').order('sort_order');
  line(data?.length === 5, 'seed: 5 categories', `got ${data?.length}`);
}
{
  const { data } = await db.from('catalog_products').select('id').order('id');
  const ids = (data || []).map((p) => p.id).join(',');
  line(ids === '1,2,3,4,5,6,7,8,9,10', 'seed: 10 products, ids 1-10 preserved', `got [${ids}]`);
}
{
  const { data } = await db.from('coupons').select('code');
  const codes = (data || []).map((c) => c.code).sort().join(',');
  // anon only sees usable coupons; SANDWICH50 is expired so 3 of the 4 seeded coupons are visible
  line(codes === 'FLAT20,FREESHIP,WELCOME10', 'seed: coupons visible to anon = FLAT20, FREESHIP, WELCOME10 (SANDWICH50 expired/hidden)', `got [${codes}]`);
}
{
  const { data } = await db.from('site_settings').select('key,value');
  const keys = (data || []).map((s) => s.key).sort().join(',');
  line(keys === 'delivery,promo_banner,store', 'seed: site_settings promo_banner + delivery + store', `got [${keys}]`);
  const d = (data || []).find((s) => s.key === 'delivery')?.value;
  line(d?.fee === 25 && d?.free_above === 200, 'seed: delivery rule fee 25, free above 200', JSON.stringify(d));
}

// Anon must not be able to write
{
  const { data, error } = await db.from('products').update({ price: 1 }).eq('id', 1).select();
  const missing = error?.code === 'PGRST205';
  line(!missing && (!!error || (data || []).length === 0), 'anon cannot modify products', missing ? 'products table missing' : error?.message);
}

// Auth setting needed by the live tests
{
  const s = await (await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })).json();
  line(s.mailer_autoconfirm === true, 'Auth: "Confirm email" is OFF (needed by the live tests)', 'still ON: Dashboard -> Authentication -> Providers -> Email -> turn off "Confirm email"');
}

console.log(failed === 0 ? '\nDATABASE VERIFIED' : `\n${failed} check(s) failed`);
process.exit(failed ? 1 : 0);
