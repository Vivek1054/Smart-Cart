import 'dotenv/config';
import { z } from 'zod';

// All configuration comes from environment variables (Render dashboard in
// production, backend/.env locally). Nothing secret is hardcoded.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Render injects PORT; 5000 is only the local default.
  PORT: z.coerce.number().int().positive().default(5000),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a URL'),
  // Public "publishable/anon" key. Requests are made with the caller's own JWT on top of it,
  // so Row Level Security keeps protecting every query.
  SUPABASE_ANON_KEY: z.string().min(20, 'SUPABASE_ANON_KEY is required'),
  // Backend-only. Bypasses RLS. Optional: nothing needs it yet (reserved for the Razorpay webhook).
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional().or(z.literal('').transform(() => undefined)),
  // Comma-separated list of allowed browser origins (your Vercel domain(s) in production).
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // Names only - never print values.
  console.error(`Invalid environment configuration:\n${problems}\nSee backend/.env.example`);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  ...env,
  isProduction: env.NODE_ENV === 'production',
  allowedOrigins: env.FRONTEND_URL.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean),
};
