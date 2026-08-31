import rawList from '../assets/list.json';

// Deterministic pseudo-random generator seeded by product id so values
// stay stable across renders/reloads instead of reshuffling randomly.
const seededFraction = (seed, salt = 0) => {
  const x = Math.sin(seed * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
};

const SPEC_TEMPLATES = {
  'under 40 rupee': { weight: '150g', calories: '280 kcal', prepTime: '5 min', allergens: 'Gluten, Dairy' },
  'premium sandwiches': { weight: '220g', calories: '410 kcal', prepTime: '8 min', allergens: 'Gluten, Dairy, Egg' },
  'egg specials': { weight: '180g', calories: '320 kcal', prepTime: '6 min', allergens: 'Gluten, Egg' },
  'vegetarian specials': { weight: '170g', calories: '260 kcal', prepTime: '6 min', allergens: 'Gluten, Dairy' },
  'non-veg specials': { weight: '210g', calories: '390 kcal', prepTime: '9 min', allergens: 'Gluten, Dairy' },
};

const REVIEW_SNIPPETS = [
  "Exactly what I was craving, fresh and generously filled.",
  "Great value for the price, will order again.",
  "Tasted amazing, packaging kept it warm on delivery.",
  "Solid choice, though I'd like a bit more filling.",
  "One of the better sandwiches I've had from a delivery app.",
  "Perfectly toasted and the flavors were well balanced.",
];

function buildProduct(item) {
  const rating = Math.round((3.9 + seededFraction(item.id, 1) * 1.0) * 10) / 10;
  const reviewCount = Math.floor(18 + seededFraction(item.id, 2) * 260);
  const hasDiscount = seededFraction(item.id, 3) > 0.45;
  const discount = hasDiscount ? Math.floor(10 + seededFraction(item.id, 4) * 25) : 0;
  const originalPrice = discount ? Math.round(item.price / (1 - discount / 100)) : item.price;
  const inStock = item.stockCount === undefined ? seededFraction(item.id, 5) > 0.08 : item.stockCount > 0;
  const stockCount = item.stockCount !== undefined ? item.stockCount : (inStock ? Math.floor(4 + seededFraction(item.id, 6) * 40) : 0);
  const spec = SPEC_TEMPLATES[item.category] || SPEC_TEMPLATES['under 40 rupee'];

  const reviews = [0, 1].map((i) => {
    const idx = Math.floor(seededFraction(item.id, 10 + i) * REVIEW_SNIPPETS.length);
    const r = Math.max(3, Math.min(5, Math.round(rating - 0.5 + seededFraction(item.id, 20 + i) * 1.5)));
    return {
      id: `${item.id}-r${i}`,
      author: 'Verified Buyer',
      rating: r,
      text: REVIEW_SNIPPETS[idx],
    };
  });

  return {
    ...item,
    rating,
    reviewCount,
    discount,
    originalPrice,
    inStock,
    stockCount,
    isBestSeller: item.id % 3 === 0,
    isTrending: item.id % 4 === 0,
    isFlashDeal: discount >= 20,
    specifications: {
      Weight: spec.weight,
      Calories: spec.calories,
      'Prep Time': spec.prepTime,
      Allergens: spec.allergens,
    },
    description: item.title,
    reviews,
  };
}

const OVERLAY_KEY = 'smartcart_product_overlay';
const readOverlay = () => {
  try {
    return JSON.parse(localStorage.getItem(OVERLAY_KEY)) || { added: [], edited: {}, deletedIds: [] };
  } catch {
    return { added: [], edited: {}, deletedIds: [] };
  }
};
const writeOverlay = (overlay) => localStorage.setItem(OVERLAY_KEY, JSON.stringify(overlay));

const basProducts = rawList.map(buildProduct);

// Merges the static seed catalog with anything added/edited/deleted via the
// Admin > Products screen (persisted in localStorage — there's no backend).
export const getAllProducts = () => {
  const overlay = readOverlay();
  const edited = basProducts
    .filter((p) => !overlay.deletedIds.includes(p.id))
    .map((p) => (overlay.edited[p.id] ? buildProduct({ ...p, ...overlay.edited[p.id] }) : p));
  const added = overlay.added.map(buildProduct);
  return [...edited, ...added];
};

export const getProductById = (id) => getAllProducts().find((p) => String(p.id) === String(id));

export const getCategories = () => ['All', ...new Set(getAllProducts().map((p) => p.category))];

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

// --- Admin CRUD (persisted as an overlay on top of the static seed data) ---
export const adminAddProduct = (data) => {
  const overlay = readOverlay();
  const nextId = Math.max(0, ...basProducts.map((p) => p.id), ...overlay.added.map((p) => p.id)) + 1;
  const newItem = { id: nextId, image: 'https://images.pexels.com/photos/3761662/pexels-photo-3761662.jpeg?auto=compress&cs=tinysrgb&w=500', ...data };
  overlay.added.push(newItem);
  writeOverlay(overlay);
  return buildProduct(newItem);
};

export const adminUpdateProduct = (id, patch) => {
  const overlay = readOverlay();
  const addedIdx = overlay.added.findIndex((p) => p.id === Number(id));
  if (addedIdx >= 0) {
    overlay.added[addedIdx] = { ...overlay.added[addedIdx], ...patch };
  } else {
    overlay.edited[id] = { ...overlay.edited[id], ...patch };
  }
  writeOverlay(overlay);
};

export const adminDeleteProduct = (id) => {
  const overlay = readOverlay();
  if (overlay.added.some((p) => p.id === Number(id))) {
    overlay.added = overlay.added.filter((p) => p.id !== Number(id));
  } else if (!overlay.deletedIds.includes(Number(id))) {
    overlay.deletedIds.push(Number(id));
  }
  writeOverlay(overlay);
};
