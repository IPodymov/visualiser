import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { optionalAuthMiddleware } from '../../middlewares/optional-auth.middleware';
import { validate } from '../../shared/validate';
import { curriculaController } from './curricula.controller';
import { curriculumIdSchema, listCurriculaSchema } from './curricula.dto';

export const curriculaRoutes = Router();

curriculaRoutes.get('/', validate(listCurriculaSchema), curriculaController.list);
curriculaRoutes.get('/:id', optionalAuthMiddleware, validate(curriculumIdSchema), curriculaController.getById);
curriculaRoutes.get(
  '/:id/disciplines',
  validate(curriculumIdSchema),
  curriculaController.getDisciplines,
);
curriculaRoutes.get('/:id/validation', validate(curriculumIdSchema), curriculaController.validate);
curriculaRoutes.post('/import-fit', authMiddleware, curriculaController.importFit);
