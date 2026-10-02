// HTTP-layer tests that need NO database: routing, auth gate, validation, CORS,
// error envelope, security headers, rate limiting. Supabase is pointed at a dead
// address on purpose, so these also prove the API fails safely when it's down.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'http://127.0.0.1:9';
process.env.SUPABASE_ANON_KEY = 'test-anon-key-test-anon-key-test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.FRONTEND_URL = 'http://localhost:5173,https://smartcart.example.app';

let server;
let base;

before(async () => {
  const { createApp } = await import('../src/app.js');
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const call = async (path, { method = 'GET', headers = {}, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, headers: res.headers, json, text };
};

const assertError = (r, status, code) => {
  assert.equal(r.status, status, r.text);
  assert.equal(r.json.success, false);
  assert.equal(r.json.error.code, code);
  assert.equal(typeof r.json.error.message, 'string');
  assert.ok(!('stack' in r.json.error) && !/at .*\.js/.test(r.text), 'no stack traces');
};

test('GET /api/health is public and lightweight', async () => {
  const r = await call('/api/health');
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { status: 'ok', service: 'SmartCart API' });
});

test('GET /api/ready reports an unreachable database as 503 (not a crash)', async () => {
  const r = await call('/api/ready');
  assert.equal(r.status, 503);
  assert.equal(r.json.status, 'unavailable');
  assert.equal(r.json.database, 'unreachable');
});

test('unknown routes return the JSON error envelope', async () => {
  assertError(await call('/api/v1/nope'), 404, 'NOT_FOUND');
  assertError(await call('/nothing-here'), 404, 'NOT_FOUND');
});

test('security headers are set and x-powered-by is hidden', async () => {
  const r = await call('/api/health');
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(r.headers.get('strict-transport-security'));
  assert.ok(r.headers.get('content-security-policy'));
});

// Every route that must be behind a login (customer) or admin login.
const PROTECTED = [
  ['GET', '/api/v1/cart'], ['POST', '/api/v1/cart/items'], ['POST', '/api/v1/cart/merge'],
  ['PATCH', '/api/v1/cart/items/1'], ['DELETE', '/api/v1/cart/items/1'], ['DELETE', '/api/v1/cart'],
  ['GET', '/api/v1/wishlist'], ['POST', '/api/v1/wishlist/1'], ['DELETE', '/api/v1/wishlist/1'], ['GET', '/api/v1/wishlist/1/check'],
  ['GET', '/api/v1/addresses'], ['POST', '/api/v1/addresses'], ['PATCH', '/api/v1/addresses/1'], ['DELETE', '/api/v1/addresses/1'],
  ['POST', '/api/v1/orders'], ['GET', '/api/v1/orders'], ['GET', '/api/v1/orders/SC10000001'],
  ['GET', '/api/v1/orders/SC10000001/status'], ['POST', '/api/v1/orders/SC10000001/reorder'], ['POST', '/api/v1/orders/SC10000001/return'],
  ['GET', '/api/v1/returns'], ['GET', '/api/v1/returns/1'],
  ['POST', '/api/v1/products/1/reviews'], ['PATCH', '/api/v1/reviews/1'],
  ['GET', '/api/v1/admin/dashboard'], ['GET', '/api/v1/admin/customers'], ['GET', '/api/v1/admin/customers/00000000-0000-0000-0000-000000000000'],
  ['GET', '/api/v1/admin/orders'], ['PATCH', '/api/v1/admin/orders/SC10000001/status'],
  ['GET', '/api/v1/admin/products'], ['POST', '/api/v1/admin/products'], ['PATCH', '/api/v1/admin/products/1'], ['DELETE', '/api/v1/admin/products/1'],
  ['GET', '/api/v1/admin/inventory'], ['PATCH', '/api/v1/admin/inventory/1'],
  ['GET', '/api/v1/admin/reviews'], ['PATCH', '/api/v1/admin/reviews/1'],
  ['GET', '/api/v1/admin/payments'], ['GET', '/api/v1/admin/returns'], ['PATCH', '/api/v1/admin/returns/1'],
  ['GET', '/api/v1/admin/coupons'], ['POST', '/api/v1/admin/coupons'], ['PATCH', '/api/v1/admin/coupons/1'], ['DELETE', '/api/v1/admin/coupons/1'],
  ['GET', '/api/v1/admin/categories'], ['POST', '/api/v1/admin/categories'],
];

test(`all ${PROTECTED.length} protected routes reject requests with no token (401)`, async () => {
  for (const [method, path] of PROTECTED) {
    const r = await call(path, { method, body: method === 'GET' || method === 'DELETE' ? undefined : {} });
    assert.equal(r.status, 401, `${method} ${path} -> ${r.status}`);
    assert.equal(r.json.error.code, 'UNAUTHORIZED');
  }
});

test('malformed Authorization headers are rejected (401)', async () => {
  for (const h of ['', 'Bearer', 'Bearer ', 'Basic abc', 'abc', 'Token abc']) {
    assertError(await call('/api/v1/cart', { headers: { Authorization: h } }), 401, 'UNAUTHORIZED');
  }
});

test('a well-formed token cannot be verified while Supabase is down => 503, never a silent pass', async () => {
  const r = await call('/api/v1/cart', { headers: { Authorization: 'Bearer aaa.bbb.ccc' } });
  assertError(r, 503, 'AUTH_UNAVAILABLE');
});

test('identity/role fields in the body never bypass auth', async () => {
  const r = await call('/api/v1/admin/dashboard', {
    headers: { 'x-user-id': '1', 'x-role': 'admin' },
  });
  assertError(r, 401, 'UNAUTHORIZED');
  const r2 = await call('/api/v1/cart/items', { method: 'POST', body: { userId: 'x', role: 'admin', isAdmin: true, productId: 1 } });
  assertError(r2, 401, 'UNAUTHORIZED');
});

test('invalid JSON => 400 INVALID_JSON', async () => {
  assertError(await call('/api/v1/coupons/validate', { method: 'POST', body: '{bad json' }), 400, 'INVALID_JSON');
});

test('oversized bodies are rejected (413)', async () => {
  const r = await call('/api/v1/coupons/validate', { method: 'POST', body: { code: 'X', pad: 'a'.repeat(200_000) } });
  assertError(r, 413, 'PAYLOAD_TOO_LARGE');
});

test('input validation returns field-level 400s', async () => {
  const r = await call('/api/v1/coupons/validate', { method: 'POST', body: { code: '', items: [{ productId: -1, qty: 0 }] } });
  assertError(r, 400, 'VALIDATION_ERROR');
  assert.ok(r.json.error.details.length >= 2);

  assertError(await call('/api/v1/products/abc'), 400, 'VALIDATION_ERROR');
  assertError(await call('/api/v1/products/0'), 400, 'VALIDATION_ERROR');
  assertError(await call('/api/v1/products?page=0'), 400, 'VALIDATION_ERROR');
  assertError(await call('/api/v1/products?limit=9999'), 400, 'VALIDATION_ERROR');
  assertError(await call('/api/v1/products?sort=DROP_TABLE'), 400, 'VALIDATION_ERROR');
  assertError(await call('/api/v1/products?minPrice=-5'), 400, 'VALIDATION_ERROR');
  assertError(await call('/api/v1/products/1/reviews?page=abc'), 400, 'VALIDATION_ERROR');
});

test('a database outage on a public route is a clean 503 that leaks nothing', async () => {
  const r = await call('/api/v1/products');
  assertError(r, 503, 'SERVICE_UNAVAILABLE');
  assert.ok(!/127\.0\.0\.1|supabase|fetch failed|postgres|PGRST/i.test(r.text), r.text);
});

test('CORS: configured origins allowed, others rejected, no wildcard', async () => {
  const allowed = await call('/api/health', { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');

  const prod = await call('/api/health', { headers: { Origin: 'https://smartcart.example.app' } });
  assert.equal(prod.headers.get('access-control-allow-origin'), 'https://smartcart.example.app');

  const denied = await call('/api/v1/products', { headers: { Origin: 'https://evil.example' } });
  assertError(denied, 403, 'CORS_NOT_ALLOWED');
  assert.equal(denied.headers.get('access-control-allow-origin'), null);

  const pre = await fetch(`${base}/api/v1/orders`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.notEqual(pre.headers.get('access-control-allow-origin'), '*');
});

test('coupon validation is rate limited (429 after 30 requests/min)', async () => {
  let last;
  for (let i = 0; i < 40; i++) {
    last = await call('/api/v1/coupons/validate', { method: 'POST', body: { code: 'X' } }); // 400s still count
    if (last.status === 429) break;
  }
  assertError(last, 429, 'RATE_LIMITED');
});
