import { StatusCodes } from 'http-status-codes';
import { auth } from '../config/firebase.js';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../config/logger.js';

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Missing or invalid Authorization header', {
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Missing Firebase ID token', {
        code: 'UNAUTHORIZED'
      });
    }

    const decoded = await auth.verifyIdToken(token, true);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      logger.warn({ error }, 'Expired Firebase ID token');
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token expired. Please sign in again.', { code: 'TOKEN_EXPIRED' }));
    }

    if (
      error.code === 'auth/argument-error' ||
      error.code === 'auth/invalid-id-token' ||
      error.code === 'auth/id-token-revoked'
    ) {
      logger.warn({ error }, 'Invalid Firebase ID token');
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid authentication token', { code: 'INVALID_TOKEN' }));
    }

    if (error instanceof ApiError) {
      logger.warn({ error }, 'Authentication failure');
      return next(error);
    }

    return next(error);
  }
}
