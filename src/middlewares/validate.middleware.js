import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/api-error.js';
import { deepSanitize } from '../utils/sanitize.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const raw = req[source] ?? {};
    const sanitized = deepSanitize(raw);

    const parsed = schema.safeParse(sanitized);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }));

      return next(
        new ApiError(StatusCodes.BAD_REQUEST, 'Validation failed', {
          code: 'VALIDATION_ERROR',
          details
        })
      );
    }

    req[source] = parsed.data;
    return next();
  };
}
