# Deployment

This document describes production build and deployment considerations.

## Build

From the repository root:

```bash
npm install
npm run build
```

Root build runs:

```bash
npm run build:backend
npm run build:frontend
```

## Environment Variables

Common backend variables are defined through `.env`:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Backend port, usually `4000` |
| `CORS_ORIGIN` | Allowed frontend origin |

Frontend:

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | API base URL for production |

In development, Vite proxy can handle `/api` without setting `VITE_API_URL`.

## Run Backend

```bash
npm run start -w apps/backend
```

The backend start script runs compiled output from `dist/main.js`.

## Serve Frontend

Frontend build output is produced under:

```text
apps/frontend/dist
```

Serve it with any static hosting platform. Configure fallback to `index.html` for React Router.

## Docker

The repository includes `docker-compose.yml`, used locally to run PostgreSQL and optional app containers. Root `npm run dev` starts the PostgreSQL service before launching apps.

## Production Recommendations

- Use managed PostgreSQL.
- Run Prisma migrations before app startup.
- Set `CORS_ORIGIN` to the deployed frontend URL.
- Use HTTPS.
- Store secrets in deployment platform secret manager.
- Serve frontend via CDN or static hosting.
- Monitor `/health`.
