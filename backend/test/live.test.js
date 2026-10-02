// LIVE integration tests: real Supabase (Auth + Postgres + RLS) through the real Express app.
//
// Prerequisites
//   1. The 4 migrations in supabase/migrations are applied to the project in backend/.env
//   2. Supabase Auth -> Email -> "Confirm email" is OFF (tests sign users up and need a session)
//   3. (optional, enables the admin section) an admin account, given via environment variables:
//        TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD      (set them in your shell, never in chat/git)
//
// Side effects on the project: creates 2 throw-away customers (smartcart-test-*@example.com), a few
// orders, and (admin section) a product/coupon/category that are deleted again. If admin credentials
// are provided the test orders are cancelled at the end, which restores stock and coupon usage.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

process.env.NODE_ENV = 'test';
const { config } = await import('../src/config/env.js');
const { createApp } = await import('../src/app.js');

const RUN = Date.now().toString(36);
const PASSWORD = `Tt!${RUN}-pass`;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const HAS_ADMIN = !!(ADMIN_EMAIL && ADMIN_PASSWORD);

const authClient = () =>
  createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

let server;
let base;
const A = {};
const B = {};
const ADM = {};
const createdOrders = [];

const call = async (token, method, path, body) => {
  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, json, text };
};
const ok = (r, status = 200) => { assert.equal(r.status, status, r.text); assert.equal(r.json.success, true); return r.json.data; };
const err = (r, status, code) => {
  assert.equal(r.status, status, r.text);
  assert.equal(r.json.success, false);
  if (code) assert.equal(r.json.error.code, code, r.text);
  assert.ok(!/PGRST|postgres|stack|supabase\.co/i.test(r.text), `leaked internals: ${r.text}`);
  return r.json.error;
};

const signUp = async (label) => {
  const c = authClient();
  const email = `smartcart-test-${RUN}-${label}@example.com`;
  const { data, error } = await c.auth.signUp({ email, password: PASSWORD, options: { data: { name: `Test ${label.toUpperCase()}` } } });
  assert.ifError(error);
  assert.ok(data.session, 'No session after sign-up: turn OFF "Confirm email" in Supabase Auth -> Email');
  return { token: data.session.access_token, id: data.user.id, email };
};

const SHIPPING = { fullName: 'Test Buyer', email: 'buyer@example.com', phone: '9876543210', line1: '12 Test Street', city: 'Pune', pincode: '411001' };
const product = async (id) => ok(await call(null, 'GET', `/products/${id}`));

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (HAS_ADMIN && ADM.token) {
    for (const n of createdOrders) await call(ADM.token, 'PATCH', `/admin/orders/${n}/status`, { status: 'Cancelled' }); // restock + release coupons
  }
  server.close();
});

