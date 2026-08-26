# EduPlan Compare

EduPlan Compare — веб-приложение для поиска, изучения и сравнения учебных планов. Аналитические экраны React/Vite-клиента показывают факты из загруженных FIT-выгрузок, а Express/Prisma API импортирует Excel-файлы, хранит нормализованные данные в PostgreSQL и рассчитывает различия между программами. Пример на главной явно отмечен как демонстрационный.

![Главная страница EduPlan Compare](./docs/assets/screenshots/homepage.png?v=20260824-2)

## Что умеет приложение

- искать программы по названию, направлению, профилю, факультету и коду;
- фильтровать каталог планов 2025 года по факультету, направлению, профилю, уровню и форме;
- показывать нагрузку по семестрам, состав часов и дисциплины учебного плана;
- сравнивать две разные программы только одного уровня образования;
- объяснять сходство, общие и уникальные дисциплины, часы, зачётные единицы и различия полей;
- подбирать программы по ответам абитуриента;
- сохранять избранное и историю просмотров авторизованного пользователя;
- скачивать исходный файл, карту дисциплин и результат сравнения;
- импортировать и валидировать FIT Excel-файлы с защитой от повторов по SHA-256.

Актуальный локальный набор данных содержит 30 учебных планов приёма 2025 года: 19 программ бакалавриата, 6 магистратуры, 4 аспирантуры и 1 специалитета. Значения интерфейса зависят от содержимого вашей базы.

## Стек

| Слой           | Технологии                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Frontend       | React 18, TypeScript, Vite, React Router, Zustand, Axios, Tailwind CSS, Radix UI, Recharts, Framer Motion |
| Backend        | Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod, JWT, Swagger UI                                    |
| Инфраструктура | npm workspaces, Docker Compose, Vercel, Railway                                                           |
| Качество       | Vitest, Testing Library, Supertest, ESLint, Prettier, npm audit, GitHub CodeQL                            |

## Структура репозитория

```text
.
├── .agents/skills/             # discovery symlinks для project skills
├── .codex/skills/              # canonical project skills
├── .github/workflows/          # автоматический CodeQL-анализ
├── apps/
│   ├── frontend/              # React/Vite SPA
│   └── backend/               # Express API, Prisma, импорт FIT
├── docs/                      # проектная и эксплуатационная документация
├── FIT/                       # утверждённые Excel-выгрузки по годам и факультетам
├── packages/shared/           # место для общих пакетов
├── docker-compose.yml
├── package.json
└── README.md
```

## Требования

- Node.js 20+;
- npm 10+;
- Docker с Docker Compose;
- свободные порты `5432`, `4000` и `5173`.

## Быстрый старт

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run import:fit
npm run dev
```

Перед импортом проверьте `FIT_DIR` и `FIT_IMPORT_ADMISSION_YEAR`. Значение `2025` импортирует только файлы, чей путь или метаданные соответствуют 2025 году. Импорт не удаляет уже существующие планы других лет автоматически.

Версионируемые исходники размещаются в годовых подкаталогах `FIT/<год>/...`. Файлы `FIT/*.xlsx` в корне каталога считаются runtime uploads и игнорируются Git.

После запуска доступны:

| Сервис                               | URL                              |
| ------------------------------------ | -------------------------------- |
| Frontend                             | `http://localhost:5173`          |
| Backend API                          | `http://localhost:4000`          |
| Swagger, если `ENABLE_API_DOCS=true` | `http://localhost:4000/api/docs` |
| Healthcheck                          | `http://localhost:4000/health`   |

## Команды

| Команда                   | Назначение                                                 |
| ------------------------- | ---------------------------------------------------------- |
| `npm run dev`             | запускает PostgreSQL в Docker, backend и frontend локально |
| `npm run dev:db`          | запускает только PostgreSQL                                |
| `npm run dev:backend`     | запускает Express в watch-режиме                           |
| `npm run dev:frontend`    | запускает Vite dev server                                  |
| `npm run build`           | собирает backend и frontend                                |
| `npm run preview`         | запускает preview production-сборки frontend               |
| `npm run lint`            | проверяет оба приложения ESLint                            |
| `npm run test`            | запускает backend- и frontend-тесты                        |
| `npm run test:coverage`   | запускает тесты с покрытием обоих приложений               |
| `npm run test:security`   | запускает security-наборы и `npm audit --audit-level=low`  |
| `npm run prisma:generate` | генерирует Prisma Client                                   |
| `npm run prisma:migrate`  | применяет существующие миграции                            |
| `npm run seed`            | загружает базовые справочники                              |
| `npm run import:fit`      | импортирует FIT-файлы согласно `.env`                      |

## Маршруты приложения

| Маршрут               | Назначение                                                    |
| --------------------- | ------------------------------------------------------------- |
| `/`                   | главная страница и пример сравнения бакалавриат — бакалавриат |
| `/survey`             | опрос и рекомендации для абитуриента                          |
| `/login`, `/register` | вход и регистрация                                            |
| `/plans`              | каталог учебных планов                                        |
| `/plans/:id`          | детальный просмотр программы                                  |
| `/compare`            | A/B-сравнение двух программ одного уровня                     |
| `/profile`            | профиль, избранное и история                                  |

## Развёртывание

Рекомендуемая production-схема: frontend из `apps/frontend` на Vercel, backend из `apps/backend` и PostgreSQL на Railway. Клиенту нужен `VITE_API_BASE_URL`, API — `DATABASE_URL`, безопасный `JWT_SECRET`, `FRONTEND_URL` и `CORS_ORIGIN`. Swagger по умолчанию отключён в production.

Подробная инструкция: [развёртывание](./docs/deployment.md).

## Документация

Точка входа во всю документацию — [docs/README.md](./docs/README.md). Там собраны архитектура, API, импорт данных, авторизация, маршруты, фильтры, сравнение, дизайн-система, разработка, тестирование и deployment.

## Скриншоты

Скриншоты ниже пересняты на актуальном наборе из 30 планов 2025 года. Параметр версии в URL исключает отображение старых изображений из кеша GitHub.

![Каталог учебных планов](./docs/assets/screenshots/plans-page.png?v=20260824-2)

![Детальный просмотр учебного плана](./docs/assets/screenshots/plan-details-page.png?v=20260824-2)

![Сравнение двух программ бакалавриата](./docs/assets/screenshots/compare-page.png?v=20260824-2)

## Проверка перед отправкой изменений

```bash
npm run lint
npm run build
npm run test:coverage
npm run test:security
```

Не коммитьте `.env`, токены и production-секреты. Загружайте только те FIT-файлы, публикация которых разрешена владельцем данных.
