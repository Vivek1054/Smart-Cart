import { anonClient, userClient } from '../config/supabase.js';
import { AppError, forbidden, fromSupabase, unauthorized } from '../utils/errors.js';

// Identity comes ONLY from the verified Supabase access token. Nothing in the
// request body/query (user_id, role, isAdmin, ...) is ever used to decide who the
// caller is or what they may do.
export const requireAuth = async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) throw unauthorized();

  // Ask Supabase Auth to validate the JWT (signature, expiry, revocation).
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data?.user) {
    // Supabase unreachable is a server-side problem, not a bad token.
    if (error?.name === 'AuthRetryableFetchError' || error?.status >= 500) {
      throw new AppError(503, 'AUTH_UNAVAILABLE', 'Authentication service is temporarily unavailable.');
    }
    throw unauthorized('Invalid or expired token');
  }

  // A client acting as this user: RLS + SECURITY DEFINER functions see auth.uid().
  const db = userClient(token);

  // Role and status come from the database (public.profiles), never from the client.
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id, name, email, role, status')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) throw fromSupabase(profileError);
  if (!profile) throw forbidden('No profile exists for this account');
  if (profile.status !== 'Active') {
    throw new AppError(403, 'ACCOUNT_BLOCKED', 'Your account has been blocked. Please contact support.');
  }

  req.user = { id: profile.id, email: profile.email || data.user.email, name: profile.name, role: profile.role };
  req.db = db;
  next();
};