describe('readiness + public catalog', () => {
  test('GET /api/ready: database connected and schema applied', async () => {
    const res = await fetch(`${base}/api/ready`);
    assert.equal(res.status, 200, 'Database not ready - have the migrations been applied?');
    assert.deepEqual(await res.json(), { status: 'ok', service: 'SmartCart API', database: 'connected' });
  });

  test('products: list, seed ids preserved, pagination meta', async () => {
    const r = await call(null, 'GET', '/products');
    const data = ok(r);
    assert.ok(data.length >= 10);
    assert.ok(data.some((p) => p.id === 1 && p.name === 'Classic Veg Sandwich'));
    assert.equal(typeof data[0].price, 'number');
    assert.ok(r.json.meta.total >= 10);
    const p2 = ok(await call(null, 'GET', '/products?limit=3&page=2'));
    assert.equal(p2.length, 3);
  });

  test('products: search / category / price / sort filters', async () => {
    const chicken = ok(await call(null, 'GET', '/products?search=chicken'));
    assert.ok(chicken.length >= 1 && chicken.every((p) => /chicken/i.test(p.name + p.title)));
    const cheap = ok(await call(null, 'GET', '/products?maxPrice=40'));
    assert.ok(cheap.length > 0 && cheap.every((p) => p.price <= 40));
    const mid = ok(await call(null, 'GET', '/products?minPrice=40&maxPrice=60'));
    assert.ok(mid.every((p) => p.price >= 40 && p.price <= 60));
    const cat = ok(await call(null, 'GET', `/products?category=${encodeURIComponent('egg specials')}`));
    assert.ok(cat.length > 0 && cat.every((p) => p.category === 'egg specials'));
    const asc = ok(await call(null, 'GET', '/products?sort=price-asc')).map((p) => p.price);
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
    const desc = ok(await call(null, 'GET', '/products?sort=price-desc')).map((p) => p.price);
    assert.deepEqual(desc, [...desc].sort((a, b) => b - a));
    const deals = ok(await call(null, 'GET', '/products?deals=true'));
    assert.ok(deals.every((p) => p.discount >= 20));
  });

  test('products: injection-style search text is harmless', async () => {
    for (const s of ["%' or 1=1 --", '"; drop table products; --', ')),(name.ilike.%', '\\']) {
      assert.equal((await call(null, 'GET', `/products?search=${encodeURIComponent(s)}`)).status, 200);
    }
    assert.ok(ok(await call(null, 'GET', '/products')).length >= 10);
  });

  test('product detail + 404, categories', async () => {
    assert.equal((await product(1)).id, 1);
    err(await call(null, 'GET', '/products/999999'), 404, 'NOT_FOUND');
    const cats = ok(await call(null, 'GET', '/categories'));
    assert.ok(cats.length >= 5 && cats.every((c) => c.status === 'Active'));
    assert.deepEqual(ok(await call(null, 'GET', '/products/1/reviews')), []);
  });
});

describe('authentication', () => {
  test('two real Supabase users can sign up and get sessions', async () => {
    Object.assign(A, await signUp('a'));
    Object.assign(B, await signUp('b'));
    assert.notEqual(A.id, B.id);
  });

  test('valid token accepted, forged/expired tokens rejected, no token rejected', async () => {
    ok(await call(A.token, 'GET', '/cart'));
    err(await call('garbage.token.value', 'GET', '/cart'), 401, 'UNAUTHORIZED');
    err(await call(A.token + 'x', 'GET', '/cart'), 401, 'UNAUTHORIZED');
    err(await call(null, 'GET', '/cart'), 401, 'UNAUTHORIZED');
  });

  test('anon key is not accepted as a user token', async () => {
    err(await call(config.SUPABASE_ANON_KEY, 'GET', '/cart'), 401, 'UNAUTHORIZED');
  });
});

describe('customer cannot use admin APIs or escalate', () => {
  const ADMIN_ROUTES = [
    ['GET', '/admin/dashboard'], ['GET', '/admin/customers'], ['GET', '/admin/orders'], ['GET', '/admin/products'],
    ['GET', '/admin/inventory'], ['GET', '/admin/reviews'], ['GET', '/admin/payments'], ['GET', '/admin/returns'],
    ['GET', '/admin/coupons'], ['GET', '/admin/categories'],
  ];
  test('every admin GET is 403 for a customer', async () => {
    for (const [m, p] of ADMIN_ROUTES) err(await call(A.token, m, p), 403, 'FORBIDDEN');
  });
  test('admin writes are 403 for a customer', async () => {
    err(await call(A.token, 'POST', '/admin/products', { name: 'Hack', price: 1, categoryId: 1 }), 403, 'FORBIDDEN');
    err(await call(A.token, 'PATCH', '/admin/products/1', { price: 1 }), 403, 'FORBIDDEN');
    err(await call(A.token, 'DELETE', '/admin/products/1'), 403, 'FORBIDDEN');
    err(await call(A.token, 'PATCH', '/admin/inventory/1', { stockCount: 9999 }), 403, 'FORBIDDEN');
    err(await call(A.token, 'POST', '/admin/coupons', { code: 'HACK', type: 'fixed', value: 99, maxDiscount: 99, expiry: '2030-01-01', usageLimit: 9 }), 403, 'FORBIDDEN');
    err(await call(A.token, 'PATCH', '/admin/orders/SC10000001/status', { status: 'Delivered' }), 403, 'FORBIDDEN');
    err(await call(A.token, 'PATCH', `/admin/customers/${A.id}/status`, { status: 'Active' }), 403, 'FORBIDDEN');
    err(await call(A.token, 'PATCH', '/admin/reviews/1', { status: 'Approved' }), 403, 'FORBIDDEN');
  });
  test('role / user id fields in a body are rejected or ignored, never obeyed', async () => {
    err(await call(A.token, 'POST', '/addresses', { line1: 'x', city: 'y', pincode: '123456', role: 'admin', user_id: B.id }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'POST', '/orders', { shipping: SHIPPING, paymentMethod: 'cod', total: 1, userId: B.id }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'POST', '/orders', { shipping: SHIPPING, paymentMethod: 'cod', isAdmin: true }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'GET', '/admin/dashboard'), 403, 'FORBIDDEN'); // still a customer
  });
});

