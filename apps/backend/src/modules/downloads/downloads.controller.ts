import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { downloadsService } from './downloads.service';

export const downloadsController = {
  sourceFile: asyncHandler(async (req: Request, res: Response) => {
    const curriculum = await downloadsService.sourceFile(Number(req.params.id), req.user?.id);
    res.download(curriculum.sourceFilePath, curriculum.sourceFileName);
  }),

  disciplineMap: asyncHandler(async (req: Request, res: Response) => {
    res.json(await downloadsService.disciplineMap(Number(req.params.id), req.user?.id));
  }),

  comparison: asyncHandler(async (req: Request, res: Response) => {
    res.json(
      await downloadsService.comparison(
        Number(req.query.firstCurriculumId),
        Number(req.query.secondCurriculumId),
        req.user?.id,
      ),
    );
  }),
};
