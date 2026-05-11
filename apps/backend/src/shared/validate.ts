import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';
import { AppError } from './app-error';

export const validate =
  (schema: AnyZodObject | ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(new AppError(400, 'Validation error', result.error.flatten()));
    }

    Object.assign(req, result.data);
    return next();
  };
