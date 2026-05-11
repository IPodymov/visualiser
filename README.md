# Curricula Visualiser Backend

Backend for the diploma project "Visualization and comparison of curricula".

## Stack

- Node.js, Express, TypeScript
- PostgreSQL, Prisma ORM
- JWT auth, bcrypt
- multer for `.xlsx` uploads
- xlsx for FIT curricula import
- zod validation
- Swagger/OpenAPI
- eslint, prettier, vitest

## Structure

```text
apps/
  backend/
    src/
      modules/
        auth/
        users/
        curricula/
        disciplines/
        specialities/
        comparison/
        files/
        profile/
        downloads/
      config/
      middlewares/
      shared/
      main.ts
    prisma/
packages/
  shared/
FIT/
  *.xlsx
```

## Quick Start

```bash
cp .env.example .env
```

Set real local values in `.env` before starting Docker or running Prisma commands. Keep `.env` private; it is ignored by git.

```bash
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run import:fit
npm run dev
```

API: `http://localhost:4000/api`

Swagger: `http://localhost:4000/api/docs`

Healthcheck: `http://localhost:4000/health`

Frontend dev server: `http://localhost:5173`

## Development Mode

Run frontend and backend together from the monorepo root:

```bash
npm run dev
```

This command keeps PostgreSQL in Docker, stops production-like backend/frontend containers if they are running, and starts:

- backend on `http://localhost:4000` with `tsx watch`
- frontend on `http://localhost:5173` with Vite HMR

Before starting, the command frees local dev ports `4000` and `5173`, so stale Node/Vite processes from previous runs do not block startup.

Backend TypeScript changes restart the API automatically. Frontend React/CSS changes update in the browser without manual restart.

Useful separate commands:

```bash
npm run dev:db
npm run dev:backend
npm run dev:frontend
```

## Docker

`docker-compose.yml` contains PostgreSQL, backend and frontend services. PostgreSQL has a healthcheck; backend waits for it, applies migrations, runs seed, and then starts the API.

```bash
docker compose up --build
```

The backend container mounts the root `FIT/` directory as read-only, so import uses the same Excel files as local development.

All sensitive Docker values are read from `.env`. You can start from:

```bash
cp .env.docker.example .env
```

Then replace `POSTGRES_PASSWORD`, `DOCKER_DATABASE_URL`, and `JWT_SECRET` with real local values.

Docker frontend: `http://localhost:8080`

## Frontend

The React/Vite frontend template lives in `apps/frontend`. It includes a promo home page and working panels for:

- curriculum search and filtering
- curriculum validation report
- semester/discipline preview
- two-curriculum comparison
- links to Swagger and download-ready backend endpoints

```bash
npm run dev:frontend
npm run build:frontend
```

## FIT Import

Put Excel curricula files into the root `FIT/` directory and run:

```bash
npm run import:fit
```

The importer recursively scans `.xlsx` files, calculates `sourceFileHash`, skips already imported files, parses curriculum metadata and discipline rows, then stores them in PostgreSQL.

During import each curriculum is validated. Files with critical validation errors are not saved; warnings are returned in the import report.

You can also trigger import through the protected endpoint:

```http
POST /api/curricula/import-fit
Authorization: Bearer <token>
```

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/curricula`
- `GET /api/curricula/:id`
- `GET /api/curricula/:id/disciplines`
- `GET /api/curricula/:id/validation`
- `POST /api/curricula/import-fit`
- `GET /api/specialities`
- `GET /api/specialities/:id`
- `GET /api/comparison?firstCurriculumId=1&secondCurriculumId=2`
- `GET /api/profile/favorites`
- `POST /api/profile/favorites/:curriculumId`
- `DELETE /api/profile/favorites/:curriculumId`
- `GET /api/profile/history`
- `GET /api/downloads/curricula/:id`
- `GET /api/downloads/curricula/:id/discipline-map`
- `GET /api/downloads/comparison?firstCurriculumId=1&secondCurriculumId=2`

## Tests and Quality

```bash
npm run lint
npm run test
npm run build
```

## Database Normalization

The schema separates users, specialities, curricula, canonical disciplines, curriculum-specific discipline facts, classification dictionaries, many-to-many discipline classifications, favorites, view history, and download history. This keeps reference data and transactional/user data separate and satisfies 3NF for the requested domain model.
