import { badRequest, notFound, unwrap } from '../utils/errors.js';
import { ORDER_SELECT, mapOrder, mapReturn, pageMeta, range } from './mappers.js';
import { productsByIds } from './catalog.service.js';

// An order reference is either the human number (SC10000001) or the numeric id.
const byRef = (query, ref) => (/^SC/i.test(ref) ? query.eq('order_number', ref.toUpperCase()) : query.eq('id', Number(ref)));

const findOwnOrder = async (db, userId, ref) => {
  const row = unwrap(await byRef(db.from('orders').select(ORDER_SELECT).eq('user_id', userId), ref).maybeSingle());
  if (!row) throw notFound('Order not found'); // same answer for "not yours" and "does not exist"
  return row;
};

// Creates the order from the user's SERVER cart. The client sends only shipping
// details, an optional coupon code and the payment method. Prices, stock,
// coupon, delivery fee and totals are computed inside the place_order() database
// function, in one transaction (all or nothing).
export const createOrder = async (db, userId, { shipping, couponCode, paymentMethod }) => {
  const cart = unwrap(await db.from('cart_items').select('product_id, qty').eq('user_id', userId));
  if (cart.length === 0) throw badRequest('Your cart is empty');

  const result = unwrap(
    await db.rpc('place_order', {
      p_items: cart.map((r) => ({ product_id: Number(r.product_id), qty: r.qty })),
      p_shipping: shipping,
      p_coupon_code: couponCode || null,
      p_payment_method: paymentMethod,
    })
  );

  const order = mapOrder(await findOwnOrder(db, userId, String(result.id)));
  return order;
};

export const listOrders = async (db, userId, q) => {
  let query = db.from('orders').select(ORDER_SELECT, { count: 'exact' }).eq('user_id', userId);
  if (q.status) query = query.eq('status', q.status);
  const [from, to] = range(q);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  return { orders: unwrap({ data, error }).map(mapOrder), meta: pageMeta(q, count) };
};

export const getOrder = async (db, userId, ref) => mapOrder(await findOwnOrder(db, userId, ref));

export const getOrderStatus = async (db, userId, ref) => {
  const o = mapOrder(await findOwnOrder(db, userId, ref));
  return { id: o.id, status: o.status, payment: o.payment, statusHistory: o.statusHistory };
};

// Copy the items of a past order into the cart (skipping products that no longer exist / are hidden).
export const reorder = async (db, userId, ref) => {
  const order = mapOrder(await findOwnOrder(db, userId, ref));
  const wanted = order.items.filter((i) => i.productId !== null);
  const products = await productsByIds(db, wanted.map((i) => i.productId));

  const added = [];
  const skipped = [];
  for (const item of order.items) {
    const p = item.productId === null ? null : products.get(item.productId);
    if (p && p.inStock) added.push({ productId: p.id, name: p.name, qty: item.qty });
    else skipped.push({ productId: item.productId, name: item.name, reason: p ? 'Out of stock' : 'No longer available' });
  }

  if (added.length > 0) {
    unwrap(await db.rpc('merge_cart', { p_items: added.map((a) => ({ product_id: a.productId, qty: a.qty })) }));
  }
  return { orderId: order.id, added, skipped };
};

// ------------------------------------------------------------------ returns
export const requestReturn = async (db, userId, ref, { reason, orderItemId }) => {
  const order = await findOwnOrder(db, userId, ref);
  const row = unwrap(
    await db.rpc('request_return', {
      p_order_id: Number(order.id),
      p_order_item_id: orderItemId ?? null,
      p_reason: reason,
    })
  );
  return mapReturn(row);
};

const RETURN_SELECT = '*, orders(order_number, ship_name), order_items(name)';

export const listReturns = async (db, userId, q) => {
  const [from, to] = range(q);
  const { data, count, error } = await db
    .from('returns')
    .select(RETURN_SELECT, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  return { returns: unwrap({ data, error }).map(mapReturn), meta: pageMeta(q, count) };
};

export const getReturn = async (db, userId, returnNumberOrId) => {
  let query = db.from('returns').select(RETURN_SELECT).eq('user_id', userId);
  query = /^RET/i.test(returnNumberOrId) ? query.eq('return_number', returnNumberOrId.toUpperCase()) : query.eq('id', Number(returnNumberOrId));
  const row = unwrap(await query.maybeSingle());
  if (!row) throw notFound('Return not found');
  return mapReturn(row);
};
