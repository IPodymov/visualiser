import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { comparisonService } from './comparison.service';

export const comparisonController = {
  compare: asyncHandler(async (req: Request, res: Response) => {
    res.json(
      await comparisonService.compare(
        Number(req.query.firstCurriculumId),
        Number(req.query.secondCurriculumId),
      ),
    );
  }),
};
