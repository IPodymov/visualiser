import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';
const localhostPattern = /(^|\/\/)(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i;

if (!isProduction) {
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  dotenv.config({
    path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    override: process.env.NODE_ENV === 'test',
  });
}

const productionUrl = (name: string) =>
  z
    .string()
    .min(1, `${name} is required in production`)
    .refine((value) => !localhostPattern.test(value), `${name} cannot use localhost in production`)
    .refine(
      (value) => name === 'DATABASE_URL' || value.startsWith('https://'),
      `${name} must use HTTPS in production`,
    );

const productionCommaSeparatedOrigins = z
  .string()
  .optional()
  .refine(
    (value) => !value || value.split(',').every((origin) => !localhostPattern.test(origin.trim())),
    'CORS_ORIGIN cannot use localhost in production',
  )
  .refine(
    (value) =>
      !value ||
      value.split(',').every((origin) => {
        const trimmed = origin.trim();
        if (!trimmed.startsWith('https://') || trimmed === 'https://*') return false;
        try {
          const hostname = new URL(trimmed.replace('*.', 'preview.')).hostname;
          return hostname.includes('.') && !hostname.startsWith('.');
        } catch {
          return false;
        }
      }),
    'CORS_ORIGIN must contain valid HTTPS origins',
  );

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: isProduction
    ? productionUrl('DATABASE_URL')
    : z
        .string()
        .default(
          'postgresql://replace-with-db-user:replace-with-db-password@localhost:5432/curricula_visualiser',
        ),
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: isProduction
    ? z.string().min(32, 'JWT_SECRET must contain at least 32 characters in production')
    : z.string().default('development-only-jwt-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_ISSUER: z.string().default('eduplan-api'),
  JWT_AUDIENCE: z.string().default('eduplan-web'),
  FIT_DIR: z.string().default('../../FIT'),
  FIT_IMPORT_ADMISSION_YEAR: z.string().optional(),
  FRONTEND_URL: isProduction
    ? productionUrl('FRONTEND_URL')
    : z.string().default('http://localhost:5173'),
  CORS_ORIGIN: isProduction ? productionCommaSeparatedOrigins : z.string().optional(),
  ENABLE_API_DOCS: z
    .enum(['true', 'false'])
    .default(isProduction ? 'false' : 'true')
    .transform((value) => value === 'true'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid backend environment: ${details}`);
}

export const env = parsedEnv.data;

for (const [key, value] of Object.entries(env)) {
  if (value !== undefined && !process.env[key]) {
    process.env[key] = String(value);
  }
}
