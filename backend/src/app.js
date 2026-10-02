import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { anonClient } from './config/supabase.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { logger } from './utils/logger.js';
import { isNetworkError } from './utils/errors.js';

const SERVICE = 'SmartCart API';

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  // Render (and most hosts) sit behind one proxy: needed for correct client IPs / rate limiting.
  app.set('trust proxy', 1);

  // This is a JSON API used cross-origin by the SPA (CORS decides who may call it).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      // Only the configured frontend origin(s). Requests without an Origin header
      // (curl, uptime monitors, server-to-server) are not browser CORS requests and pass.
      origin(origin, callback) {
        if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
        const err = new Error('Origin not allowed');
        err.code = 'CORS_NOT_ALLOWED';
        return callback(err);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
      maxAge: 600,
    })
  );
  app.use(express.json({ limit: '100kb' }));

  // One log line per request: method, path (no query string), status, duration.
  // Headers and bodies (tokens, passwords) are never logged.
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      logger.info('request', { method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - started });
    });
    next();
  });

  // ---- health (no auth, no database: cheap enough for a 1-minute uptime monitor)
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: SERVICE }));

  // ---- readiness: also proves the database is reachable and the schema is applied
  app.get('/api/ready', async (_req, res) => {
    try {
      const { error } = await anonClient.from('site_settings').select('key').limit(1);
      if (error) {
        logger.warn('readiness check failed', { code: error.code, message: error.code ? undefined : error.message });
        const database = isNetworkError(error) ? 'unreachable' : 'error';
        return res.status(503).json({ status: 'unavailable', service: SERVICE, database });
      }
      return res.json({ status: 'ok', service: SERVICE, database: 'connected' });
    } catch (err) {
      logger.warn('readiness check failed', { message: err.message });
      return res.status(503).json({ status: 'unavailable', service: SERVICE, database: 'unreachable' });
    }
  });

  app.use('/api/v1', globalLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
