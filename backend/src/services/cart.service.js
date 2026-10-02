import { notFound, unwrap } from '../utils/errors.js';
import { productsByIds } from './catalog.service.js';

// All queries run as the signed-in user (RLS) AND filter on user_id explicitly.
// user_id always comes from the verified token, never from the request.

export const getCart = async (db, userId) => {
  const rows = unwrap(
    await db.from('cart_items').select('product_id, qty').eq('user_id', userId).order('updated_at')
  );
  const products = await productsByIds(db, rows.map((r) => Number(r.product_id)));

  const items = rows.map((r) => {
    const product = products.get(Number(r.product_id)) || null;
    return {
      productId: Number(r.product_id),
      qty: r.qty,
      available: !!product && product.inStock,
      product,
      lineTotal: product ? product.price * r.qty : 0,
    };
  });
  // Display totals only; place_order recomputes everything server-side.
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return { items, itemCount: items.reduce((s, i) => s + i.qty, 0), subtotal };
};

const assertProductExists = async (db, productId) => {
  const products = await productsByIds(db, [productId]);
  if (!products.has(productId)) throw notFound('Product not found');
};

export const addItem = async (db, userId, productId, qty) => {
  await assertProductExists(db, productId);
  const existing = unwrap(
    await db.from('cart_items').select('qty').eq('user_id', userId).eq('product_id', productId).maybeSingle()
  );
  const newQty = Math.min(99, (existing?.qty || 0) + qty);
  unwrap(
    await db.from('cart_items').upsert({ user_id: userId, product_id: productId, qty: newQty }, { onConflict: 'user_id,product_id' })
  );
  return getCart(db, userId);
};

export const setItemQty = async (db, userId, productId, qty) => {
  const row = unwrap(
    await db.from('cart_items').update({ qty }).eq('user_id', userId).eq('product_id', productId).select('product_id').maybeSingle()
  );
  if (!row) throw notFound('That item is not in your cart');
  return getCart(db, userId);
};

export const removeItem = async (db, userId, productId) => {
  unwrap(await db.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId));
  return getCart(db, userId);
};

export const clearCart = async (db, userId) => {
  unwrap(await db.from('cart_items').delete().eq('user_id', userId));
  return getCart(db, userId);
};

// Guest cart -> account cart (same database function the frontend already used).
export const mergeCart = async (db, userId, items) => {
  unwrap(
    await db.rpc('merge_cart', { p_items: items.map((i) => ({ product_id: i.productId, qty: i.qty })) })
  );
  return getCart(db, userId);
};
