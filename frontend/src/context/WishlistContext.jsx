import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getProductById } from '../data/products';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'smartcart_wishlist';

const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const WishlistProvider = ({ children }) => {
  const [ids, setIds] = useState(readStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const isWishlisted = (productId) => ids.includes(productId);

  const toggleWishlist = (productId) => {
    setIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  };

  const removeFromWishlist = (productId) => {
    setIds((prev) => prev.filter((id) => id !== productId));
  };

  const wishlistItems = useMemo(
    () => ids.map((id) => getProductById(id)).filter(Boolean),
    [ids]
  );

  return (
    <WishlistContext.Provider value={{ wishlistItems, isWishlisted, toggleWishlist, removeFromWishlist, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
