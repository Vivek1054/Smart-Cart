import { supabase } from '../lib/supabase';

// Client for the SmartCart Express API (backend/). Auth is still Supabase Auth:
// the current session's access token is sent as `Authorization: Bearer <token>`
// and the backend verifies it. supabase-js keeps/refreshes the session for us, so
// no token is stored anywhere by this file.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const FRIENDLY = {
  NOT_CONFIGURED: 'The server is not configured. Please try again later.',
  NETWORK: 'We could not reach the server. Please check your connection and try again.',
  RATE_LIMITED: 'Too many requests. Please slow down and try again in a moment.',
};

const authHeader = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Please log in to continue.');
  return { Authorization: `Bearer ${token}` };
};

// Returns { data, meta }. Throws ApiError with a message that is safe to show users.
const request = async (path, { method = 'GET', body, auth = true } = {}) => {
  if (!BASE) throw new ApiError(0, 'NOT_CONFIGURED', FRIENDLY.NOT_CONFIGURED);

  const headers = { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) };
  if (auth) Object.assign(headers, await authHeader());

  let res;
  try {
    res = await fetch(`${BASE}/api/v1${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'NETWORK', FRIENDLY.NETWORK);
  }

  let json = null;
  try { json = await res.json(); } catch { /* non-JSON response */ }

  if (!res.ok || !json?.success) {
    const err = json?.error;
    const message = FRIENDLY[err?.code] || err?.message || 'Something went wrong. Please try again.';
    throw new ApiError(res.status, err?.code || 'ERROR', message, err?.details);
  }
  return { data: json.data, meta: json.meta };
};

export const api = {
  get: async (path, opts) => (await request(path, { ...opts })).data,
  post: async (path, body, opts) => (await request(path, { ...opts, method: 'POST', body })).data,
  patch: async (path, body, opts) => (await request(path, { ...opts, method: 'PATCH', body })).data,
  delete: async (path, opts) => (await request(path, { ...opts, method: 'DELETE' })).data,
  getPage: (path, opts) => request(path, { ...opts }),
};

export const API_URL = BASE;
