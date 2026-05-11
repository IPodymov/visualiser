import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { specialitiesService } from './specialities.service';

export const specialitiesController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await specialitiesService.list());
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await specialitiesService.getById(Number(req.params.id)));
  }),
};