describe('cart', () => {
  test('add / merge quantities / set / remove / clear', async () => {
    assert.deepEqual(ok(await call(A.token, 'GET', '/cart')).items, []);
    // a userId in the body is ignored: the item lands in the token owner's cart
    let cart = ok(await call(A.token, 'POST', '/cart/items', { productId: 1, qty: 2, userId: B.id }), 201);
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].qty, 2);
    assert.equal(cart.items[0].product.name, 'Classic Veg Sandwich');
    assert.equal(cart.subtotal, 70);
    assert.deepEqual(ok(await call(B.token, 'GET', '/cart')).items, [], "B must not see A's cart");

    cart = ok(await call(A.token, 'POST', '/cart/items', { productId: 1, qty: 3 }), 201);
    assert.equal(cart.items[0].qty, 5);
    cart = ok(await call(A.token, 'PATCH', '/cart/items/1', { qty: 4 }));
    assert.equal(cart.items[0].qty, 4);
    err(await call(A.token, 'PATCH', '/cart/items/7', { qty: 1 }), 404, 'NOT_FOUND');
    err(await call(A.token, 'POST', '/cart/items', { productId: 999999, qty: 1 }), 404, 'NOT_FOUND');
    err(await call(A.token, 'POST', '/cart/items', { productId: 1, qty: 0 }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'POST', '/cart/items', { productId: 1, qty: 100 }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'PATCH', '/cart/items/1', { qty: -3 }), 400, 'VALIDATION_ERROR');

    cart = ok(await call(A.token, 'POST', '/cart/merge', { items: [{ productId: 1, qty: 1 }, { productId: 7, qty: 2 }, { productId: 999999, qty: 1 }] }));
    assert.equal(cart.items.find((i) => i.productId === 1).qty, 5);
    assert.equal(cart.items.find((i) => i.productId === 7).qty, 2);
    assert.ok(!cart.items.some((i) => i.productId === 999999));

    cart = ok(await call(A.token, 'DELETE', '/cart/items/7'));
    assert.ok(!cart.items.some((i) => i.productId === 7));
    cart = ok(await call(A.token, 'DELETE', '/cart'));
    assert.deepEqual(cart.items, []);
  });
});

describe('wishlist', () => {
  test('add (idempotent) / check / list / remove, and isolation', async () => {
    ok(await call(A.token, 'POST', '/wishlist/3'), 201);
    ok(await call(A.token, 'POST', '/wishlist/3'), 201);
    assert.equal(ok(await call(A.token, 'GET', '/wishlist/3/check')).wishlisted, true);
    assert.equal(ok(await call(B.token, 'GET', '/wishlist/3/check')).wishlisted, false);
    const list = ok(await call(A.token, 'GET', '/wishlist'));
    assert.equal(list.length, 1);
    assert.equal(list[0].product.id, 3);
    assert.deepEqual(ok(await call(B.token, 'GET', '/wishlist')), []);
    err(await call(A.token, 'POST', '/wishlist/999999'), 404, 'NOT_FOUND');
    assert.equal(ok(await call(A.token, 'DELETE', '/wishlist/3')).wishlisted, false);
    assert.deepEqual(ok(await call(A.token, 'GET', '/wishlist')), []);
  });
});

