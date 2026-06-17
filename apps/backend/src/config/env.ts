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
    .refine((value) => !localhostPattern.test(value), `${name} cannot use localhost in production`);

const productionCommaSeparatedOrigins = z
  .string()
  .optional()
  .refine(
    (value) => !value || value.split(',').every((origin) => !localhostPattern.test(origin.trim())),
    'CORS_ORIGIN cannot use localhost in production',
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
    ? z.string().min(1, 'JWT_SECRET is required in production')
    : z.string().default('development-only-jwt-secret'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  FIT_DIR: z.string().default('../../FIT'),
  FRONTEND_URL: isProduction
    ? productionUrl('FRONTEND_URL')
    : z.string().default('http://localhost:5173'),
  CORS_ORIGIN: isProduction ? productionCommaSeparatedOrigins : z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid backend environment: ${details}`);
}

export const env = parsedEnv.data;

for (const [key, value] of Object.entries(env)) {
  if (value !== undefined && !process.env[key]) {
    process.env[key] = String(value);
  }
}
