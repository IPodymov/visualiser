import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', override: true });

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z
    .string()
    .default(
      'postgresql://replace-with-db-user:replace-with-db-password@localhost:5432/curricula_visualiser',
    ),
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().default('development-only-jwt-secret'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  FIT_DIR: z.string().default('../../FIT'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

for (const [key, value] of Object.entries(env)) {
  if (value !== undefined && !process.env[key]) {
    process.env[key] = String(value);
  }
}
