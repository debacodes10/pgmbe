import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'pgm-backend' },
  redact: {
    paths: ['req.headers.authorization', 'authorization', 'token'],
    remove: true
  }
});
