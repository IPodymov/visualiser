import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { facultiesService } from './faculties.service';

export const facultiesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const admissionYear = req.query.admissionYear ? Number(req.query.admissionYear) : undefined;
    res.json(
      await facultiesService.list({
        admissionYear: Number.isInteger(admissionYear) ? admissionYear : undefined,
      }),
    );
  }),
};
