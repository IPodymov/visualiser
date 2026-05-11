import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  userId: number;
  email: string;
};

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });

export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as JwtPayload;
