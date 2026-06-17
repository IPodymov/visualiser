# Deployment

This project is a monorepo with `apps/frontend` and `apps/backend`.

The recommended deployment strategy is:

- deploy the Vite frontend to Vercel;
- deploy the Express/Prisma backend as a separate long-running Node service on Render, Railway, Fly.io, VPS, or similar hosting;
- connect the Vercel frontend to the backend through `VITE_API_BASE_URL`.

## Why Backend Is External

The backend uses Express, Prisma, PostgreSQL, Excel file import, `multer`, `fs/path`, and local FIT source files. It can be adapted to serverless later, but the safest production deployment is a persistent Node runtime with managed PostgreSQL.

## Frontend on Vercel

Use these Vercel Dashboard settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `apps/frontend` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

`apps/frontend/vercel.json` contains the SPA rewrite:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This prevents 404 errors when refreshing nested React Router pages such as `/plans`, `/plans/99`, `/compare`, `/profile`, `/login`, and `/register`.

## Frontend Environment Variables

Set this in Vercel:

| Variable | Example |
| --- | --- |
| `VITE_API_BASE_URL` | `https://your-backend-domain.com` |

The frontend API client appends endpoint paths such as `/api/curricula`, so the value should normally be the backend origin, not a duplicated endpoint path.

Local examples live in:

```text
apps/frontend/.env.example
apps/frontend/.env.local.example
```

For local development you can leave the base URL empty and use Vite proxy, or set:

```env
VITE_API_BASE_URL=http://localhost:4000
```

## Backend Deployment

Deploy `apps/backend` to a Node hosting provider.

### Railway

The repository includes `railway.json` for the backend service. Railway will build the backend with `apps/backend/Dockerfile`, run `npm run prisma:migrate:deploy` before starting the service, and use `/health` as the healthcheck path.

Railway does not provide a post-deploy command in config-as-code. The migration command is configured as `preDeployCommand`, which means it runs after the image is built and before the new backend container is started. If migrations fail, Railway will not promote that deployment.

Required Railway variables:

| Variable | Example |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | Long random secret |
| `JWT_EXPIRES_IN` | `1d` |
| `FRONTEND_URL` | `https://your-vercel-app.vercel.app` |
| `CORS_ORIGIN` | `https://your-vercel-app.vercel.app` |

Do not set a fixed `PORT` in Railway. The backend reads Railway's injected `PORT` automatically.

Required backend environment variables:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random secret |
| `JWT_EXPIRES_IN` | Example: `1d` |
| `PORT` | Provider-defined or `4000` locally |
| `FIT_DIR` | Directory for FIT Excel files, if import is used |
| `FRONTEND_URL` | Vercel frontend URL |
| `CORS_ORIGIN` | Comma-separated allowed origins |

Example production CORS:

```env
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

For preview deployments, add additional origins separated by commas:

```env
CORS_ORIGIN=https://your-vercel-app.vercel.app,https://your-git-branch.vercel.app
```

## Backend Build and Start

```bash
npm install
npm run prisma:generate
npm run build -w apps/backend
npm run start -w apps/backend
```

Run Prisma migrations before start:

```bash
npm run prisma:migrate -w apps/backend
```

## Local Production Check

From repository root:

```bash
npm install
npm run lint
npm run build
npm run preview
```

The root `preview` command serves the Vite frontend preview from `apps/frontend`.

## Verifying a Vercel Deployment

After deploy:

1. Open `/`.
2. Refresh `/plans`.
3. Refresh `/plans/:id`.
4. Refresh `/compare`.
5. Confirm network requests go to `VITE_API_BASE_URL`.
6. Confirm backend CORS allows the Vercel domain.
7. Confirm login/register requests reach backend.

## Typical Issues

| Problem | Fix |
| --- | --- |
| React Router page returns 404 on refresh | Ensure `apps/frontend/vercel.json` is included and Root Directory is `apps/frontend` |
| API calls go to Vercel frontend domain | Set `VITE_API_BASE_URL` in Vercel |
| Browser blocks API with CORS | Add Vercel URL to backend `CORS_ORIGIN` |
| Build cannot find scripts | Check Vercel Root Directory is `apps/frontend` |
| Backend cannot connect to DB | Set `DATABASE_URL` and run Prisma migrations |
| Production uses localhost | Do not set `VITE_API_BASE_URL` to localhost in Vercel |
