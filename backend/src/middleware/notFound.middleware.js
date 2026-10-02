import { notFound } from '../utils/errors.js';

export const notFoundHandler = (req, _res, next) => next(notFound(`Route not found: ${req.method} ${req.path}`));
