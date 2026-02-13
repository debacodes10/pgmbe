import { StatusCodes } from 'http-status-codes';

export class ApiError extends Error {
  constructor(statusCode = StatusCodes.INTERNAL_SERVER_ERROR, message = 'Internal server error', options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code;
    this.details = options.details;
    this.expose = options.expose ?? statusCode < 500;
  }
}
