import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { AppError } from '../../shared/app-error';
import { usersService } from './users.service';

export const usersController = {
  getById: asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.id !== Number(req.params.id)) {
      throw new AppError(403, 'Access denied');
    }
    res.json(await usersService.getById(Number(req.params.id)));
  }),
};
