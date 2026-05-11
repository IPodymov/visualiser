import { describe, expect, it } from 'vitest';
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
});
