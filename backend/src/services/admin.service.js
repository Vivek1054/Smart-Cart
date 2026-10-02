import { notFound, unwrap } from '../utils/errors.js';
import {
  ORDER_SELECT, mapCategory, mapCoupon, mapOrder, mapProduct, mapReturn, mapReview, pageMeta, range,
} from './mappers.js';

// Every function here receives the CALLER's client (req.db). The routes are behind
// requireAuth + requireAdmin, and Postgres RLS independently allows these
// reads/writes only when public.is_admin() is true. The service-role key is not used.

const like = (s) => s.replace(/[%_\\,()*]/g, ' ').replace(/\s+/g, ' ').trim();
const orderRef = (query, ref) => (/^SC/i.test(ref) ? query.eq('order_number', ref.toUpperCase()) : query.eq('id', Number(ref)));

// -------------------------------------------------------------- dashboard
// Aggregates are computed by the admin_dashboard() SQL function from real rows.
export const dashboard = async (db) => unwrap(await db.rpc('admin_dashboard'));

// --------------------------------------------------------------- customers
const mapCustomer = (c) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  city: c.city,
  status: c.status,
  joinedAt: c.joined,
  orders: Number(c.orders),
  totalSpent: Number(c.total_spent),
  lastOrderAt: c.last_order_at,
});

