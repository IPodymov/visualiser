import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/app-error';

const mutationMethods = new Set(['POST', 'PUT', 'PATCH']);
const supportedRequestTypes = ['application/json', 'multipart/form-data'];

export const requireSupportedContentType = (req: Request, _res: Response, next: NextFunction) => {
  const contentLength = Number(req.headers['content-length'] ?? 0);
  const hasBody = contentLength > 0 || Boolean(req.headers['transfer-encoding']);

  if (
    mutationMethods.has(req.method) &&
    hasBody &&
    !supportedRequestTypes.some((contentType) => req.is(contentType))
  ) {
    return next(new AppError(415, 'Unsupported content type'));
  }

  return next();
};

export const preventCaching = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  return next();
};
