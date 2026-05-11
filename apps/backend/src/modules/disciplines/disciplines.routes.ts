import { Router } from 'express';
import { validate } from '../../shared/validate';
import { disciplineIdSchema } from './disciplines.dto';
import { disciplinesController } from './disciplines.controller';

export const disciplinesRoutes = Router();

disciplinesRoutes.get('/', disciplinesController.list);
disciplinesRoutes.get('/:id', validate(disciplineIdSchema), disciplinesController.getById);
