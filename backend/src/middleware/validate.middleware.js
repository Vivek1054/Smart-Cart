import { AppError } from '../utils/errors.js';

// validate({ params, query, body }) parses each part with its Zod schema and
// stores the cleaned values in req.valid.{params,query,body}. Handlers must read
// from req.valid, never from the raw req.body/req.query.
export const validate = (schemas) => (req, _res, next) => {
  const valid = {};
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      throw new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', details);
    }
    valid[part] = result.data;
  }
  req.valid = valid;
  next();
};
