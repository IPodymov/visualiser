import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnvironment = { ...process.env };
const controlledKeys = [
  'NODE_ENV',
  'DATABASE_URL',
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_ISSUER',
  'JWT_AUDIENCE',
  'FIT_DIR',
  'FIT_IMPORT_ADMISSION_YEAR',
  'FRONTEND_URL',
  'CORS_ORIGIN',
  'ENABLE_API_DOCS',
];

const setEnvironment = (values: Record<string, string | undefined>) => {
  for (const key of controlledKeys) delete process.env[key];
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) process.env[key] = value;
  }
};

const importEnvironment = async () => {
  vi.resetModules();
  vi.doMock('dotenv', () => ({ default: { config: vi.fn() } }));
  return import('../config/env.js');
};

describe('environment validation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    for (const key of controlledKeys) {
      const value = originalEnvironment[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.doUnmock('dotenv');
  });

  it('provides safe development defaults and publishes them to process.env', async () => {
    setEnvironment({ NODE_ENV: 'development' });

    const { env } = await importEnvironment();

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      FRONTEND_URL: 'http://localhost:5173',
      JWT_ISSUER: 'eduplan-api',
      JWT_AUDIENCE: 'eduplan-web',
      ENABLE_API_DOCS: true,
    });
    expect(process.env.PORT).toBe('4000');
    expect(process.env.ENABLE_API_DOCS).toBe('true');
  });

  it('accepts secure production URLs, strong secrets and wildcard preview subdomains', async () => {
    setEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://service:secret@database.internal:5432/eduplan',
      FRONTEND_URL: 'https://eduplan.example',
      CORS_ORIGIN: 'https://eduplan.example, https://*.vercel.app',
      JWT_SECRET: 'a-secure-production-secret-with-32-characters',
      ENABLE_API_DOCS: 'true',
    });

    const { env } = await importEnvironment();

    expect(env.CORS_ORIGIN).toContain('*.vercel.app');
    expect(env.ENABLE_API_DOCS).toBe(true);
  });

  it('disables API documentation by default in production', async () => {
    setEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://service:secret@database.internal:5432/eduplan',
      FRONTEND_URL: 'https://eduplan.example',
      JWT_SECRET: 'a-secure-production-secret-with-32-characters',
    });

    const { env } = await importEnvironment();
    expect(env.ENABLE_API_DOCS).toBe(false);
    expect(env.CORS_ORIGIN).toBeUndefined();
  });

  it('rejects localhost, plaintext URLs, wildcard-all CORS and weak production secrets', async () => {
    setEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/eduplan',
      FRONTEND_URL: 'http://localhost:5173',
      CORS_ORIGIN: '*',
      JWT_SECRET: 'short',
    });

    await expect(importEnvironment()).rejects.toThrow(/Invalid backend environment:/);
  });

  it('rejects malformed or non-HTTPS production CORS origins', async () => {
    setEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://service:secret@database.internal:5432/eduplan',
      FRONTEND_URL: 'https://eduplan.example',
      CORS_ORIGIN: 'https://valid.example, not a URL',
      JWT_SECRET: 'a-secure-production-secret-with-32-characters',
    });
    await expect(importEnvironment()).rejects.toThrow(/CORS_ORIGIN must contain valid HTTPS origins/);

    setEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://service:secret@database.internal:5432/eduplan',
      FRONTEND_URL: 'https://eduplan.example',
      CORS_ORIGIN: 'https://[',
      JWT_SECRET: 'a-secure-production-secret-with-32-characters',
    });
    await expect(importEnvironment()).rejects.toThrow(/CORS_ORIGIN must contain valid HTTPS origins/);

    setEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://service:secret@database.internal:5432/eduplan',
      FRONTEND_URL: 'https://eduplan.example',
      CORS_ORIGIN: 'https://*',
      JWT_SECRET: 'a-secure-production-secret-with-32-characters',
    });
    await expect(importEnvironment()).rejects.toThrow(/CORS_ORIGIN must contain valid HTTPS origins/);
  });

  it('rejects a non-HTTPS production frontend even when it is not localhost', async () => {
    setEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://service:secret@database.internal:5432/eduplan',
      FRONTEND_URL: 'http://eduplan.example',
      JWT_SECRET: 'a-secure-production-secret-with-32-characters',
    });

    await expect(importEnvironment()).rejects.toThrow(/FRONTEND_URL must use HTTPS in production/);
  });
});
