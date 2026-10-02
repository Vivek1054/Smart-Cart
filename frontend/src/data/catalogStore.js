import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/errors';

// In-memory copy of the public catalog (products, categories, coupons, site
// settings), loaded from Supabase. It bridges async Supabase reads to the
// synchronous getters the UI already uses (getAllProducts, getProductById, ...).
// Supabase is the source of truth; this is just a cache that is refreshed after
// every admin change and when the signed-in role changes.

export const DEFAULT_BANNER = {
  title: 'Craving something new? Explore the full menu.',
  description: "From budget bites to premium picks, there's a sandwich for every mood.",
  ctaText: 'Explore Menu',
  ctaLink: '/menu',
  active: true,
};
const DEFAULT_DELIVERY = { fee: 25, free_above: 200 };
const DEFAULT_STORE = { name: 'SmartCart', currency: 'INR', support_email: 'support@smartcart.com' };

const state = {
  loaded: false,
  products: [],
  categories: [],
  coupons: [],
  banner: DEFAULT_BANNER,
  delivery: DEFAULT_DELIVERY,
  store: DEFAULT_STORE,
};

const listeners = new Set();
let version = 0;
const emit = () => { version += 1; listeners.forEach((l) => l(version)); };
export const subscribeCatalog = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getCatalogVersion = () => version;
export const getCatalogState = () => state;

export const mapProduct = (row) => ({
  id: Number(row.id),
  name: row.name,
  title: row.title,
  description: row.title,
  price: Number(row.price),
  category: row.category,
  categoryId: Number(row.category_id),
  image: row.image,
  rating: Number(row.rating),
  reviewCount: Number(row.review_count),
  discount: Number(row.discount_percent),
  originalPrice: Number(row.original_price),
  stockCount: Number(row.stock_count),
  inStock: Number(row.stock_count) > 0,
  isBestSeller: !!row.is_best_seller,
  isTrending: !!row.is_trending,
  isFlashDeal: Number(row.discount_percent) >= 20,
  isActive: !!row.is_active,
  updatedAt: row.updated_at,
  specifications: row.specs || {},
});

export const mapCoupon = (c) => ({
  id: Number(c.id),
  code: c.code,
  type: c.type,
  value: Number(c.value),
  minOrder: Number(c.min_order),
  maxDiscount: Number(c.max_discount),
  expiry: c.expiry,
  usageLimit: Number(c.usage_limit),
  usedCount: Number(c.used_count),
  status: c.status,
});

export const mapCategory = (c) => ({
  id: Number(c.id),
  name: c.name,
  icon: c.icon,
  description: c.description,
  status: c.status,
  sortOrder: Number(c.sort_order),
});

export const loadCatalog = async () => {
  const [products, categories, settings, coupons] = await Promise.all([
    supabase.from('catalog_products').select('*').order('id'),
    supabase.from('categories').select('*').order('sort_order').order('id'),
    supabase.from('site_settings').select('key, value'),
    supabase.from('coupons').select('*').eq('status', 'Active').order('id'),
  ]);

  state.products = unwrap(products).map(mapProduct);
  state.categories = unwrap(categories).map(mapCategory);
  state.coupons = unwrap(coupons).map(mapCoupon);
  const byKey = Object.fromEntries((unwrap(settings) || []).map((s) => [s.key, s.value]));
  state.banner = { ...DEFAULT_BANNER, ...(byKey.promo_banner || {}) };
  state.delivery = { ...DEFAULT_DELIVERY, ...(byKey.delivery || {}) };
  state.store = { ...DEFAULT_STORE, ...(byKey.store || {}) };
  state.loaded = true;
  emit();
  return state;
};

export const refreshCatalog = loadCatalog;
