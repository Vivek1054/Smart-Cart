import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/errors';
import { getCatalogState, refreshCatalog } from './catalogStore';

// Promo banner + store settings are rows in site_settings (public read, admin write).

export const getPromoBanner = () => getCatalogState().banner;

export const savePromoBanner = async (banner) => {
  unwrap(await supabase.from('site_settings').upsert({ key: 'promo_banner', value: banner }));
  await refreshCatalog();
};

export const getStoreSettings = () => getCatalogState().store;

export const saveStoreSettings = async (store) => {
  unwrap(await supabase.from('site_settings').upsert({ key: 'store', value: store }));
  await refreshCatalog();
};

export const getDeliverySettings = () => getCatalogState().delivery;
