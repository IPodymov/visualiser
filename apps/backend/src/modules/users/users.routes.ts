import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../shared/validate';
import { userIdSchema } from './users.dto';
import { usersController } from './users.controller';

export const usersRoutes = Router();

usersRoutes.get('/:id', authMiddleware, validate(userIdSchema), usersController.getById);
