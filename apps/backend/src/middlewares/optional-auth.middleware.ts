import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../shared/jwt';

export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(header.slice('Bearer '.length));
      req.user = { id: payload.userId, email: payload.email };
    } catch {
      req.user = undefined;
    }
  }

  return next();
};
