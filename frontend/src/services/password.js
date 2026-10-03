import { supabase } from '../lib/supabase';

// Password changes go straight to Supabase Auth using the signed-in session,
// the same service that handles login and the reset link. No separate backend.

export const verifyCurrentPassword = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false };
  return { ok: true };
};

export const sendPasswordOtp = async () => {
  const { error } = await supabase.auth.reauthenticate();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
};

export const changePassword = async ({ password, otp }) => {
  const payload = otp ? { password, nonce: otp } : { password };
  const { error } = await supabase.auth.updateUser(payload);
  if (error) return { ok: false, error: error.message, otpRejected: Boolean(otp) && /nonce|reauth|otp|token/i.test(error.message) };
  return { ok: true };
};
