import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getProductById } from '../data/products';
import { validateCoupon } from '../data/coupons';

const CartContext = createContext(null);
const STORAGE_KEY = 'smartcart_cart';
const COUPON_KEY = 'smartcart_applied_coupon';

const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const readCoupon = () => {
  try {
    return localStorage.getItem(COUPON_KEY) || null;
  } catch {
    return null;
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(readStorage);
  const [appliedCode, setAppliedCode] = useState(readCoupon);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCode) localStorage.setItem(COUPON_KEY, appliedCode);
    else localStorage.removeItem(COUPON_KEY);
  }, [appliedCode]);

  const addToCart = (productId, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === productId);
      if (existing) {
        return prev.map((i) => (i.id === productId ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { id: productId, qty }];
    });
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === productId ? { ...i, qty } : i)));
  };

  const clearCart = () => { setItems([]); setAppliedCode(null); };

  const cartItems = useMemo(
    () => items
      .map((i) => ({ ...i, product: getProductById(i.id) }))
      .filter((i) => i.product),
    [items]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0),
    [cartItems]
  );

  const savings = useMemo(
    () => cartItems.reduce((sum, i) => sum + Math.max(0, (i.product.originalPrice - i.product.price)) * i.qty, 0),
    [cartItems]
  );

  const couponResult = useMemo(
    () => (appliedCode ? validateCoupon(appliedCode, subtotal) : null),
    [appliedCode, subtotal]
  );
  const couponDiscount = couponResult?.ok ? couponResult.discount : 0;
  const coupon = couponResult?.ok ? couponResult.coupon : null;

  const applyCoupon = (code) => {
    const result = validateCoupon(code, subtotal);
    if (result.ok) setAppliedCode(code.trim().toUpperCase());
    return result;
  };
  const removeCoupon = () => setAppliedCode(null);

  const deliveryFee = subtotal > 0 && subtotal < 200 ? 25 : 0;
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems, addToCart, removeFromCart, updateQty, clearCart,
        subtotal, savings, deliveryFee, total, itemCount,
        coupon, couponDiscount, applyCoupon, removeCoupon,
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
