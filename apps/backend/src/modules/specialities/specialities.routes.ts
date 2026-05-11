import { Router } from 'express';
import { validate } from '../../shared/validate';
import { specialitiesController } from './specialities.controller';
import { specialityIdSchema } from './specialities.dto';

export const specialitiesRoutes = Router();

specialitiesRoutes.get('/', specialitiesController.list);
specialitiesRoutes.get('/:id', validate(specialityIdSchema), specialitiesController.getById);