describe('addresses', () => {
  test('CRUD with validation, and other users cannot touch them', async () => {
    const created = ok(await call(A.token, 'POST', '/addresses', { label: 'Home', line1: '1 Main St', city: 'Pune', pincode: '411001', phone: '9876543210' }), 201);
    assert.equal(created.label, 'Home');
    err(await call(A.token, 'POST', '/addresses', { line1: 'x', city: 'y', pincode: '12' }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'POST', '/addresses', { line1: 'x', city: 'y', pincode: '123456', phone: 'abc' }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'PATCH', `/addresses/${created.id}`, {}), 400, 'VALIDATION_ERROR');

    const updated = ok(await call(A.token, 'PATCH', `/addresses/${created.id}`, { city: 'Mumbai' }));
    assert.equal(updated.city, 'Mumbai');
    assert.equal(ok(await call(A.token, 'GET', '/addresses')).length, 1);

    assert.deepEqual(ok(await call(B.token, 'GET', '/addresses')), [], "B must not see A's addresses");
    err(await call(B.token, 'PATCH', `/addresses/${created.id}`, { city: 'Hacked' }), 404, 'NOT_FOUND');
    err(await call(B.token, 'DELETE', `/addresses/${created.id}`), 404, 'NOT_FOUND');
    assert.equal(ok(await call(A.token, 'GET', '/addresses'))[0].city, 'Mumbai');

    ok(await call(A.token, 'DELETE', `/addresses/${created.id}`));
    assert.deepEqual(ok(await call(A.token, 'GET', '/addresses')), []);
  });
});

describe('coupons', () => {
  test('server prices the cart and applies the rules (guests allowed)', async () => {
    // product 3 = 55, x2 = 110; WELCOME10 = 10% (min 50, max 30) => 11; delivery 25 (<200)
    const r = ok(await call(null, 'POST', '/coupons/validate', { code: 'welcome10', items: [{ productId: 3, qty: 2 }], discount: 9999, total: 1 }));
    assert.equal(r.valid, true);
    assert.equal(r.subtotal, 110);
    assert.equal(r.discount, 11);
    assert.equal(r.deliveryFee, 25);
    assert.equal(r.total, 124);
  });
  test('invalid / expired / below-minimum coupons are refused with a message', async () => {
    assert.equal(ok(await call(null, 'POST', '/coupons/validate', { code: 'NOPE', items: [{ productId: 3, qty: 1 }] })).valid, false);
    const expired = ok(await call(null, 'POST', '/coupons/validate', { code: 'SANDWICH50', items: [{ productId: 3, qty: 1 }] }));
    assert.equal(expired.valid, false);
    const low = ok(await call(null, 'POST', '/coupons/validate', { code: 'FLAT20', items: [{ productId: 7, qty: 1 }] })); // 30 < min 100
    assert.equal(low.valid, false);
    assert.match(low.message, /Minimum order/);
  });
  test('without items it uses the signed-in cart, and requires login', async () => {
    err(await call(null, 'POST', '/coupons/validate', { code: 'WELCOME10' }), 401, 'UNAUTHORIZED');
    ok(await call(A.token, 'POST', '/cart/items', { productId: 3, qty: 2 }), 201);
    const r = ok(await call(A.token, 'POST', '/coupons/validate', { code: 'WELCOME10' }));
    assert.equal(r.discount, 11);
    ok(await call(A.token, 'DELETE', '/cart'));
  });
});

