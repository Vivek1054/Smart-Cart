import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Never let a slow/unreachable Supabase hang a request forever (e.g. project waking up).
const TIMEOUT_MS = 15_000;
const fetchWithTimeout = (input, init = {}) => {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: fetchWithTimeout },
};

// Anonymous client: public reads (catalog) and token verification. RLS applies as role "anon".
export const anonClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, options);

// A client that acts AS the signed-in user: same anon key, plus the user's JWT.
// Postgres sees auth.uid() = that user, so RLS and the SECURITY DEFINER functions
// (place_order, request_return, ...) enforce ownership and roles exactly as they
// do for the browser. This is the default for every authenticated route.
export const userClient = (accessToken) =>
  createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    ...options,
    global: { ...options.global, headers: { Authorization: `Bearer ${accessToken}` } },
  });

// Privileged client (bypasses RLS). Deliberately NOT used by any current route.
// It exists for the Razorpay stage, where the payment webhook has no user session
// and must mark a card/UPI payment as Paid. Created lazily so the key is optional.
let adminClient;
export const serviceClient = () => {
  if (!config.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  adminClient ??= createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, options);
  return adminClient;
};
