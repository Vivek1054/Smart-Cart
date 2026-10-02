import { notFound, unwrap } from '../utils/errors.js';
import { productsByIds } from './catalog.service.js';

export const listWishlist = async (db, userId) => {
  const rows = unwrap(
    await db.from('wishlist_items').select('product_id, created_at').eq('user_id', userId).order('created_at')
  );
  const products = await productsByIds(db, rows.map((r) => Number(r.product_id)));
  return rows
    .map((r) => ({ productId: Number(r.product_id), addedAt: r.created_at, product: products.get(Number(r.product_id)) || null }))
    .filter((i) => i.product);
};

export const addToWishlist = async (db, userId, productId) => {
  const products = await productsByIds(db, [productId]);
  if (!products.has(productId)) throw notFound('Product not found');
  unwrap(
    await db.from('wishlist_items').upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
  );
  return { productId, wishlisted: true };
};

export const removeFromWishlist = async (db, userId, productId) => {
  unwrap(await db.from('wishlist_items').delete().eq('user_id', userId).eq('product_id', productId));
  return { productId, wishlisted: false };
};

export const isWishlisted = async (db, userId, productId) => {
  const row = unwrap(
    await db.from('wishlist_items').select('product_id').eq('user_id', userId).eq('product_id', productId).maybeSingle()
  );
  return { productId, wishlisted: !!row };
};
