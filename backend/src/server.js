import { config } from './config/env.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

const app = createApp();

// Render provides PORT and requires binding to 0.0.0.0.
const server = app.listen(config.PORT, '0.0.0.0', () => {
  logger.info('SmartCart API listening', { port: config.PORT, env: config.NODE_ENV, origins: config.allowedOrigins });
});

const shutdown = (signal) => {
  logger.info('shutting down', { signal });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error('unhandledRejection', { message: String(reason?.message || reason) }));
