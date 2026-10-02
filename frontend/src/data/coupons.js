import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/errors';
import { api } from '../services/api';
import { getCatalogState, mapCoupon, refreshCatalog } from './catalogStore';

// Coupons live in Supabase. Discount calculation is authoritative on the server
// (validate_coupon for previews, place_order at checkout); the browser never
// decides whether a coupon is valid.

// Suggestions shown in the coupon box: only currently usable coupons.
export const getActiveCoupons = () => {
  const today = new Date().toISOString().slice(0, 10);
  return getCatalogState().coupons.filter(
    (c) => c.status === 'Active' && c.expiry >= today && c.usedCount < c.usageLimit
  );
};

// Server-side validation + discount preview via the Express API. The browser sends
// only product ids + quantities; the server prices them from the database.
export const validateCoupon = async (code, cartItems) => {
  try {
    const res = await api.post(
      '/coupons/validate',
      { code, items: cartItems.map((i) => ({ productId: i.id, qty: i.qty })) },
      { auth: false }
    );
    if (!res.valid) return { ok: false, error: res.message };
    return { ok: true, coupon: res.coupon, discount: res.discount };
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return { ok: false, error: 'Enter a valid coupon code.' };
    return { ok: false, error: err.message };
  }
};

// --- Admin (RLS: admins only) ---
export const getCoupons = async () =>
  unwrap(await supabase.from('coupons').select('*').order('id')).map(mapCoupon);

const toRow = (c) => ({
  code: c.code.trim().toUpperCase(),
  type: c.type,
  value: Number(c.value),
  min_order: Number(c.minOrder) || 0,
  max_discount: Number(c.maxDiscount) || 0,
  expiry: c.expiry,
  usage_limit: Number(c.usageLimit) || 0,
  status: c.status,
});

export const addCoupon = async (coupon) => {
  unwrap(await supabase.from('coupons').insert(toRow(coupon)));
  await refreshCatalog();
};

export const updateCoupon = async (id, coupon) => {
  unwrap(await supabase.from('coupons').update(toRow(coupon)).eq('id', id));
  await refreshCatalog();
};

export const deleteCoupon = async (id) => {
  unwrap(await supabase.from('coupons').delete().eq('id', id));
  await refreshCatalog();
};
