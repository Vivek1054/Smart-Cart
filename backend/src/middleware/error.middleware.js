import { AppError } from '../utils/errors.js';
import { describeError, logger } from '../utils/logger.js';

// Every error leaves the API in one shape:
//   { success: false, error: { code, message, details? } }
// Unexpected errors are logged server-side and returned as a generic 500:
// no stack traces, no Supabase/Postgres messages, no secrets.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (err?.type === 'entity.parse.failed') error = new AppError(400, 'INVALID_JSON', 'Request body must be valid JSON');
  else if (err?.type === 'entity.too.large') error = new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  else if (err?.code === 'CORS_NOT_ALLOWED') error = new AppError(403, 'CORS_NOT_ALLOWED', 'Origin not allowed');
  else if (!(err instanceof AppError)) {
    error = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
    error.expose = false;
    error.cause = err;
  }

  if (error.status >= 500) {
    logger.error('request failed', {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      error: describeError(error.cause || error),
    });
  }

  res.status(error.status).json({
    success: false,
    error: {
      code: error.code,
      message: error.expose ? error.message : 'Something went wrong. Please try again.',
      ...(error.details ? { details: error.details } : {}),
    },
  });
};
