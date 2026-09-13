# Развёртывание

Рекомендуемая схема:

```text
Browser ──HTTPS──► Vercel (Vite SPA)
                       │
                       └──HTTPS──► Railway (Express API) ──► Railway PostgreSQL
```

Frontend и backend разворачиваются отдельно. Production frontend не использует Vite proxy и обязан знать публичный API URL.

## Frontend на Vercel

| Setting          | Value           |
| ---------------- | --------------- |
| Root Directory   | `apps/frontend` |
| Framework Preset | Vite            |
| Install Command  | `npm install`   |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |

Обязательная переменная:

```env
VITE_API_BASE_URL=https://your-api.up.railway.app
```

`vite.config.ts` завершает Vercel build с ошибкой, если переменная отсутствует. `vercel.json` перенаправляет client-side routes на `index.html`.

После изменения `VITE_API_BASE_URL` нужен новый build: Vite встраивает значение в bundle.

## Frontend на Railway

Production frontend: `https://visualiser-frontend-production.up.railway.app`.
Сервис `visualiser-frontend` находится в проекте `visualiser`, environment `production`.
Сборка загружается из корня монорепозитория через `railway up --service visualiser-frontend --environment production`.

Настройки сервиса: Dockerfile `apps/frontend/Dockerfile`, healthcheck `/`, публичный порт `80`.
Переменные: `RAILWAY_DOCKERFILE_PATH=apps/frontend/Dockerfile`, `PORT=80`,
`VITE_API_BASE_URL=https://visualiser-backend.up.railway.app`.
Конфигурация frontend задаётся в Railway; корневой `railway.json` относится к backend.
Nginx возвращает `index.html` для клиентских маршрутов, включая `/plans`.
После изменения API URL требуется повторная сборка. В backend `FRONTEND_URL` указывает
на Railway frontend, а `CORS_ORIGIN` сохраняет также `https://eplans.vercel.app`.

## Backend и PostgreSQL на Railway

Backend собирается из корня репозитория по `railway.json`/`apps/backend/Dockerfile`. Подключите PostgreSQL service и настройте:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<случайная строка длиной не менее 32 символов>
JWT_EXPIRES_IN=1d
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app,https://*.your-preview-domain.vercel.app
PORT=4000
ENABLE_API_DOCS=false
FIT_DIR=/app/FIT
FIT_IMPORT_ADMISSION_YEAR=2025
```

Origins разделяются запятыми без path. В production разрешены только валидные HTTPS origins; `*` и localhost отклоняются. Wildcard допускается только в позиции одного поддомена.

Перед запуском новой версии примените:

```bash
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
```

Не запускайте seed при каждом production restart, если он перестал быть строго идемпотентным.

## FIT-файлы в production

Текущий backend Docker image копирует каталог `FIT`, а Docker Compose монтирует его read-only. Railway filesystem не следует считать постоянным хранилищем пользовательских uploads. Для production-процесса выберите один контролируемый вариант:

- включать утверждённые workbooks в release image;
- импортировать их одноразовой release job;
- перенести uploads в object storage и добавить управляемый import job.

Не запускайте каталоговый импорт конкурентно в нескольких replicas. SHA-256 предотвращает дубли файлов, но операционный процесс должен оставаться одиночным и наблюдаемым.

## Docker Compose

Корневая команда `npm run dev` использует Compose только для PostgreSQL и является поддерживаемым локальным путём.

Полный frontend-образ получает `VITE_API_BASE_URL` через Docker build argument. Для сборки с production-настройками используйте `docker compose --env-file .env.prod up --build`.

## Наблюдаемость и backup

- healthcheck: `GET /health`;
- логируйте request failures без токенов и паролей;
- настройте Railway restart policy и alerts на 5xx/недоступность;
- включите регулярные PostgreSQL backups и проверьте восстановление;
- храните импортные отчёты с количеством imported/skipped/ignored/failed;
- перед массовым удалением планов делайте отдельный backup.

## Чек-лист перед релизом

```bash
npm ci
npm run lint
npm run build
npm run test:coverage
npm run test:security
```

Затем проверьте:

- миграции применены;
- `/health` отвечает `200`;
- frontend открывается по прямому route `/plans`;
- API URL использует HTTPS и не заканчивается лишним `/api`;
- login, catalog, details, same-level comparison и download проходят end-to-end;
- разные уровни сравнения блокируются и клиентом, и API;
- CORS разрешает production и preview domains, но отклоняет посторонний origin;
- Swagger выключен, если публичный доступ не нужен;
- dataset содержит ожидаемые годы и количество планов;
- скриншоты и документация соответствуют release.

## Откат

Frontend откатывается на предыдущий Vercel deployment, backend — на предыдущий Railway image. Схемная миграция должна быть backward-compatible с предыдущей версией или иметь заранее проверенный план восстановления из backup. Не используйте `prisma migrate reset` в production.
