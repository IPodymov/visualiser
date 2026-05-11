import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { authService } from './auth.service';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await authService.register(req.body));
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    res.json(await authService.login(req.body));
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    res.json(await authService.me(req.user!.id));
  }),
};
