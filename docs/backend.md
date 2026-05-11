# Backend

The backend is an Express + TypeScript API located in `apps/backend`.

## Structure

```text
apps/backend/src/
├── app.ts
├── main.ts
├── config/
├── middlewares/
├── modules/
│   ├── auth/
│   ├── comparison/
│   ├── curricula/
│   ├── disciplines/
│   ├── downloads/
│   ├── files/
│   ├── profile/
│   ├── specialities/
│   └── users/
└── shared/
```

## Express App

`app.ts` registers middleware and routes:

| Route Prefix | Module |
| --- | --- |
| `/health` | Health check |
| `/api/docs` | Swagger UI |
| `/api/auth` | Auth |
| `/api/curricula` | Curriculum catalog/details/import |
| `/api/specialities` | Specialities |
| `/api/disciplines` | Disciplines |
| `/api/comparison` | Curriculum comparison |
| `/api/profile` | Favorites and history |
| `/api/downloads` | Exports/source downloads |
| `/api/files` | FIT file upload |
| `/api/users` | User lookup |

## Database

Prisma models are defined in `apps/backend/prisma/schema.prisma`.

Core entities:

- `User`
- `Speciality`
- `Curriculum`
- `Discipline`
- `CurriculumDiscipline`
- `ClassificationGroup`
- `ClassificationValue`
- `DisciplineClassification`
- `ViewHistory`
- `FavoriteCurriculum`
- `DownloadHistory`

## Curriculum Flow

1. FIT Excel files are imported into normalized relational tables.
2. `CurriculaService.list` returns catalog records.
3. `CurriculaService.getById` returns a visualization DTO grouped by semester.
4. If a request is authenticated, curriculum detail access is recorded in `ViewHistory`.

## Filtering

`GET /api/curricula` accepts:

| Parameter | Type | Description |
| --- | --- | --- |
| `specialityName` | string | Case-insensitive speciality name contains |
| `specialityCode` | string | Case-insensitive code contains |
| `admissionYear` | integer | Exact admission year |

Zod validation rejects malformed query params, so frontend sanitizes empty values and `all`.

## Comparison

`ComparisonService.compare` loads two curricula and their disciplines, normalizes discipline names, then returns:

- common disciplines;
- disciplines only in the first plan;
- disciplines only in the second plan;
- field-level differences for common disciplines.

## Auth

Auth uses password hashing and JWT access tokens. Protected routes use `authMiddleware`; routes that can work with or without auth use `optionalAuthMiddleware`.

## Error Handling

Validation and domain errors use `AppError`. `errorMiddleware` converts thrown errors into JSON responses with HTTP status codes.
