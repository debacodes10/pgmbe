import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    LOG_LEVEL: z.string().default('info'),

    FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),

    GITHUB_TOKEN: z.string().optional(),
    GITHUB_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),

    CORS_ORIGIN: z.string().default('*'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),

    STAGNATION_DAYS_THRESHOLD: z.coerce.number().int().positive().default(30),
    STAGNATION_CRON: z.string().default('0 2 * * *')
  })
  .transform((data) => ({
    ...data,
    CORS_ORIGIN_LIST:
      data.CORS_ORIGIN === '*'
        ? ['*']
        : data.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment variables: ${issues}`);
}

export const env = parsed.data;
