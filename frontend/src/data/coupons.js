const COUPONS_KEY = 'smartcart_coupons';

const DEFAULT_COUPONS = [
  { id: 1, code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 50, maxDiscount: 30, expiry: '2026-12-31', usageLimit: 500, usedCount: 128, status: 'Active' },
  { id: 2, code: 'FLAT20', type: 'fixed', value: 20, minOrder: 100, maxDiscount: 20, expiry: '2026-10-31', usageLimit: 200, usedCount: 54, status: 'Active' },
  { id: 3, code: 'SANDWICH50', type: 'percentage', value: 50, minOrder: 30, maxDiscount: 25, expiry: '2026-09-15', usageLimit: 100, usedCount: 100, status: 'Expired' },
  { id: 4, code: 'FREESHIP', type: 'fixed', value: 25, minOrder: 0, maxDiscount: 25, expiry: '2027-01-31', usageLimit: 1000, usedCount: 340, status: 'Active' },
];

const read = () => {
  try {
    const raw = localStorage.getItem(COUPONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to seed */ }
  localStorage.setItem(COUPONS_KEY, JSON.stringify(DEFAULT_COUPONS));
  return DEFAULT_COUPONS;
};

const write = (coupons) => localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));

export const getCoupons = () => read();

export const getActiveCoupons = () => read().filter((c) => c.status === 'Active' && new Date(c.expiry) > new Date());

export const validateCoupon = (code, subtotal) => {
  const coupon = read().find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
  if (!coupon) return { ok: false, error: 'Invalid coupon code.' };
  if (coupon.status !== 'Active') return { ok: false, error: 'This coupon is no longer active.' };
  if (new Date(coupon.expiry) < new Date()) return { ok: false, error: 'This coupon has expired.' };
  if (coupon.usedCount >= coupon.usageLimit) return { ok: false, error: 'This coupon has reached its usage limit.' };
  if (subtotal < coupon.minOrder) return { ok: false, error: `Minimum order of ₹${coupon.minOrder} required.` };

  const rawDiscount = coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
  const discount = Math.min(rawDiscount, coupon.maxDiscount);
  return { ok: true, coupon, discount: Math.round(discount) };
};

export const redeemCoupon = (code) => {
  const coupons = read();
  const updated = coupons.map((c) => (c.code.toLowerCase() === code.trim().toLowerCase() ? { ...c, usedCount: c.usedCount + 1 } : c));
  write(updated);
};

export const addCoupon = (coupon) => {
  const coupons = read();
  const next = { ...coupon, id: Date.now(), usedCount: 0 };
  write([...coupons, next]);
  return next;
};

export const updateCoupon = (id, patch) => {
  const coupons = read().map((c) => (c.id === id ? { ...c, ...patch } : c));
  write(coupons);
};

export const deleteCoupon = (id) => {
  write(read().filter((c) => c.id !== id));
};
