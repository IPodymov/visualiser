import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';

export type JwtPayload = {
  userId: number;
  email: string;
};

const jwtPayloadSchema = z.object({
  userId: z.number().int().positive(),
  email: z.string().email(),
});

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: env.JWT_ISSUER,
  });

export const verifyAccessToken = (token: string) => {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
    audience: env.JWT_AUDIENCE,
    issuer: env.JWT_ISSUER,
  });
  return jwtPayloadSchema.parse(payload);
};
