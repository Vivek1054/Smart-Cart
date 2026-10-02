import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { friendlyError } from '../lib/errors';
import { getProductById } from '../data/products';
import { getCatalogState } from '../data/catalogStore';
import { validateCoupon } from '../data/coupons';
import { useAuth } from './AuthContext';
import { useCatalogVersion } from './CatalogContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);
const GUEST_KEY = 'smartcart_cart';      // guest cart only (localStorage is fine for guests)
const COUPON_KEY = 'smartcart_applied_coupon'; // just the typed code; the server re-validates it

const readGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const writeGuestCart = (items) => {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
};
const readCoupon = () => {
  try { return localStorage.getItem(COUPON_KEY) || null; } catch { return null; }
};

const clampQty = (q) => Math.max(1, Math.min(99, Math.floor(Number(q) || 1)));

// Guest: local cart. Logged in: public.cart_items in Supabase is the source of
// truth; the guest cart is merged into it on login (merge_cart RPC), then cleared.
export const CartProvider = ({ children }) => {
  const { user, authLoading } = useAuth();
  const { notify } = useToast();
  const catalogVersion = useCatalogVersion();
  const userId = user?.id || null;

  const [items, setItemsState] = useState(readGuestCart);
  const itemsRef = useRef(items);
  const [appliedCode, setAppliedCode] = useState(readCoupon);
  const [couponState, setCouponState] = useState({ coupon: null, discount: 0 });
  const [syncing, setSyncing] = useState(false);

  const setItems = useCallback((next) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);

  // Load the server cart (merging any guest cart first) whenever the user changes.
  const loadServerCart = useCallback(async (uid) => {
    const { data, error } = await supabase
      .from('cart_items').select('product_id, qty').eq('user_id', uid).order('updated_at');
    if (error) throw error;
    setItems(data.map((r) => ({ id: Number(r.product_id), qty: r.qty })));
  }, [setItems]);

  useEffect(() => {
    if (authLoading) return undefined;
    let alive = true;
    (async () => {
      if (!userId) {
        setItems(readGuestCart());
        return;
      }
      setSyncing(true);
      try {
        const guest = readGuestCart();
        if (guest.length) {
          const { error } = await supabase.rpc('merge_cart', {
            p_items: guest.map((i) => ({ product_id: i.id, qty: i.qty })),
          });
          if (error) throw error;
          try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
        }
        if (alive) await loadServerCart(userId);
      } catch (e) {
        console.error('[cart] sync failed', e);
        if (alive) notify('We could not sync your cart. Please refresh.', 'error');
      } finally {
        if (alive) setSyncing(false);
      }
    })();
    return () => { alive = false; };
  }, [userId, authLoading, loadServerCart, setItems, notify]);

  useEffect(() => {
    try {
      if (appliedCode) localStorage.setItem(COUPON_KEY, appliedCode);
      else localStorage.removeItem(COUPON_KEY);
    } catch { /* ignore */ }
  }, [appliedCode]);

  // Persist one change: guests -> localStorage, users -> Supabase (rolled back on error).
  const commit = useCallback(async (next, remoteOp) => {
    const previous = itemsRef.current;
    setItems(next);
    if (!userId) {
      writeGuestCart(next);
      return;
    }
    try {
      const { error } = await remoteOp();
      if (error) throw error;
    } catch (e) {
      setItems(previous);
      notify(friendlyError(e, 'Could not update your cart. Please try again.'), 'error');
    }
  }, [userId, setItems, notify]);

  const addToCart = useCallback((productId, qty = 1) => {
    const current = itemsRef.current;
    const existing = current.find((i) => i.id === productId);
    const newQty = clampQty((existing?.qty || 0) + qty);
    const next = existing
      ? current.map((i) => (i.id === productId ? { ...i, qty: newQty } : i))
      : [...current, { id: productId, qty: newQty }];
    return commit(next, () =>
      supabase.from('cart_items').upsert({ user_id: userId, product_id: productId, qty: newQty }, { onConflict: 'user_id,product_id' })
    );
  }, [commit, userId]);

  const removeFromCart = useCallback((productId) => {
    const next = itemsRef.current.filter((i) => i.id !== productId);
    return commit(next, () =>
      supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId)
    );
  }, [commit, userId]);

  const updateQty = useCallback((productId, qty) => {
    if (qty < 1) return removeFromCart(productId);
    const newQty = clampQty(qty);
    const next = itemsRef.current.map((i) => (i.id === productId ? { ...i, qty: newQty } : i));
    return commit(next, () =>
      supabase.from('cart_items').upsert({ user_id: userId, product_id: productId, qty: newQty }, { onConflict: 'user_id,product_id' })
    );
  }, [commit, userId, removeFromCart]);

  const clearCart = useCallback(() => {
    setAppliedCode(null);
    return commit([], () => supabase.from('cart_items').delete().eq('user_id', userId));
  }, [commit, userId]);

  // Display-only totals: the server recomputes everything at checkout.
  const cartItems = useMemo(
    () => items.map((i) => ({ ...i, product: getProductById(i.id) })).filter((i) => i.product),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, catalogVersion]
  );

  const subtotal = useMemo(() => cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0), [cartItems]);
  const savings = useMemo(
    () => cartItems.reduce((sum, i) => sum + Math.max(0, i.product.originalPrice - i.product.price) * i.qty, 0),
    [cartItems]
  );

  // Coupon preview from the database (validate_coupon). Re-checked whenever the subtotal changes.
  useEffect(() => {
    if (!appliedCode || subtotal <= 0) {
      setCouponState({ coupon: null, discount: 0 });
      return undefined;
    }
    let stale = false;
    validateCoupon(appliedCode, itemsRef.current).then((res) => {
      if (stale) return;
      setCouponState(res?.ok ? { coupon: res.coupon, discount: res.discount } : { coupon: null, discount: 0 });
    });
    return () => { stale = true; };
  }, [appliedCode, subtotal, items]);

  const applyCoupon = useCallback(async (code) => {
    const result = await validateCoupon(code, itemsRef.current);
    if (result.ok) setAppliedCode(result.coupon.code);
    return result;
  }, []);
  const removeCoupon = useCallback(() => setAppliedCode(null), []);

  const { delivery } = getCatalogState();
  const deliveryFee = subtotal > 0 && subtotal < delivery.free_above ? delivery.fee : 0;
  const couponDiscount = couponState.discount;
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems, addToCart, removeFromCart, updateQty, clearCart, syncing,
        subtotal, savings, deliveryFee, total, itemCount,
        coupon: couponState.coupon, couponDiscount, applyCoupon, removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
