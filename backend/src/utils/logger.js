import { config } from '../config/env.js';

// Minimal structured logger. Secrets are never logged: only whitelisted request
// fields are written, and error objects are reduced to name/message/code.
const write = (level, message, fields = {}) => {
  if (config.NODE_ENV === 'test' && level !== 'error') return;
  const line = { time: new Date().toISOString(), level, message, ...fields };
  (level === 'error' ? console.error : console.log)(JSON.stringify(line));
};

export const logger = {
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields),
};

export const describeError = (err) => ({
  name: err?.name,
  message: err?.message,
  code: err?.code,
  cause: err?.cause ? { code: err.cause.code, message: err.cause.message } : undefined,
});
