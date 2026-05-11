import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { filesService } from './files.service';

export const filesController = {
  uploadFitFile: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(filesService.uploaded(req.file));
  }),
};