describe('orders (checkout is server-authoritative)', () => {
  let before1;
  let orderCod;
  let orderCard;

  test('empty cart cannot be ordered', async () => {
    err(await call(A.token, 'POST', '/orders', { shipping: SHIPPING, paymentMethod: 'cod' }), 400, 'BAD_REQUEST');
  });

  test('client-supplied money/identity fields are rejected; bad shipping/method rejected', async () => {
    ok(await call(A.token, 'POST', '/cart/items', { productId: 1, qty: 2 }), 201);
    for (const extra of [{ total: 1 }, { subtotal: 1 }, { discount: 500 }, { deliveryFee: 0 }, { price: 1 }, { userId: B.id }, { status: 'Delivered' }, { paymentStatus: 'Paid' }]) {
      err(await call(A.token, 'POST', '/orders', { shipping: SHIPPING, paymentMethod: 'cod', ...extra }), 400, 'VALIDATION_ERROR');
    }
    err(await call(A.token, 'POST', '/orders', { shipping: { ...SHIPPING, phone: '123' }, paymentMethod: 'cod' }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'POST', '/orders', { shipping: { ...SHIPPING, pincode: 'abcdef' }, paymentMethod: 'cod' }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'POST', '/orders', { shipping: SHIPPING, paymentMethod: 'bitcoin' }), 400, 'VALIDATION_ERROR');
    assert.equal(ok(await call(A.token, 'GET', '/orders')).length, 0, 'no order may exist yet');
  });

  test('COD order: prices/fees/total computed by the server, stock decremented, cart cleared', async () => {
    ok(await call(A.token, 'POST', '/cart/items', { productId: 7, qty: 1 }), 201); // cart: 1 x2, 7 x1
    before1 = (await product(1)).stockCount;
    const o = ok(await call(A.token, 'POST', '/orders', { shipping: SHIPPING, paymentMethod: 'cod' }), 201);
    orderCod = o;
    createdOrders.push(o.id);
    assert.match(o.id, /^SC\d{8}$/);
    assert.equal(o.subtotal, 100);            // 35*2 + 30, from DB prices
    assert.equal(o.deliveryFee, 25);          // < 200
    assert.equal(o.total, 125);
    assert.equal(o.status, 'Confirmed');
    assert.equal(o.payment.method, 'cod');
    assert.equal(o.payment.status, 'Pending'); // NOT Paid
    assert.equal(o.items.length, 2);
    assert.equal(o.statusHistory.length, 1);
    assert.equal((await product(1)).stockCount, before1 - 2);
    assert.deepEqual(ok(await call(A.token, 'GET', '/cart')).items, [], 'cart is cleared by the order');
  });

  test('card order with coupon: discount applied, stays Pending (never auto-Paid)', async () => {
    ok(await call(A.token, 'POST', '/cart/items', { productId: 3, qty: 2 }), 201);
    const o = ok(await call(A.token, 'POST', '/orders', { shipping: SHIPPING, paymentMethod: 'card', couponCode: 'welcome10' }), 201);
    orderCard = o;
    createdOrders.push(o.id);
    assert.equal(o.subtotal, 110);
    assert.equal(o.coupon.discount, 11);
    assert.equal(o.total, 124);               // 110 + 25 - 11
    assert.equal(o.status, 'Pending');
    assert.equal(o.payment.method, 'card');
    assert.equal(o.payment.status, 'Pending');
  });

  test('bad coupon at checkout fails the WHOLE order (nothing created, cart kept)', async () => {
    ok(await call(A.token, 'POST', '/cart/items', { productId: 3, qty: 1 }), 201);
    const n = ok(await call(A.token, 'GET', '/orders')).length;
    err(await call(A.token, 'POST', '/orders', { shipping: SHIPPING, paymentMethod: 'cod', couponCode: 'SANDWICH50' }), 422, 'COUPON_INVALID');
    assert.equal(ok(await call(A.token, 'GET', '/orders')).length, n);
    assert.equal(ok(await call(A.token, 'GET', '/cart')).items.length, 1);
    ok(await call(A.token, 'DELETE', '/cart'));
  });

  test('insufficient stock => 409, no order, stock unchanged, cart intact', async () => {
    const stock2 = (await product(2)).stockCount;
    ok(await call(A.token, 'POST', '/cart/items', { productId: 2, qty: 99 }), 201);
    const n = ok(await call(A.token, 'GET', '/orders')).length;
    const e = err(await call(A.token, 'POST', '/orders', { shipping: SHIPPING, paymentMethod: 'cod' }), 409, 'INSUFFICIENT_STOCK');
    assert.match(e.message, /Grilled Cheese/);
    assert.equal(ok(await call(A.token, 'GET', '/orders')).length, n);
    assert.equal((await product(2)).stockCount, stock2);
    assert.equal(ok(await call(A.token, 'GET', '/cart')).items[0].qty, 99);
    ok(await call(A.token, 'DELETE', '/cart'));
  });

  test('order retrieval by number and id, status, list + filter', async () => {
    const list = ok(await call(A.token, 'GET', '/orders'));
    assert.ok(list.length >= 2);
    assert.ok(list.every((o) => o.userId === A.id));
    const one = ok(await call(A.token, 'GET', `/orders/${orderCod.id}`));
    assert.equal(one.total, 125);
    assert.equal(ok(await call(A.token, 'GET', `/orders/${orderCod.dbId}`)).id, orderCod.id);
    const st = ok(await call(A.token, 'GET', `/orders/${orderCod.id}/status`));
    assert.equal(st.status, 'Confirmed');
    assert.equal(ok(await call(A.token, 'GET', '/orders?status=Pending')).every((o) => o.status === 'Pending'), true);
    err(await call(A.token, 'GET', '/orders/SC99999999'), 404, 'NOT_FOUND');
    err(await call(A.token, 'GET', '/orders/not-an-order'), 400, 'VALIDATION_ERROR');
  });

  test("customer B cannot see, track, reorder or return A's order", async () => {
    err(await call(B.token, 'GET', `/orders/${orderCod.id}`), 404, 'NOT_FOUND');
    err(await call(B.token, 'GET', `/orders/${orderCod.dbId}`), 404, 'NOT_FOUND');
    err(await call(B.token, 'GET', `/orders/${orderCod.id}/status`), 404, 'NOT_FOUND');
    err(await call(B.token, 'POST', `/orders/${orderCod.id}/reorder`), 404, 'NOT_FOUND');
    err(await call(B.token, 'POST', `/orders/${orderCod.id}/return`, { reason: 'steal' }), 404, 'NOT_FOUND');
    assert.deepEqual(ok(await call(B.token, 'GET', '/orders')), []);
    assert.deepEqual(ok(await call(B.token, 'GET', '/returns')), []);
  });

  test('reorder puts the items back in the cart', async () => {
    const r = ok(await call(A.token, 'POST', `/orders/${orderCod.id}/reorder`));
    assert.equal(r.added.length, 2);
    assert.deepEqual(r.skipped, []);
    const cart = ok(await call(A.token, 'GET', '/cart'));
    assert.equal(cart.items.find((i) => i.productId === 1).qty, 2);
    ok(await call(A.token, 'DELETE', '/cart'));
  });

  test('returns and reviews are refused before delivery', async () => {
    err(await call(A.token, 'POST', `/orders/${orderCod.id}/return`, { reason: 'Damaged on arrival' }), 409, 'RETURN_NOT_ALLOWED');
    err(await call(A.token, 'POST', '/products/1/reviews', { rating: 5, text: 'great' }), 403, 'FORBIDDEN');
    err(await call(A.token, 'POST', '/products/1/reviews', { rating: 9, text: 'great' }), 400, 'VALIDATION_ERROR');
    err(await call(A.token, 'PATCH', '/reviews/999999', { text: 'x' }), 404, 'NOT_FOUND');
    assert.ok(orderCard);
  });
});

