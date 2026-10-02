import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getCatalogVersion, loadCatalog, subscribeCatalog } from '../data/catalogStore';
import { useAuth } from './AuthContext';
import Button from '../ui/Button';

const CatalogContext = createContext(0);

// Loads products / categories / coupons / site settings from Supabase before the
// app renders, and reloads when the signed-in role changes (admins also see
// inactive products). Components call useCatalogVersion() so they re-render
// whenever the catalog changes.
export const CatalogProvider = ({ children }) => {
  const { user } = useAuth();
  const roleKey = user?.role || 'anon';
  const [version, setVersion] = useState(getCatalogVersion());
  const [status, setStatus] = useState({ loaded: false, error: null });

  const load = useCallback(() => {
    setStatus((s) => ({ ...s, error: null }));
    loadCatalog()
      .then(() => setStatus({ loaded: true, error: null }))
      .catch((e) => {
        console.error('[catalog] load failed', e);
        setStatus((s) => ({ ...s, error: e }));
      });
  }, []);

  useEffect(() => subscribeCatalog(setVersion), []);
  useEffect(() => { load(); }, [load, roleKey]);

  if (!status.loaded) {
    if (status.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-cream-50 dark:bg-ink-900">
          <div className="max-w-md text-center rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-8">
            <p className="font-display text-xl font-semibold text-ink-900 dark:text-white mb-2">We couldn't load SmartCart</p>
            <p className="text-sm text-ink-800/60 dark:text-white/60 mb-5">
              Please check your connection and try again.
            </p>
            <Button onClick={load}>Try again</Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-ink-900">
        <div className="h-9 w-9 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <CatalogContext.Provider value={version}>{children}</CatalogContext.Provider>;
};

// Subscribing hook: call it in any component that reads catalog getters.
export const useCatalogVersion = () => useContext(CatalogContext);
