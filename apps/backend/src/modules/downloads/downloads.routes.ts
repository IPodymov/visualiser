import { Router } from 'express';
import { optionalAuthMiddleware } from '../../middlewares/optional-auth.middleware';
import { validate } from '../../shared/validate';
import { downloadsController } from './downloads.controller';
import { downloadComparisonSchema, downloadCurriculumSchema } from './downloads.dto';

export const downloadsRoutes = Router();

downloadsRoutes.use(optionalAuthMiddleware);
downloadsRoutes.get(
  '/curricula/:id',
  validate(downloadCurriculumSchema),
  downloadsController.sourceFile,
);
downloadsRoutes.get(
  '/curricula/:id/discipline-map',
  validate(downloadCurriculumSchema),
  downloadsController.disciplineMap,
);
downloadsRoutes.get(
  '/comparison',
  validate(downloadComparisonSchema),
  downloadsController.comparison,
);
