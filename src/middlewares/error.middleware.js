import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(
    new ApiError(StatusCodes.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`, {
      code: 'ROUTE_NOT_FOUND'
    })
  );
}

export function errorHandler(err, req, res, _next) {
  const error = err instanceof ApiError ? err : new ApiError();
  const statusCode = error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;

  logger.error(
    {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      code: error.code,
      details: error.details,
      err
    },
    'Request failed'
  );

  const payload = {
    error: {
      message: error.expose ? error.message : 'Internal server error',
      code: error.code ?? 'INTERNAL_ERROR'
    }
  };

  if (error.details && error.expose) {
    payload.error.details = error.details;
  }

  if (env.NODE_ENV !== 'production' && err?.stack) {
    payload.error.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
}
