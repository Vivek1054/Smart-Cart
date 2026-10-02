import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { friendlyError } from '../lib/errors';
import { getProductById } from '../data/products';
import { useAuth } from './AuthContext';
import { useCatalogVersion } from './CatalogContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);
const GUEST_KEY = 'smartcart_wishlist'; // guest wishlist only

const readGuest = () => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
};
const writeGuest = (ids) => {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
};

// Guest: local wishlist. Logged in: public.wishlist_items in Supabase. The guest
// list is merged into the account on login and then cleared.
export const WishlistProvider = ({ children }) => {
  const { user, authLoading } = useAuth();
  const { notify } = useToast();
  const catalogVersion = useCatalogVersion();
  const userId = user?.id || null;

  const [ids, setIdsState] = useState(readGuest);
  const idsRef = useRef(ids);
  const setIds = useCallback((next) => { idsRef.current = next; setIdsState(next); }, []);

  useEffect(() => {
    if (authLoading) return undefined;
    let alive = true;
    (async () => {
      if (!userId) { setIds(readGuest()); return; }
      try {
        const guest = readGuest();
        if (guest.length) {
          const { error } = await supabase
            .from('wishlist_items')
            .upsert(guest.map((product_id) => ({ user_id: userId, product_id })), { onConflict: 'user_id,product_id', ignoreDuplicates: true });
          // A guest id for a product that no longer exists just fails the FK; not fatal.
          if (error) console.warn('[wishlist] merge partly failed', error.message);
          try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
        }
        const { data, error } = await supabase.from('wishlist_items').select('product_id').eq('user_id', userId).order('created_at');
        if (error) throw error;
        if (alive) setIds(data.map((r) => Number(r.product_id)));
      } catch (e) {
        console.error('[wishlist] sync failed', e);
        if (alive) notify('We could not load your wishlist.', 'error');
      }
    })();
    return () => { alive = false; };
  }, [userId, authLoading, setIds, notify]);

  const commit = useCallback(async (next, remoteOp) => {
    const previous = idsRef.current;
    setIds(next);
    if (!userId) { writeGuest(next); return; }
    try {
      const { error } = await remoteOp();
      if (error) throw error;
    } catch (e) {
      setIds(previous);
      notify(friendlyError(e, 'Could not update your wishlist.'), 'error');
    }
  }, [userId, setIds, notify]);

  const isWishlisted = (productId) => ids.includes(Number(productId));

  const toggleWishlist = useCallback((productId) => {
    const id = Number(productId);
    const current = idsRef.current;
    if (current.includes(id)) {
      return commit(current.filter((x) => x !== id), () =>
        supabase.from('wishlist_items').delete().eq('user_id', userId).eq('product_id', id));
    }
    return commit([...current, id], () =>
      supabase.from('wishlist_items').insert({ user_id: userId, product_id: id }));
  }, [commit, userId]);

  const removeFromWishlist = useCallback((productId) => {
    const id = Number(productId);
    return commit(idsRef.current.filter((x) => x !== id), () =>
      supabase.from('wishlist_items').delete().eq('user_id', userId).eq('product_id', id));
  }, [commit, userId]);

  const wishlistItems = useMemo(
    () => ids.map((id) => getProductById(id)).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids, catalogVersion]
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
