import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../shared/validate';
import { favoriteParamsSchema } from './profile.dto';
import { profileController } from './profile.controller';

export const profileRoutes = Router();

profileRoutes.use(authMiddleware);
profileRoutes.get('/favorites', profileController.favorites);
profileRoutes.post('/favorites/:curriculumId', validate(favoriteParamsSchema), profileController.addFavorite);
profileRoutes.delete('/favorites/:curriculumId', validate(favoriteParamsSchema), profileController.removeFavorite);
profileRoutes.get('/history', profileController.history);
