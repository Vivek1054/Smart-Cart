// Turns Supabase / Postgres errors into messages that are safe to show customers.
// Raw database errors are logged to the console, never rendered.

const CODES = {
  not_authenticated: 'Please log in to continue.',
  account_blocked: 'Your account has been blocked. Please contact support.',
  invalid_payment_method: 'Please choose a valid payment method.',
  invalid_shipping: 'Please check your delivery details and try again.',
  empty_cart: 'Your cart is empty.',
  invalid_items: 'Some items in your cart are invalid. Please review your cart.',
  product_unavailable: 'One of the items in your cart is no longer available.',
  order_not_found: 'We could not find that order.',
  return_not_allowed: 'Returns can only be requested for delivered orders.',
  return_exists: 'A return has already been requested for this order.',
  reason_required: 'Please tell us the reason for the return.',
  order_cancelled: 'A cancelled order cannot be changed.',
  order_financials_locked: 'Order amounts cannot be changed.',
  payment_requires_confirmation: 'Online payments can only be confirmed by the payment provider.',
  payment_locked: 'Payment details cannot be changed.',
  not_allowed: 'You are not allowed to do that.',
};

const AUTH = [
  [/invalid login credentials/i, 'Invalid email or password.'],
  [/email not confirmed/i, 'Please confirm your email address before logging in.'],
  [/user already registered|already been registered/i, 'An account with this email already exists.'],
  [/password should be at least/i, 'Password must be at least 6 characters.'],
  [/rate limit|too many requests|security purposes/i, 'Too many attempts. Please wait a moment and try again.'],
  [/network|failed to fetch/i, 'Network problem. Check your connection and try again.'],
  [/same password|different from the old/i, 'Please choose a password different from your old one.'],
];

export const friendlyError = (err, fallback = 'Something went wrong. Please try again.') => {
  if (!err) return fallback;
  const message = String(err.message || err);

  // Custom exceptions raised by our SQL functions: "code" or "code: detail"
  const [head, ...rest] = message.split(': ');
  const detail = rest.join(': ');
  if (head === 'insufficient_stock') return `Sorry, "${detail}" doesn't have enough stock for your quantity.`;
  if (head === 'coupon_invalid') return detail || 'This coupon cannot be applied.';
  if (CODES[head]) return CODES[head];

  for (const [re, text] of AUTH) if (re.test(message)) return text;

  if (err.code === '42501' || /permission denied|row-level security/i.test(message)) {
    return 'You do not have permission to do that.';
  }
  if (err.code === '23505') return 'That already exists.';
  if (err.code === '23503') return 'That item is still in use and cannot be removed.';
  if (err.code === '23514') return 'One of the values you entered is not allowed.';

  console.error('[supabase]', err);
  return fallback;
};

// Throws a plain Error carrying a friendly message (used by service functions).
export const unwrap = ({ data, error }) => {
  if (error) {
    const e = new Error(friendlyError(error));
    e.cause = error;
    throw e;
  }
  return data;
};
