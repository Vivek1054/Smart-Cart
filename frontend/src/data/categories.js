import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/errors';
import { getCatalogState, refreshCatalog } from './catalogStore';
import { getAllProductsForAdmin } from './products';

// Categories live in Supabase. Admin CRUD is protected by RLS (admins only).

export const getCategoriesWithMeta = () => {
  const products = getAllProductsForAdmin();
  return getCatalogState().categories.map((c) => ({
    ...c,
    productCount: products.filter((p) => p.category === c.name).length,
  }));
};

export const addCategory = async ({ name, icon, description, status = 'Active' }) => {
  const sortOrder = Math.max(0, ...getCatalogState().categories.map((c) => c.sortOrder)) + 1;
  unwrap(await supabase.from('categories').insert({
    name: name.trim(),
    icon: icon || '🍽️',
    description: description || '',
    status,
    sort_order: sortOrder,
  }));
  await refreshCatalog();
};

export const updateCategory = async (id, patch) => {
  const row = {};
  if (patch.name !== undefined) row.name = patch.name.trim();
  if (patch.icon !== undefined) row.icon = patch.icon;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.status !== undefined) row.status = patch.status;
  unwrap(await supabase.from('categories').update(row).eq('id', id));
  await refreshCatalog();
};

export const deleteCategory = async (id) => {
  unwrap(await supabase.from('categories').delete().eq('id', id));
  await refreshCatalog();
};

// Swap sort order with the neighbour above (-1) or below (+1).
export const moveCategory = async (id, direction) => {
  const list = [...getCatalogState().categories].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const i = list.findIndex((c) => c.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  // renumber so ties can never leave the order ambiguous
  const reordered = [...list];
  [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
  const results = await Promise.all(
    reordered.map((c, idx) => supabase.from('categories').update({ sort_order: idx + 1 }).eq('id', c.id))
  );
  results.forEach((r) => unwrap(r));
  await refreshCatalog();
};