describe('admin (needs TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD)', { skip: HAS_ADMIN ? false : 'no admin credentials in the environment' }, () => {
  test('admin can sign in and reach the dashboard with real aggregates', async () => {
    const c = authClient();
    const { data, error } = await c.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    assert.ifError(error);
    ADM.token = data.session.access_token;
    const d = ok(await call(ADM.token, 'GET', '/admin/dashboard'));
    assert.ok(d.totals.orders >= 2);
    assert.ok(Number(d.totals.revenue) > 0);
    assert.equal(d.revenueByDay.length, 30);
    assert.equal(d.revenueByMonth.length, 12);
    assert.ok(d.recentOrders.length > 0 && typeof d.recentOrders[0].itemCount === 'number');
  });

  test('admin lists: customers, orders (filters + paging), products, payments, coupons, categories', async () => {
    const customers = ok(await call(ADM.token, 'GET', `/admin/customers?search=${encodeURIComponent(`test-${RUN}-a`)}`));
    assert.equal(customers.length, 1);
    assert.equal(customers[0].id, A.id);
    assert.ok(customers[0].orders >= 2);
    const cust = ok(await call(ADM.token, 'GET', `/admin/customers/${A.id}`));
    assert.ok(cust.recentOrders.length >= 2);
    assert.ok(ok(await call(ADM.token, 'GET', '/admin/orders?status=Confirmed')).every((o) => o.status === 'Confirmed'));
    assert.ok(ok(await call(ADM.token, 'GET', `/admin/orders/${createdOrders[0]}`)).shipping.city === 'Pune');
    assert.ok(ok(await call(ADM.token, 'GET', '/admin/products')).length >= 10);
    assert.ok(ok(await call(ADM.token, 'GET', '/admin/payments')).some((p) => p.orderId === createdOrders[0] && p.status === 'Pending'));
    assert.ok(ok(await call(ADM.token, 'GET', '/admin/coupons')).some((c) => c.code === 'SANDWICH50'));
    assert.ok(ok(await call(ADM.token, 'GET', '/admin/categories')).length >= 5);
  });

  test('order lifecycle: status history, COD settles on delivery, card never auto-Paid', async () => {
    const [codNo, cardNo] = createdOrders;
    ok(await call(ADM.token, 'PATCH', `/admin/orders/${codNo}/status`, { status: 'Shipped' }));
    const done = ok(await call(ADM.token, 'PATCH', `/admin/orders/${codNo}/status`, { status: 'Delivered' }));
    assert.equal(done.status, 'Delivered');
    assert.deepEqual(done.statusHistory.map((h) => h.status), ['Confirmed', 'Shipped', 'Delivered']);
    assert.equal(done.payment.status, 'Paid');
    ok(await call(ADM.token, 'PATCH', `/admin/orders/${cardNo}/status`, { status: 'Delivered' }));
    assert.equal(ok(await call(ADM.token, 'GET', `/admin/orders/${cardNo}`)).payment.status, 'Pending', 'card payment must stay Pending without provider confirmation');
    err(await call(ADM.token, 'PATCH', `/admin/orders/${codNo}/status`, { status: 'Bogus' }), 400, 'VALIDATION_ERROR');
    err(await call(ADM.token, 'PATCH', '/admin/orders/SC99999999/status', { status: 'Shipped' }), 404, 'NOT_FOUND');
  });

  test('reviews: verified buyer -> Pending -> moderation -> visible; edit returns to Pending', async () => {
    const rev = ok(await call(A.token, 'POST', '/products/1/reviews', { rating: 5, text: 'Loved it' }), 201);
    assert.equal(rev.status, 'Pending');
    assert.deepEqual(ok(await call(null, 'GET', '/products/1/reviews')), []);
    err(await call(A.token, 'POST', '/products/1/reviews', { rating: 4, text: 'again' }), 409, 'REVIEW_EXISTS');
    err(await call(B.token, 'POST', '/products/1/reviews', { rating: 5, text: 'never bought' }), 403, 'FORBIDDEN');

    const before = await product(1);
    ok(await call(ADM.token, 'PATCH', `/admin/reviews/${rev.id}`, { status: 'Approved' }));
    assert.equal(ok(await call(null, 'GET', '/products/1/reviews')).length, 1);
    assert.equal((await product(1)).reviewCount, before.reviewCount + 1);

    const edited = ok(await call(A.token, 'PATCH', `/reviews/${rev.id}`, { text: 'Edited', rating: 4 }));
    assert.equal(edited.status, 'Pending');
    assert.deepEqual(ok(await call(null, 'GET', '/products/1/reviews')), []);
    err(await call(B.token, 'PATCH', `/reviews/${rev.id}`, { text: 'hijack' }), 404, 'NOT_FOUND');
    assert.ok(ok(await call(ADM.token, 'GET', '/admin/reviews?status=Pending')).some((r) => r.id === rev.id));
    ok(await call(ADM.token, 'PATCH', `/admin/reviews/${rev.id}`, { status: 'Hidden' }));
  });

  test('returns: request, duplicate blocked, owner-only, admin manages', async () => {
    const ret = ok(await call(A.token, 'POST', `/orders/${createdOrders[0]}/return`, { reason: 'Damaged on arrival' }), 201);
    assert.match(ret.id, /^RET\d+$/);
    assert.equal(ret.status, 'Requested');
    err(await call(A.token, 'POST', `/orders/${createdOrders[0]}/return`, { reason: 'again please' }), 409, 'RETURN_EXISTS');
    assert.equal(ok(await call(A.token, 'GET', `/returns/${ret.id}`)).amount, 125);
    err(await call(B.token, 'GET', `/returns/${ret.id}`), 404, 'NOT_FOUND');
    assert.ok(ok(await call(ADM.token, 'GET', '/admin/returns')).some((r) => r.id === ret.id));
    assert.equal(ok(await call(ADM.token, 'PATCH', `/admin/returns/${ret.dbId}`, { status: 'Approved' })).status, 'Approved');
  });

  test('product / inventory / category / coupon management', async () => {
    const cats = ok(await call(ADM.token, 'GET', '/admin/categories'));
    const p = ok(await call(ADM.token, 'POST', '/admin/products', { name: `Test Product ${RUN}`, price: 12, categoryId: cats[0].id, stockCount: 5 }), 201);
    assert.equal(p.stockCount, 5);
    assert.equal(ok(await call(ADM.token, 'PATCH', `/admin/products/${p.id}`, { price: 15, isActive: false })).price, 15);
    err(await call(null, 'GET', `/products/${p.id}`), 404, 'NOT_FOUND'); // inactive => hidden from the public API
    assert.equal(ok(await call(ADM.token, 'PATCH', `/admin/inventory/${p.id}`, { stockCount: 3 })).stockCount, 3);
    assert.ok(ok(await call(ADM.token, 'GET', '/admin/inventory?filter=low')).some((i) => i.id === p.id && i.status === 'Low Stock'));
    err(await call(ADM.token, 'PATCH', `/admin/inventory/${p.id}`, { stockCount: -1 }), 400, 'VALIDATION_ERROR');
    ok(await call(ADM.token, 'DELETE', `/admin/products/${p.id}`));
    err(await call(ADM.token, 'DELETE', `/admin/products/${p.id}`), 404, 'NOT_FOUND');

    const cat = ok(await call(ADM.token, 'POST', '/admin/categories', { name: `test cat ${RUN}` }), 201);
    assert.equal(ok(await call(ADM.token, 'PATCH', `/admin/categories/${cat.id}`, { status: 'Inactive' })).status, 'Inactive');
    ok(await call(ADM.token, 'DELETE', `/admin/categories/${cat.id}`));

    const code = `TEST${RUN}`.toUpperCase();
    const cp = ok(await call(ADM.token, 'POST', '/admin/coupons', { code, type: 'fixed', value: 5, maxDiscount: 5, expiry: '2099-01-01', usageLimit: 3 }), 201);
    err(await call(ADM.token, 'POST', '/admin/coupons', { code, type: 'fixed', value: 5, maxDiscount: 5, expiry: '2099-01-01', usageLimit: 3 }), 409, 'ALREADY_EXISTS');
    err(await call(ADM.token, 'POST', '/admin/coupons', { code: 'BAD', type: 'percentage', value: 150, maxDiscount: 5, expiry: '2099-01-01', usageLimit: 3 }), 400, 'VALIDATION_ERROR');
    assert.equal(ok(await call(ADM.token, 'PATCH', `/admin/coupons/${cp.id}`, { usageLimit: 1 })).usageLimit, 1);
    ok(await call(ADM.token, 'DELETE', `/admin/coupons/${cp.id}`));
  });

  test('blocking a customer cuts off their API access; unblocking restores it', async () => {
    ok(await call(ADM.token, 'PATCH', `/admin/customers/${B.id}/status`, { status: 'Blocked' }));
    err(await call(B.token, 'GET', '/cart'), 403, 'ACCOUNT_BLOCKED');
    ok(await call(ADM.token, 'PATCH', `/admin/customers/${B.id}/status`, { status: 'Active' }));
    ok(await call(B.token, 'GET', '/cart'));
  });

  test('cancelling restocks and releases the coupon use', async () => {
    const p3 = (await product(3)).stockCount;
    const cardNo = createdOrders[1];
    const cancelled = ok(await call(ADM.token, 'PATCH', `/admin/orders/${cardNo}/status`, { status: 'Cancelled' }));
    assert.equal(cancelled.status, 'Cancelled');
    assert.equal((await product(3)).stockCount, p3 + 2);
    assert.equal(cancelled.payment.status, 'Failed');
    err(await call(ADM.token, 'PATCH', `/admin/orders/${cardNo}/status`, { status: 'Confirmed' }), 409, 'ORDER_CANCELLED');
  });
});
