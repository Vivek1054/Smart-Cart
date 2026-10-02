// Admin data, straight from Supabase. Every query here is protected by RLS:
// a non-admin gets empty results / permission errors, whatever the UI shows.
// Nothing in this file is generated or seeded - if there is no data, callers get
// empty arrays and zeros.
import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/errors';
import { ORDER_SELECT, mapOrder, ORDER_STATUSES } from './orders';

// ---------------------------------------------------------------- orders
export const getAllOrdersForAdmin = async () => {
  const rows = unwrap(await supabase.from('orders').select(ORDER_SELECT).order('created_at', { ascending: false }));
  return rows.map(mapOrder);
};

export const getOrderForAdmin = async (orderNumber) => {
  const row = unwrap(await supabase.from('orders').select(ORDER_SELECT).eq('order_number', orderNumber).maybeSingle());
  return row ? mapOrder(row) : null;
};

// ------------------------------------------------------------- customers
const mapCustomer = (c) => ({
  id: c.id,
  name: c.name || c.email,
  email: c.email,
  phone: c.phone,
  city: c.city || '—',
  orders: Number(c.orders),
  totalSpent: Number(c.total_spent),
  joined: c.joined,
  status: c.status,
  lastOrderAt: c.last_order_at,
});

export const getCustomers = async () =>
  unwrap(await supabase.from('admin_customers').select('*').eq('role', 'customer').order('joined', { ascending: false }))
    .map(mapCustomer);

export const getCustomerById = async (id) => {
  const row = unwrap(await supabase.from('admin_customers').select('*').eq('id', id).maybeSingle());
  return row ? mapCustomer(row) : null;
};

export const getOrdersForCustomer = async (userId) => {
  const rows = unwrap(
    await supabase.from('orders').select(ORDER_SELECT).eq('user_id', userId).order('created_at', { ascending: false })
  );
  return rows.map(mapOrder);
};

export const setCustomerStatus = async (id, status) => {
  unwrap(await supabase.from('profiles').update({ status }).eq('id', id));
};

// -------------------------------------------------------------- payments
export const getPayments = async () => {
  const rows = unwrap(
    await supabase
      .from('payments')
      .select('id, method, status, amount, provider, provider_payment_id, paid_at, created_at, orders(order_number, ship_name)')
      .order('created_at', { ascending: false })
  );
  return rows.map((p) => ({
    id: p.provider_payment_id || `PAY${String(p.id).padStart(6, '0')}`,
    orderId: p.orders?.order_number || '—',
    customer: p.orders?.ship_name || '—',
    amount: Number(p.amount),
    method: { card: 'Card', upi: 'UPI', cod: 'Cash' }[p.method] || p.method,
    status: p.status,
    date: p.paid_at || p.created_at,
  }));
};

// --------------------------------------------------------------- returns
export const getReturns = async () => {
  const rows = unwrap(
    await supabase
      .from('returns')
      .select('id, return_number, reason, amount, status, created_at, orders(order_number, ship_name), order_items(name)')
      .order('created_at', { ascending: false })
  );
  return rows.map((r) => ({
    dbId: Number(r.id),
    id: r.return_number,
    orderId: r.orders?.order_number || '—',
    customer: r.orders?.ship_name || '—',
    product: r.order_items?.name || 'Entire order',
    reason: r.reason,
    amount: Number(r.amount),
    date: r.created_at,
    status: r.status,
  }));
};

export const updateReturnStatus = async (dbId, status) => {
  unwrap(await supabase.from('returns').update({ status }).eq('id', dbId));
};

// --------------------------------------------------------------- reviews
export const getReviewsForModeration = async () => {
  const rows = unwrap(
    await supabase
      .from('product_reviews')
      .select('id, product_id, author, rating, text, status, created_at, products(name)')
      .order('created_at', { ascending: false })
  );
  return rows.map((r) => ({
    id: Number(r.id),
    productId: Number(r.product_id),
    productName: r.products?.name || 'Deleted product',
    author: r.author,
    rating: r.rating,
    text: r.text,
    date: r.created_at,
    status: r.status,
  }));
};

export const setReviewStatus = async (reviewId, status) => {
  unwrap(await supabase.from('product_reviews').update({ status }).eq('id', reviewId));
};

export const deleteReview = async (reviewId) => {
  unwrap(await supabase.from('product_reviews').delete().eq('id', reviewId));
};

// Dashboard / analytics aggregates come from GET /api/v1/admin/dashboard (see backend).
export const LOW_STOCK_THRESHOLD = 8;

export { ORDER_STATUSES };
