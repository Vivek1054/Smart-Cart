// One error type for everything we deliberately return to clients.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = true;
  }
}

export const badRequest = (message = 'Invalid request', details) => new AppError(400, 'BAD_REQUEST', message, details);
export const unauthorized = (message = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'You do not have permission to do that') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Not found') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (message, code = 'CONFLICT') => new AppError(409, code, message);

// Messages raised by our SQL functions ("code" or "code: detail") -> HTTP responses.
const RPC_ERRORS = {
  not_authenticated: [401, 'UNAUTHORIZED', 'Authentication required'],
  account_blocked: [403, 'ACCOUNT_BLOCKED', 'Your account has been blocked. Please contact support.'],
  invalid_payment_method: [400, 'INVALID_PAYMENT_METHOD', 'Please choose a valid payment method.'],
  invalid_shipping: [400, 'INVALID_SHIPPING', 'Please check the delivery details.'],
  empty_cart: [400, 'EMPTY_CART', 'Your cart is empty.'],
  invalid_items: [400, 'INVALID_ITEMS', 'Some cart items are invalid.'],
  product_unavailable: [409, 'PRODUCT_UNAVAILABLE', 'One of the items is no longer available.'],
  order_not_found: [404, 'NOT_FOUND', 'Order not found.'],
  return_not_allowed: [409, 'RETURN_NOT_ALLOWED', 'Returns can only be requested for delivered orders.'],
  return_exists: [409, 'RETURN_EXISTS', 'A return has already been requested for this order.'],
  reason_required: [400, 'BAD_REQUEST', 'A reason is required.'],
  order_cancelled: [409, 'ORDER_CANCELLED', 'A cancelled order cannot be changed.'],
  order_financials_locked: [409, 'ORDER_LOCKED', 'Order amounts cannot be changed.'],
  payment_requires_confirmation: [409, 'PAYMENT_REQUIRES_CONFIRMATION', 'Online payments can only be confirmed by the payment provider.'],
  payment_locked: [409, 'PAYMENT_LOCKED', 'Payment details cannot be changed.'],
  not_allowed: [403, 'FORBIDDEN', 'You do not have permission to do that.'],
};

// True when the failure is "could not talk to Supabase" (network down, DNS, timeout).
export const isNetworkError = (error) =>
  !!error &&
  !error.code &&
  /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|network|timeout|aborted/i.test(String(error.message || ''));

// Translate a Supabase/PostgREST/Postgres error into an AppError (never leaks internals).
// Unknown errors become a 500 that the error middleware logs but does not expose.
export const fromSupabase = (error) => {
  if (!error) return null;
  if (isNetworkError(error)) {
    const e = new AppError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again shortly.');
    e.cause = error;
    return e;
  }
  const message = String(error.message || '');
  const [head, ...rest] = message.split(': ');
  const detail = rest.join(': ');

  if (head === 'insufficient_stock') {
    return conflict(`Not enough stock for "${detail}".`, 'INSUFFICIENT_STOCK');
  }
  if (head === 'coupon_invalid') return new AppError(422, 'COUPON_INVALID', detail || 'This coupon cannot be applied.');
  if (RPC_ERRORS[head]) {
    const [status, code, msg] = RPC_ERRORS[head];
    return new AppError(status, code, msg);
  }

  switch (error.code) {
    case '42501': return forbidden();                                  // RLS / permission denied
    case 'PGRST116': return notFound();                                // .single() matched no row
    case '23505': return conflict('That already exists.', 'ALREADY_EXISTS');
    case '23503': return conflict('That item is referenced by other records.', 'IN_USE');
    case '23514':
    case '22P02':
    case '22003': return badRequest('One of the values is not allowed.');
    default: break;
  }
  const e = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
  e.expose = false;
  e.cause = error;
  return e;
};

// Unwrap a supabase-js result: throw a safe AppError on error, otherwise return data.
export const unwrap = ({ data, error }) => {
  if (error) throw fromSupabase(error);
  return data;
};
