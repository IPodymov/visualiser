import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/app-error';
import { verifyAccessToken } from '../shared/jwt';

export type AuthUser = {
  id: number;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authorization token is required'));
  }

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = {
      id: payload.userId,
      email: payload.email,
    };
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }
};
