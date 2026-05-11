import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { usersService } from './users.service';

export const usersController = {
  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await usersService.getById(Number(req.params.id)));
  }),
};
