import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { comparisonRoutes } from './modules/comparison/comparison.routes';
import { curriculaRoutes } from './modules/curricula/curricula.routes';
import { disciplinesRoutes } from './modules/disciplines/disciplines.routes';
import { downloadsRoutes } from './modules/downloads/downloads.routes';
import { filesRoutes } from './modules/files/files.routes';
import { profileRoutes } from './modules/profile/profile.routes';
import { specialitiesRoutes } from './modules/specialities/specialities.routes';
import { usersRoutes } from './modules/users/users.routes';
import { openApiDocument } from './shared/openapi';

const resolveCorsOrigins = () => {
  const configuredOrigins = env.CORS_ORIGIN ?? env.FRONTEND_URL;
  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const createApp = () => {
  const app = express();
  const allowedOrigins = resolveCorsOrigins();
  const allowAnyLocalOrigin = env.NODE_ENV !== 'production' && allowedOrigins.includes('*');

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowAnyLocalOrigin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/api/auth', authRoutes);
  app.use('/api/curricula', curriculaRoutes);
  app.use('/api/specialities', specialitiesRoutes);
  app.use('/api/disciplines', disciplinesRoutes);
  app.use('/api/comparison', comparisonRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/downloads', downloadsRoutes);
  app.use('/api/files', filesRoutes);
  app.use('/api/users', usersRoutes);
  app.use(errorMiddleware);

  return app;
};
