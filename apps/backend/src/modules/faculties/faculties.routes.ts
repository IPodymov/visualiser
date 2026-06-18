import { Router } from 'express';
import { facultiesController } from './faculties.controller';

export const facultiesRoutes = Router();

facultiesRoutes.get('/', facultiesController.list);
