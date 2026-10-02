import { unwrap } from '../utils/errors.js';
import { productsByIds } from './catalog.service.js';

const DEFAULT_DELIVERY = { fee: 25, free_above: 200 };

export const getDeliveryRule = async (db) => {
  const row = unwrap(await db.from('site_settings').select('value').eq('key', 'delivery').maybeSingle());
  return { ...DEFAULT_DELIVERY, ...(row?.value || {}) };
};

export const deliveryFeeFor = (subtotal, rule) =>
  subtotal > 0 && subtotal < Number(rule.free_above) ? Number(rule.fee) : 0;

// Coupon preview. The subtotal is recomputed from database prices (the client
// only names products and quantities), and the coupon rules are evaluated by the
// same SQL function place_order() uses, so preview and final order can't disagree.
export const validateCoupon = async (db, { code, items }, userCartItems) => {
  const lines = (items ?? userCartItems ?? []).map((i) => ({ productId: Number(i.productId), qty: Number(i.qty) }));
  const products = await productsByIds(db, [...new Set(lines.map((l) => l.productId))]);

  const subtotal = lines.reduce((sum, l) => sum + (products.get(l.productId)?.price ?? 0) * l.qty, 0);
  const rule = await getDeliveryRule(db);
  const deliveryFee = deliveryFeeFor(subtotal, rule);

  const result = unwrap(await db.rpc('validate_coupon', { p_code: code, p_subtotal: subtotal }));
  if (!result?.ok) {
    return { valid: false, message: result?.error || 'Invalid coupon code.', subtotal, deliveryFee };
  }
  const discount = Number(result.discount);
  return {
    valid: true,
    coupon: result.coupon,
    discount,
    subtotal,
    deliveryFee,
    total: Math.max(0, subtotal + deliveryFee - discount), // preview only
  };
};
