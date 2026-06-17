import cors from 'cors';
import type { CorsOptions } from 'cors';
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

const defaultCorsOrigins = [
  'http://localhost:5173',
  'https://visualiser-frontend-7n3std6dr-ipodymovs-projects.vercel.app',
];

const resolveCorsOrigins = () => {
  const configuredOrigins = [env.FRONTEND_URL, env.CORS_ORIGIN, ...defaultCorsOrigins]
    .filter(Boolean)
    .join(',');

  return configuredOrigins
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
};

const normalizeOrigin = (origin: string) => {
  const trimmed = origin.trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return trimmed;
  }
};

const wildcardOriginPattern = (origin: string) => {
  const escaped = origin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+');
  return new RegExp(`^${escaped}$`);
};

const isOriginAllowed = (origin: string, allowedOrigins: string[]) => {
  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === '*') return true;
    if (allowedOrigin.includes('*')) return wildcardOriginPattern(allowedOrigin).test(normalizedOrigin);
    return allowedOrigin === normalizedOrigin;
  });
};

export const createApp = () => {
  const app = express();
  const allowedOrigins = resolveCorsOrigins();
  const allowAnyOrigin = allowedOrigins.includes('*');
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowAnyOrigin || isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  };

  app.use(helmet());
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
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
