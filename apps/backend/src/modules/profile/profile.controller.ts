import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { profileService } from './profile.service';

export const profileController = {
  favorites: asyncHandler(async (req: Request, res: Response) => {
    res.json(await profileService.favorites(req.user!.id));
  }),

  addFavorite: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await profileService.addFavorite(req.user!.id, Number(req.params.curriculumId)));
  }),

  removeFavorite: asyncHandler(async (req: Request, res: Response) => {
    res.json(await profileService.removeFavorite(req.user!.id, Number(req.params.curriculumId)));
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    res.json(await profileService.history(req.user!.id));
  }),
};
