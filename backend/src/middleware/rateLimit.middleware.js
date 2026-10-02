import rateLimit from 'express-rate-limit';

const make = ({ windowMs, limit, code = 'RATE_LIMITED' }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        success: false,
        error: { code, message: 'Too many requests. Please slow down and try again shortly.' },
      }),
  });

// Broad safety net for the whole API.
export const globalLimiter = make({ windowMs: 60_000, limit: 300 });
// Coupon codes can be brute-forced, so validation is limited harder.
export const couponLimiter = make({ windowMs: 60_000, limit: 30 });
// Order creation is the most sensitive write.
export const orderLimiter = make({ windowMs: 60_000, limit: 20 });
