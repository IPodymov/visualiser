import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { curriculaService } from './curricula.service';

export const curriculaController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await curriculaService.list(req.query));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await curriculaService.getById(Number(req.params.id), req.user?.id));
  }),

  getDisciplines: asyncHandler(async (req: Request, res: Response) => {
    res.json(await curriculaService.getDisciplines(Number(req.params.id)));
  }),

  recommend: asyncHandler(async (req: Request, res: Response) => {
    res.json(await curriculaService.recommend(req.body));
  }),

  validate: asyncHandler(async (req: Request, res: Response) => {
    res.json(await curriculaService.validate(Number(req.params.id)));
  }),

  importFit: asyncHandler(async (_req: Request, res: Response) => {
    res.status(201).json(await curriculaService.importFit());
  }),
};
