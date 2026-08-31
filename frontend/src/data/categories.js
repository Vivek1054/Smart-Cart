import { getAllProducts, getCategories as getCategoryNames } from './products';

const META_KEY = 'smartcart_category_meta';

const DEFAULT_ICONS = {
  'under 40 rupee': '🥪',
  'premium sandwiches': '🍔',
  'egg specials': '🍳',
  'vegetarian specials': '🥗',
  'non-veg specials': '🍗',
};

const readMeta = () => {
  try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch { return {}; }
};
const writeMeta = (meta) => localStorage.setItem(META_KEY, JSON.stringify(meta));

export const getCategoriesWithMeta = () => {
  const names = getCategoryNames().filter((c) => c !== 'All');
  const products = getAllProducts();
  const meta = readMeta();
  return names.map((name) => ({
    id: name,
    name,
    icon: meta[name]?.icon || DEFAULT_ICONS[name] || '🍽️',
    description: meta[name]?.description || `Delicious picks from our ${name} range.`,
    status: meta[name]?.status || 'Active',
    productCount: products.filter((p) => p.category === name).length,
  }));
};

export const updateCategoryMeta = (name, patch) => {
  const meta = readMeta();
  meta[name] = { ...meta[name], ...patch };
  writeMeta(meta);
};
