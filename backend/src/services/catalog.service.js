import { unwrap, notFound } from '../utils/errors.js';
import { mapCategory, mapProduct, mapReview, pageMeta, range } from './mappers.js';

// Escape characters that have meaning inside PostgREST filter strings / LIKE patterns.
const safeSearch = (s) => s.replace(/[%_\\,()*]/g, ' ').replace(/\s+/g, ' ').trim();

const SORTS = {
  default: ['id', true],
  'price-asc': ['price', true],
  'price-desc': ['price', false],
  'rating-desc': ['rating', false],
  'name-asc': ['name', true],
  newest: ['created_at', false],
};

// `db` is the anon client for public routes: RLS only returns active products in
// active categories, so inactive items can never leak through this API.
export const listProducts = async (db, q) => {
  let query = db.from('catalog_products').select('*', { count: 'exact' });

  if (q.search) {
    const s = safeSearch(q.search);
    if (s) query = query.or(`name.ilike.%${s}%,title.ilike.%${s}%`);
  }
  if (q.category) query = query.eq('category', q.category);
  if (q.minPrice !== undefined) query = query.gte('price', q.minPrice);
  if (q.maxPrice !== undefined) query = query.lte('price', q.maxPrice);
  if (q.minRating !== undefined) query = query.gte('rating', q.minRating);
  if (q.deals) query = query.gte('discount_percent', 20);

  const [column, ascending] = SORTS[q.sort];
  query = query.order(column, { ascending }).order('id', { ascending: true });

  const [from, to] = range(q);
  const { data, count, error } = await query.range(from, to);
  const rows = unwrap({ data, error });
  return { products: rows.map(mapProduct), meta: pageMeta(q, count) };
};

export const getProduct = async (db, id) => {
  const row = unwrap(await db.from('catalog_products').select('*').eq('id', id).maybeSingle());
  if (!row) throw notFound('Product not found');
  return mapProduct(row);
};

export const listCategories = async (db) =>
  unwrap(await db.from('categories').select('*').eq('status', 'Active').order('sort_order').order('id')).map(mapCategory);

export const listApprovedReviews = async (db, productId, q) => {
  const [from, to] = range(q);
  const { data, count, error } = await db
    .from('product_reviews')
    .select('id, product_id, author, rating, text, status, created_at', { count: 'exact' })
    .eq('product_id', productId)
    .eq('status', 'Approved')
    .order('created_at', { ascending: false })
    .range(from, to);
  return { reviews: unwrap({ data, error }).map(mapReview), meta: pageMeta(q, count) };
};

// Product details for a list of ids (used by cart, wishlist, coupon and reorder).
export const productsByIds = async (db, ids) => {
  if (ids.length === 0) return new Map();
  const rows = unwrap(await db.from('catalog_products').select('*').in('id', ids));
  return new Map(rows.map((r) => [Number(r.id), mapProduct(r)]));
};
