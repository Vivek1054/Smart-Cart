import { notFound, unwrap } from '../utils/errors.js';
import { mapAddress } from './mappers.js';

// Columns that exist in public.addresses: label, line1, city, pincode, phone.
// (There is no state/country/name column in the current schema.)

export const listAddresses = async (db, userId) =>
  unwrap(await db.from('addresses').select('*').eq('user_id', userId).order('created_at')).map(mapAddress);

export const createAddress = async (db, userId, body) =>
  mapAddress(
    unwrap(
      await db
        .from('addresses')
        .insert({ user_id: userId, label: body.label, line1: body.line1, city: body.city, pincode: body.pincode, phone: body.phone ?? null })
        .select()
        .single()
    )
  );

export const updateAddress = async (db, userId, id, body) => {
  const row = unwrap(
    await db.from('addresses').update(body).eq('id', id).eq('user_id', userId).select().maybeSingle()
  );
  if (!row) throw notFound('Address not found');
  return mapAddress(row);
};

export const deleteAddress = async (db, userId, id) => {
  const row = unwrap(await db.from('addresses').delete().eq('id', id).eq('user_id', userId).select('id').maybeSingle());
  if (!row) throw notFound('Address not found');
  return { id, deleted: true };
};
