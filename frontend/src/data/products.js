import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/errors';
import { api } from '../services/api';
import { getCatalogState, refreshCatalog } from './catalogStore';

// Product data now lives in Supabase (products / categories / product_reviews).
// The synchronous getters below read the catalog cache that CatalogProvider
// loads from Supabase, so existing components keep working unchanged.

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.pexels.com/photos/3761662/pexels-photo-3761662.jpeg?auto=compress&cs=tinysrgb&w=500';

const activeCategoryNames = () =>
  new Set(getCatalogState().categories.filter((c) => c.status === 'Active').map((c) => c.name));

// Storefront view: active products in active categories only.
export const getAllProducts = () => {
  const active = activeCategoryNames();
  return getCatalogState().products.filter((p) => p.isActive && active.has(p.category));
};

// Admin view: every product, including inactive ones.
export const getAllProductsForAdmin = () => getCatalogState().products;

export const getProductById = (id) => getAllProducts().find((p) => String(p.id) === String(id));
export const getProductByIdForAdmin = (id) => getCatalogState().products.find((p) => String(p.id) === String(id));

export const getCategories = () => ['All', ...getCatalogState().categories.filter((c) => c.status === 'Active').map((c) => c.name)];

export const getRelatedProducts = (product, limit = 4) => {
  if (!product) return [];
  const all = getAllProducts();
  return all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit)
    .concat(all.filter((p) => p.id !== product.id && p.category !== product.category))
    .slice(0, limit);
};

export const getBestSellers = (limit = 8) => getAllProducts().filter((p) => p.isBestSeller).slice(0, limit);
export const getTrending = (limit = 8) => getAllProducts().filter((p) => p.isTrending).slice(0, limit);
export const getFlashDeals = (limit = 8) => getAllProducts().filter((p) => p.isFlashDeal).slice(0, limit);

// --- Admin CRUD (RLS only lets admins write these tables) ---
const categoryIdFor = (name) => {
  const cat = getCatalogState().categories.find((c) => c.name === name);
  if (!cat) throw new Error('Please choose a valid category.');
  return cat.id;
};

const toRow = (data) => {
  const row = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.title !== undefined) row.title = data.title;
  if (data.price !== undefined) row.price = data.price;
  if (data.stockCount !== undefined) row.stock_count = data.stockCount;
  if (data.image !== undefined) row.image = data.image;
  if (data.category !== undefined) row.category_id = categoryIdFor(data.category);
  if (data.discount !== undefined) row.discount_percent = data.discount;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  if (data.isBestSeller !== undefined) row.is_best_seller = data.isBestSeller;
  if (data.isTrending !== undefined) row.is_trending = data.isTrending;
  return row;
};

export const adminAddProduct = async (data) => {
  const row = { image: DEFAULT_PRODUCT_IMAGE, ...toRow(data) };
  if (!row.image) row.image = DEFAULT_PRODUCT_IMAGE;
  unwrap(await supabase.from('products').insert(row));
  await refreshCatalog();
};

export const adminUpdateProduct = async (id, patch) => {
  unwrap(await supabase.from('products').update(toRow(patch)).eq('id', id));
  await refreshCatalog();
};

export const adminDeleteProduct = async (id) => {
  unwrap(await supabase.from('products').delete().eq('id', id));
  await refreshCatalog();
};

// --- Reviews (real, moderated) ---
export const getApprovedReviews = async (productId) => {
  const rows = unwrap(
    await supabase
      .from('product_reviews')
      .select('id, author, rating, text, created_at')
      .eq('product_id', productId)
      .eq('status', 'Approved')
      .order('created_at', { ascending: false })
  );
  return rows.map((r) => ({ id: r.id, author: r.author, rating: r.rating, text: r.text, date: r.created_at }));
};

// The signed-in user's own review of a product (any status), plus whether they may review.
export const getMyReviewState = async (productId) => {
  const [{ data: canReview }, { data: mine }] = await Promise.all([
    supabase.rpc('has_purchased', { p_product_id: productId }),
    supabase.from('product_reviews').select('id, rating, text, status').eq('product_id', productId).maybeSingle(),
  ]);
  return { canReview: !!canReview, mine: mine || null };
};

// POST /api/v1/products/:id/reviews - created as Pending (moderated); the user comes from the token.
export const submitReview = async (productId, { rating, text }) => {
  await api.post(`/products/${productId}/reviews`, { rating, text: text.trim() });
};
