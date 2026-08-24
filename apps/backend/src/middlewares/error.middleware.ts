import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../shared/app-error';

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof multer.MulterError) {
    const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(statusCode).json({
      message: error.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large' : 'Invalid upload',
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.flatten(),
    });
  }

  const httpError = error as Error & { status?: number; type?: string };
  if (httpError.status === 413 || httpError.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'Malformed JSON' });
  }

  return res.status(500).json({
    message: 'Internal server error',
  });
};
