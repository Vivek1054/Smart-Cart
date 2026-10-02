import { conflict, forbidden, fromSupabase, notFound, unwrap } from '../utils/errors.js';
import { mapReview } from './mappers.js';

// Customer-created reviews are always 'Pending' (the moderation flow is unchanged).
// The database enforces: verified purchase (RLS + has_purchased), one review per
// product per user, and that edits go back to Pending.
export const createReview = async (db, userId, productId, { rating, text }) => {
  const { data, error } = await db
    .from('product_reviews')
    .insert({ product_id: productId, user_id: userId, rating, text, status: 'Pending', author: 'Verified Buyer' })
    .select()
    .single();

  if (error) {
    if (error.code === '42501') throw forbidden('You can only review products from orders that were delivered to you');
    if (error.code === '23505') throw conflict('You have already reviewed this product', 'REVIEW_EXISTS');
    if (error.code === '23503') throw notFound('Product not found');
    throw fromSupabase(error);
  }
  return mapReview(data);
};

export const updateOwnReview = async (db, userId, reviewId, body) => {
  const patch = {};
  if (body.rating !== undefined) patch.rating = body.rating;
  if (body.text !== undefined) patch.text = body.text;
  const row = unwrap(
    await db.from('product_reviews').update(patch).eq('id', reviewId).eq('user_id', userId).select().maybeSingle()
  );
  if (!row) throw notFound('Review not found');
  return mapReview(row); // status is forced back to Pending by the database
};
