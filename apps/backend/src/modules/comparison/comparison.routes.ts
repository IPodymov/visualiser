import { Router } from 'express';
import { validate } from '../../shared/validate';
import { comparisonController } from './comparison.controller';
import { comparisonSchema } from './comparison.dto';

export const comparisonRoutes = Router();

comparisonRoutes.get('/', validate(comparisonSchema), comparisonController.compare);
