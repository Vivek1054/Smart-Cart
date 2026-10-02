import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/errors';

// Saved addresses live in public.addresses (RLS: each user only sees their own).

const map = (a) => ({
  id: Number(a.id),
  label: a.label,
  line1: a.line1,
  city: a.city,
  pincode: a.pincode,
  phone: a.phone || '',
});

export const getAddresses = async (userId) => {
  if (!userId) return [];
  return unwrap(
    await supabase.from('addresses').select('*').eq('user_id', userId).order('created_at')
  ).map(map);
};

const toRow = (a) => ({
  label: (a.label || '').trim(),
  line1: a.line1.trim(),
  city: a.city.trim(),
  pincode: a.pincode.trim(),
  phone: a.phone?.trim() || null,
});

export const addAddress = async (userId, address) =>
  map(unwrap(await supabase.from('addresses').insert({ user_id: userId, ...toRow(address) }).select().single()));

export const updateAddress = async (id, address) =>
  map(unwrap(await supabase.from('addresses').update(toRow(address)).eq('id', id).select().single()));

export const deleteAddress = async (id) => {
  unwrap(await supabase.from('addresses').delete().eq('id', id));
};
