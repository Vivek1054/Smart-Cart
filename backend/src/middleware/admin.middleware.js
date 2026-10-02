import { forbidden, unauthorized } from '../utils/errors.js';

// Must run after requireAuth. req.user.role was read from public.profiles for the
// verified token's user. (The database enforces the same rule through RLS, so a
// bug here could never let a customer write admin data - this is defence in depth
// and gives a clean 403.)
export const requireAdmin = (req, _res, next) => {
  if (!req.user) throw unauthorized();
  if (req.user.role !== 'admin') throw forbidden('Admin access required');
  next();
};
