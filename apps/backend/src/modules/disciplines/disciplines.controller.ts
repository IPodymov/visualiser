import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { disciplinesService } from './disciplines.service';

export const disciplinesController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await disciplinesService.list());
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await disciplinesService.getById(Number(req.params.id)));
  }),
};