export const listCustomers = async (db, q) => {
  let query = db.from('admin_customers').select('*', { count: 'exact' }).eq('role', 'customer');
  if (q.search) {
    const s = like(q.search);
    if (s) query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%`);
  }
  if (q.status) query = query.eq('status', q.status);
  const [from, to] = range(q);
  const { data, count, error } = await query.order('joined', { ascending: false }).range(from, to);
  return { customers: unwrap({ data, error }).map(mapCustomer), meta: pageMeta(q, count) };
};

export const getCustomer = async (db, id) => {
  const row = unwrap(await db.from('admin_customers').select('*').eq('id', id).eq('role', 'customer').maybeSingle());
  if (!row) throw notFound('Customer not found');
  const orders = unwrap(
    await db.from('orders').select(ORDER_SELECT).eq('user_id', id).order('created_at', { ascending: false }).limit(50)
  );
  return { ...mapCustomer(row), recentOrders: orders.map(mapOrder) };
};

export const setCustomerStatus = async (db, id, status) => {
  const row = unwrap(await db.from('profiles').update({ status }).eq('id', id).eq('role', 'customer').select('id, status').maybeSingle());
  if (!row) throw notFound('Customer not found');
  return row;
};

// ------------------------------------------------------------------ orders
export const listOrders = async (db, q) => {
  let query = db.from('orders').select(ORDER_SELECT, { count: 'exact' });
  if (q.status) query = query.eq('status', q.status);
  if (q.search) {
    const s = like(q.search);
    if (s) query = query.or(`order_number.ilike.%${s}%,ship_name.ilike.%${s}%,ship_email.ilike.%${s}%`);
  }
  const [from, to] = range(q);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  return { orders: unwrap({ data, error }).map(mapOrder), meta: pageMeta(q, count) };
};

export const getOrder = async (db, ref) => {
  const row = unwrap(await orderRef(db.from('orders').select(ORDER_SELECT), ref).maybeSingle());
  if (!row) throw notFound('Order not found');
  return mapOrder(row);
};

// Status history, restock-on-cancel and COD settlement are done by database triggers.
export const setOrderStatus = async (db, ref, status) => {
  const row = unwrap(await orderRef(db.from('orders').update({ status }), ref).select('id').maybeSingle());
  if (!row) throw notFound('Order not found');
  return getOrder(db, ref);
};

// ---------------------------------------------------------------- products
const productColumns = (b) => {
  const c = {};
  if (b.name !== undefined) c.name = b.name;
  if (b.title !== undefined) c.title = b.title;
  if (b.price !== undefined) c.price = b.price;
  if (b.discountPercent !== undefined) c.discount_percent = b.discountPercent;
  if (b.image !== undefined) c.image = b.image;
  if (b.categoryId !== undefined) c.category_id = b.categoryId;
  if (b.stockCount !== undefined) c.stock_count = b.stockCount;
  if (b.isActive !== undefined) c.is_active = b.isActive;
  if (b.isBestSeller !== undefined) c.is_best_seller = b.isBestSeller;
  if (b.isTrending !== undefined) c.is_trending = b.isTrending;
  if (b.specs !== undefined) c.specs = b.specs;
  return c;
};

const getProduct = async (db, id) => {
  const row = unwrap(await db.from('catalog_products').select('*').eq('id', id).maybeSingle());
  if (!row) throw notFound('Product not found');
  return mapProduct(row);
};

export const listProducts = async (db, q) => {
  let query = db.from('catalog_products').select('*', { count: 'exact' });
  if (q.search) {
    const s = like(q.search);
    if (s) query = query.or(`name.ilike.%${s}%,title.ilike.%${s}%`);
  }
  const [from, to] = range(q);
  const { data, count, error } = await query.order('id').range(from, to);
  return { products: unwrap({ data, error }).map(mapProduct), meta: pageMeta(q, count) };
};

export const createProduct = async (db, body) => {
  const row = unwrap(await db.from('products').insert(productColumns(body)).select('id').single());
  return getProduct(db, row.id);
};

export const updateProduct = async (db, id, body) => {
  const row = unwrap(await db.from('products').update(productColumns(body)).eq('id', id).select('id').maybeSingle());
  if (!row) throw notFound('Product not found');
  return getProduct(db, id);
};

export const deleteProduct = async (db, id) => {
  const row = unwrap(await db.from('products').delete().eq('id', id).select('id').maybeSingle());
  if (!row) throw notFound('Product not found');
  return { id, deleted: true };
};

// --------------------------------------------------------------- inventory
export const listInventory = async (db, q) => {
  let query = db.from('catalog_products').select('id, name, category, stock_count, is_active, updated_at', { count: 'exact' });
  if (q.filter === 'low') query = query.gt('stock_count', 0).lte('stock_count', 8);
  if (q.filter === 'out') query = query.eq('stock_count', 0);
  if (q.search) {
    const s = like(q.search);
    if (s) query = query.ilike('name', `%${s}%`);
  }
  const [from, to] = range(q);
  const { data, count, error } = await query.order('stock_count').order('id').range(from, to);
  const items = unwrap({ data, error }).map((r) => ({
    id: Number(r.id),
    name: r.name,
    category: r.category,
    stockCount: Number(r.stock_count),
    status: Number(r.stock_count) === 0 ? 'Out of Stock' : Number(r.stock_count) <= 8 ? 'Low Stock' : 'In Stock',
    isActive: !!r.is_active,
    updatedAt: r.updated_at,
  }));
  return { items, meta: pageMeta(q, count) };
};

export const setStock = async (db, id, stockCount) => updateProduct(db, id, { stockCount });

// -------------------------------------------------------------- categories
export const listCategories = async (db) =>
  unwrap(await db.from('categories').select('*').order('sort_order').order('id')).map(mapCategory);

const categoryColumns = (b) => {
  const c = {};
  if (b.name !== undefined) c.name = b.name;
  if (b.icon !== undefined) c.icon = b.icon;
  if (b.description !== undefined) c.description = b.description;
  if (b.status !== undefined) c.status = b.status;
  if (b.sortOrder !== undefined) c.sort_order = b.sortOrder;
  return c;
};

export const createCategory = async (db, body) => mapCategory(unwrap(await db.from('categories').insert(categoryColumns(body)).select().single()));

export const updateCategory = async (db, id, body) => {
  const row = unwrap(await db.from('categories').update(categoryColumns(body)).eq('id', id).select().maybeSingle());
  if (!row) throw notFound('Category not found');
  return mapCategory(row);
};

export const deleteCategory = async (db, id) => {
  const row = unwrap(await db.from('categories').delete().eq('id', id).select('id').maybeSingle());
  if (!row) throw notFound('Category not found');
  return { id, deleted: true };
};

// ----------------------------------------------------------------- reviews
export const listReviews = async (db, q) => {
  let query = db.from('product_reviews').select('*, products(name)', { count: 'exact' });
  if (q.status) query = query.eq('status', q.status);
  const [from, to] = range(q);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  const reviews = unwrap({ data, error }).map((r) => ({ ...mapReview(r), productName: r.products?.name ?? null }));
  return { reviews, meta: pageMeta(q, count) };
};

export const setReviewStatus = async (db, id, status) => {
  const row = unwrap(await db.from('product_reviews').update({ status }).eq('id', id).select().maybeSingle());
  if (!row) throw notFound('Review not found');
  return mapReview(row);
};

// ---------------------------------------------------------------- payments
export const listPayments = async (db, q) => {
  let query = db
    .from('payments')
    .select('id, method, status, amount, provider, provider_payment_id, paid_at, created_at, orders(order_number, ship_name)', { count: 'exact' });
  if (q.status) query = query.eq('status', q.status);
  const [from, to] = range(q);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  const payments = unwrap({ data, error }).map((p) => ({
    id: Number(p.id),
    orderId: p.orders?.order_number ?? null,
    customer: p.orders?.ship_name ?? null,
    method: p.method,
    status: p.status,
    amount: Number(p.amount),
    provider: p.provider,
    providerPaymentId: p.provider_payment_id,
    paidAt: p.paid_at,
    createdAt: p.created_at,
  }));
  return { payments, meta: pageMeta(q, count) };
};

// ----------------------------------------------------------------- returns
const RETURN_SELECT = '*, orders(order_number, ship_name), order_items(name)';

export const listReturns = async (db, q) => {
  let query = db.from('returns').select(RETURN_SELECT, { count: 'exact' });
  if (q.status) query = query.eq('status', q.status);
  const [from, to] = range(q);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  return { returns: unwrap({ data, error }).map(mapReturn), meta: pageMeta(q, count) };
};

export const setReturnStatus = async (db, id, status) => {
  const row = unwrap(await db.from('returns').update({ status }).eq('id', id).select(RETURN_SELECT).maybeSingle());
  if (!row) throw notFound('Return not found');
  return mapReturn(row);
};

// ----------------------------------------------------------------- coupons
const couponColumns = (b) => {
  const c = {};
  if (b.code !== undefined) c.code = b.code;
  if (b.type !== undefined) c.type = b.type;
  if (b.value !== undefined) c.value = b.value;
  if (b.minOrder !== undefined) c.min_order = b.minOrder;
  if (b.maxDiscount !== undefined) c.max_discount = b.maxDiscount;
  if (b.expiry !== undefined) c.expiry = b.expiry;
  if (b.usageLimit !== undefined) c.usage_limit = b.usageLimit;
  if (b.status !== undefined) c.status = b.status;
  return c;
};

export const listCoupons = async (db) => unwrap(await db.from('coupons').select('*').order('id')).map(mapCoupon);
export const createCoupon = async (db, body) => mapCoupon(unwrap(await db.from('coupons').insert(couponColumns(body)).select().single()));

export const updateCoupon = async (db, id, body) => {
  const row = unwrap(await db.from('coupons').update(couponColumns(body)).eq('id', id).select().maybeSingle());
  if (!row) throw notFound('Coupon not found');
  return mapCoupon(row);
};

export const deleteCoupon = async (db, id) => {
  const row = unwrap(await db.from('coupons').delete().eq('id', id).select('id').maybeSingle());
  if (!row) throw notFound('Coupon not found');
  return { id, deleted: true };
};
