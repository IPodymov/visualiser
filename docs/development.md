# Development

## Setup

```bash
npm install
npm run dev
```

This starts:

- PostgreSQL through Docker Compose;
- backend in watch mode;
- frontend through Vite with hot reload.

## Workspace Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start frontend and backend together |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run build` | Build backend and frontend |
| `npm run lint` | Lint backend and frontend |
| `npm run test` | Run backend tests |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run seed` | Seed database |
| `npm run import:fit` | Import FIT Excel data |

## Hot Reload

| App | Tool |
| --- | --- |
| Frontend | Vite HMR |
| Backend | `tsx watch` |

## Adding Frontend Components

Use colocated folders for large components:

```text
components/NewComponent/
  NewComponent.tsx
  NewComponent.css
```

Keep API calls out of components. Use `services/api`.

## Styling Rules

- Prefer CSS variables from `styles/variables.css`.
- Use component CSS for visual styling.
- Use Tailwind for simple layout utilities.
- Avoid duplicating long `className` strings.

## Backend Conventions

Each feature module should include:

- `*.routes.ts`;
- `*.controller.ts`;
- `*.service.ts`;
- `*.dto.ts` for validation where needed.

## Before Committing

```bash
npm run lint
npm run build
npm run test
```

## Local Data

The `FIT/` folder contains local Excel exports and is ignored by Git. Do not commit source data exports unless intentionally moved to a tracked fixture folder.
