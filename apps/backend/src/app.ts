import cors from 'cors';
import type { CorsOptions } from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { preventCaching, requireSupportedContentType } from './middlewares/security.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { comparisonRoutes } from './modules/comparison/comparison.routes';
import { curriculaRoutes } from './modules/curricula/curricula.routes';
import { disciplinesRoutes } from './modules/disciplines/disciplines.routes';
import { downloadsRoutes } from './modules/downloads/downloads.routes';
import { facultiesRoutes } from './modules/faculties/faculties.routes';
import { filesRoutes } from './modules/files/files.routes';
import { profileRoutes } from './modules/profile/profile.routes';
import { specialitiesRoutes } from './modules/specialities/specialities.routes';
import { usersRoutes } from './modules/users/users.routes';
import { AppError } from './shared/app-error';
import { openApiDocument } from './shared/openapi';

const developmentCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://[::1]:5173',
];

const defaultCorsOrigins = [
  ...(env.NODE_ENV === 'production' ? [] : developmentCorsOrigins),
  'https://visualiser-frontend-7n3std6dr-ipodymovs-projects.vercel.app',
];

const resolveCorsOrigins = () => {
  const configuredOrigins = [env.FRONTEND_URL, env.CORS_ORIGIN, ...defaultCorsOrigins]
    .filter(Boolean)
    .join(',');

  return configuredOrigins
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter((origin) => Boolean(origin) && origin !== '*');
};

const normalizeOrigin = (origin: string) => {
  const trimmed = origin.trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return '';
  }
};

const wildcardOriginPattern = (origin: string) => {
  const escaped = origin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+');
  return new RegExp(`^${escaped}$`);
};

const isOriginAllowed = (origin: string, allowedOrigins: string[]) => {
  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin.includes('*')) return wildcardOriginPattern(allowedOrigin).test(normalizedOrigin);
    return allowedOrigin === normalizedOrigin;
  });
};

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  const allowedOrigins = resolveCorsOrigins();
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  };

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests. Try again later.' },
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts. Try again later.' },
  });
  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many upload attempts. Try again later.' },
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { frameAncestors: ["'none'"] },
      },
      frameguard: { action: 'deny' },
    }),
  );
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(requireSupportedContentType);
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', apiLimiter, preventCaching);
  if (env.ENABLE_API_DOCS) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/curricula', curriculaRoutes);
  app.use('/api/faculties', facultiesRoutes);
  app.use('/api/specialities', specialitiesRoutes);
  app.use('/api/disciplines', disciplinesRoutes);
  app.use('/api/comparison', comparisonRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/downloads', downloadsRoutes);
  app.use('/api/files', uploadLimiter, filesRoutes);
  app.use('/api/users', usersRoutes);
  app.use((_req, _res, next) => next(new AppError(404, 'Not found')));
  app.use(errorMiddleware);

  return app;
};
