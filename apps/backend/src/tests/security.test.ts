import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '../app';
import { env } from '../config/env';
import { authService } from '../modules/auth/auth.service';
import { facultiesService } from '../modules/faculties/faculties.service';
import { filesService } from '../modules/files/files.service';
import { usersService } from '../modules/users/users.service';
import { AppError } from '../shared/app-error';
import { signAccessToken } from '../shared/jwt';

const user = {
  id: 1,
  email: 'student@example.com',
  fullName: 'Анна Смирнова',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};

const token = () => signAccessToken({ userId: user.id, email: user.email });

describe('web application security controls', () => {
  let uploadDirectory: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    uploadDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplan-security-uploads-'));
    vi.spyOn(filesService, 'fitUploadDirectory').mockReturnValue(uploadDirectory);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(uploadDirectory, { recursive: true, force: true });
  });

  it('sets browser security headers and removes framework disclosure', async () => {
    const response = await request(createApp()).get('/health').expect(200);

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['strict-transport-security']).toContain('max-age=');
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('marks API responses as non-cacheable', async () => {
    const response = await request(createApp()).get('/api/curricula/not-a-number').expect(400);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers.pragma).toBe('no-cache');
  });

  it('allows configured CORS origins and withholds CORS from untrusted origins', async () => {
    const allowed = await request(createApp())
      .get('/health')
      .set('Origin', 'http://localhost:5173')
      .expect(200);
    const loopback = await request(createApp())
      .get('/health')
      .set('Origin', 'http://127.0.0.1:5173')
      .expect(200);
    const ipv6Loopback = await request(createApp())
      .get('/health')
      .set('Origin', 'http://[::1]:5173')
      .expect(200);
    const denied = await request(createApp())
      .get('/health')
      .set('Origin', 'https://evil.example')
      .expect(200);

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(loopback.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
    expect(ipv6Loopback.headers['access-control-allow-origin']).toBe('http://[::1]:5173');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('keeps development loopback origins out of production defaults', async () => {
    vi.resetModules();
    vi.doMock('../config/env', () => ({
      env: {
        ...env,
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://eduplan.example',
        CORS_ORIGIN: undefined,
        ENABLE_API_DOCS: false,
      },
    }));

    try {
      const { createApp: createProductionApp } = await import('../app');
      const response = await request(createProductionApp())
        .get('/health')
        .set('Origin', 'http://127.0.0.1:5173')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      vi.doUnmock('../config/env');
      vi.resetModules();
    }
  });

  it('supports bounded HTTPS preview subdomains and ignores malformed configured origins', async () => {
    const previousCorsOrigin = env.CORS_ORIGIN;
    Object.assign(env, { CORS_ORIGIN: 'https://*.preview.example, not a URL, *, , ' });
    try {
      const app = createApp();
      const preview = await request(app)
        .get('/health')
        .set('Origin', 'https://branch.preview.example')
        .expect(200);
      const nested = await request(app)
        .get('/health')
        .set('Origin', 'https://nested.branch.preview.example')
        .expect(200);

      expect(preview.headers['access-control-allow-origin']).toBe(
        'https://branch.preview.example',
      );
      expect(nested.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      Object.assign(env, { CORS_ORIGIN: previousCorsOrigin });
    }
  });

  it('keeps API documentation disabled when configured for production-like operation', async () => {
    const previous = env.ENABLE_API_DOCS;
    Object.assign(env, { ENABLE_API_DOCS: false });
    try {
      await request(createApp()).get('/api/docs').expect(404, { message: 'Not found' });
    } finally {
      Object.assign(env, { ENABLE_API_DOCS: previous });
    }
  });

  it('rejects unsupported content types, malformed JSON and oversized JSON', async () => {
    await request(createApp())
      .post('/api/auth/login')
      .set('Content-Type', 'text/plain')
      .send('email=attacker@example.com')
      .expect(415, { message: 'Unsupported content type' });

    await request(createApp())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400, { message: 'Malformed JSON' });

    const oversized = JSON.stringify({ value: 'a'.repeat(2 * 1024 * 1024) });
    await request(createApp())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(oversized)
      .expect(413, { message: 'Request body is too large' });
  });

  it('rejects injection-shaped identifiers before data access', async () => {
    const getById = vi.spyOn(usersService, 'getById');

    await request(createApp())
      .get('/api/users/1%20OR%201=1')
      .set('Authorization', `Bearer ${token()}`)
      .expect(400);
    await request(createApp())
      .get('/api/comparison?firstCurriculumId=1%20OR%201=1&secondCurriculumId=2')
      .expect(400);

    expect(getById).not.toHaveBeenCalled();
  });

  it('requires a valid, bounded bearer token for protected routes', async () => {
    const app = createApp();
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set('Authorization', 'Basic abc').expect(401);
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid').expect(401);
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${'a'.repeat(4097)}`)
      .expect(401);
  });

  it('prevents authenticated users from reading another user object', async () => {
    const getById = vi.spyOn(usersService, 'getById').mockResolvedValue(user);
    const app = createApp();

    await request(app)
      .get('/api/users/2')
      .set('Authorization', `Bearer ${token()}`)
      .expect(403, { message: 'Access denied' });
    const ownResponse = await request(app)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${token()}`)
      .expect(200);

    expect(ownResponse.body).not.toHaveProperty('passwordHash');
    expect(getById).toHaveBeenCalledOnce();
  });

  it('rejects mass assignment and weak or excessive passwords', async () => {
    const register = vi.spyOn(authService, 'register');
    const base = { fullName: 'Student', email: 'student@example.com' };

    await request(createApp())
      .post('/api/auth/register')
      .send({ ...base, password: 'short' })
      .expect(400);
    await request(createApp())
      .post('/api/auth/register')
      .send({ ...base, password: 'a'.repeat(129) })
      .expect(400);
    await request(createApp())
      .post('/api/auth/register')
      .send({ ...base, password: 'long-enough-password', role: 'admin' })
      .expect(400);

    expect(register).not.toHaveBeenCalled();
  });

  it('normalizes authentication identifiers before service calls', async () => {
    const register = vi.spyOn(authService, 'register').mockResolvedValue({
      user,
      accessToken: token(),
    });

    await request(createApp())
      .post('/api/auth/register')
      .send({
        fullName: '  Анна Смирнова  ',
        email: '  STUDENT@EXAMPLE.COM  ',
        password: 'long-enough-password',
      })
      .expect(201);

    expect(register).toHaveBeenCalledWith({
      fullName: 'Анна Смирнова',
      email: 'student@example.com',
      password: 'long-enough-password',
    });
  });

  it('throttles repeated authentication attempts', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(new AppError(401, 'Invalid email or password'));
    const app = createApp();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid@example.com', password: 'x' })
        .expect(401);
    }

    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid@example.com', password: 'x' })
      .expect(429);

    expect(blocked.body.message).toContain('Too many authentication attempts');
    expect(blocked.headers['ratelimit-policy']).toBeDefined();
  });

  it('requires authentication for state-changing endpoints even with a trusted Origin', async () => {
    await request(createApp())
      .post('/api/profile/favorites/1')
      .set('Origin', 'http://localhost:5173')
      .expect(401);
    await request(createApp()).post('/api/curricula/import-fit').expect(401);
    await request(createApp()).post('/api/files/fit').expect(401);
  });

  it('rejects disguised and path-traversal upload names without retaining the file', async () => {
    const before = fs.existsSync(uploadDirectory) ? new Set(fs.readdirSync(uploadDirectory)) : new Set();

    await request(createApp())
      .post('/api/files/fit')
      .set('Authorization', `Bearer ${token()}`)
      .attach('file', Buffer.from('MZ-not-an-xlsx'), {
        filename: '../../malicious.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      .expect(400, { message: 'The uploaded file is not a valid XLSX workbook' });

    const after = fs.existsSync(uploadDirectory) ? new Set(fs.readdirSync(uploadDirectory)) : new Set();
    expect(after).toEqual(before);
    expect(fs.existsSync(path.resolve(uploadDirectory, '..', 'malicious.xlsx'))).toBe(false);
  });

  it('rejects files above the upload quota', async () => {
    await request(createApp())
      .post('/api/files/fit')
      .set('Authorization', `Bearer ${token()}`)
      .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), {
        filename: 'large.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      .expect(413, { message: 'Uploaded file is too large' });
  });

  it('maps non-size multipart quota failures to a generic upload error', async () => {
    await request(createApp())
      .post('/api/files/fit')
      .set('Authorization', `Bearer ${token()}`)
      .field('unexpected', 'value')
      .attach('file', Buffer.from('first'), {
        filename: 'first.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      .expect(400, { message: 'Invalid upload' });
  });

  it('returns generic JSON errors without stack traces or reflected paths', async () => {
    vi.spyOn(facultiesService, 'list')
      .mockImplementationOnce(() => z.string().parse(1) as never)
      .mockImplementation(() => {
        throw new Error('database password=secret');
      });

    const validation = await request(createApp()).get('/api/faculties').expect(400);
    const failed = await request(createApp()).get('/api/faculties').expect(500);
    const missing = await request(createApp()).get('/api/<script>alert(1)</script>').expect(404);

    expect(validation.body.message).toBe('Validation error');
    expect(failed.body).toEqual({ message: 'Internal server error' });
    expect(JSON.stringify(failed.body)).not.toContain('secret');
    expect(failed.body).not.toHaveProperty('stack');
    expect(missing.body).toEqual({ message: 'Not found' });
  });
});
