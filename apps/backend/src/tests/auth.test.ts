import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { env } from '../config/env';
import { signAccessToken, verifyAccessToken } from '../shared/jwt';
import { hashPassword, verifyPassword } from '../shared/password';

describe('auth helpers', () => {
  it('hashes and verifies password', async () => {
    const hash = await hashPassword('secret123');

    expect(hash).not.toBe('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('signs and verifies access token', () => {
    const token = signAccessToken({ userId: 1, email: 'student@example.com' });
    const payload = verifyAccessToken(token);

    expect(payload.userId).toBe(1);
    expect(payload.email).toBe('student@example.com');
  });

  it('rejects tokens with invalid algorithms, claims, issuer or audience', () => {
    const wrongAlgorithm = jwt.sign(
      { userId: 1, email: 'student@example.com' },
      env.JWT_SECRET,
      { algorithm: 'HS512', audience: env.JWT_AUDIENCE, issuer: env.JWT_ISSUER },
    );
    const invalidClaims = jwt.sign(
      { userId: 0, email: 'not-an-email' },
      env.JWT_SECRET,
      { algorithm: 'HS256', audience: env.JWT_AUDIENCE, issuer: env.JWT_ISSUER },
    );
    const wrongIssuer = jwt.sign(
      { userId: 1, email: 'student@example.com' },
      env.JWT_SECRET,
      { algorithm: 'HS256', audience: env.JWT_AUDIENCE, issuer: 'attacker' },
    );
    const wrongAudience = jwt.sign(
      { userId: 1, email: 'student@example.com' },
      env.JWT_SECRET,
      { algorithm: 'HS256', audience: 'other-app', issuer: env.JWT_ISSUER },
    );

    expect(() => verifyAccessToken(wrongAlgorithm)).toThrow();
    expect(() => verifyAccessToken(invalidClaims)).toThrow();
    expect(() => verifyAccessToken(wrongIssuer)).toThrow();
    expect(() => verifyAccessToken(wrongAudience)).toThrow();
  });
});
