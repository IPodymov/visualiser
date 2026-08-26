# Разработка

## Первый запуск

Требуются Node.js 20+, npm 10+ и Docker.

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run dev:db
npm run prisma:migrate
npm run seed
npm run import:fit
npm run dev
```

Замените placeholder credentials в `.env` до запуска PostgreSQL. `npm run dev` останавливает docker-версии backend/frontend, освобождает порты 4000/5173, поднимает только PostgreSQL в Docker и запускает оба приложения локально.

## Работа с данными

`FIT_DIR` разрешает несколько каталогов через запятую. Для актуального набора задайте:

```env
FIT_DIR="../../FIT"
FIT_IMPORT_ADMISSION_YEAR="2025"
```

Импорт идемпотентен для неизменённого файла благодаря SHA-256. Он не удаляет записи прошлых лет. Перед очисткой базы сделайте backup, посчитайте записи-кандидаты и после транзакции повторно проверьте годы, количество файлов, hashes и планы без дисциплин.

Утверждённые исходники хранятся в `FIT/<год>/...`. Корневые `FIT/*.xlsx`, создаваемые локальной HTTP-загрузкой, являются runtime-файлами и не версионируются.

При изменении Prisma schema:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Production применяет только закоммиченные миграции через `prisma migrate deploy`.

## Повседневные команды

```bash
npm run dev:frontend
npm run dev:backend
npm run lint
npm run build
npm run test
npm run test:coverage
npm run test:security
```

Root-команды запускают обе workspace последовательно. Для одного приложения используйте `-w apps/frontend` или `-w apps/backend`.

## Порядок изменения

1. Найдите существующий аналог и тесты.
2. Зафиксируйте пользовательский сценарий и источник данных.
3. Сохраняйте DTO; меняйте контракт только при необходимости.
4. Реализуйте backend-инвариант и frontend-feedback.
5. Добавьте happy path, edge, error и security test.
6. Запустите целевые проверки, затем полный quality gate.
7. Обновите документацию и screenshots, если изменился видимый сценарий.

Для frontend product work обязательны проектные skills из `.codex/skills` согласно `AGENTS.md`; `.agents/skills` содержит symlink-каталоги для автоматического обнаружения Codex.

## Тестирование

Backend использует Vitest + Supertest, frontend — Vitest + jsdom + Testing Library. Coverage thresholds настроены на 100% statements, branches, functions и lines для обоих приложений.

Тестовый минимум для сценария:

- успешное действие пользователя;
- пустые и частичные данные;
- validation boundary;
- loading, network/API error и retry;
- неавторизованный запрос, если есть protected behavior;
- попытка обойти frontend-ограничение прямым API-запросом;
- keyboard/accessibility behavior для нового control;
- mobile layout для изменённой композиции.

100% coverage не заменяет проверку требований: assertions должны подтверждать поведение, а не только исполнять строки.

## Security gate

`npm run test:security` запускает:

- backend security tests;
- frontend security-focused tests;
- `npm audit --audit-level=low`.

Не ослабляйте CORS, Helmet, validation или rate limits ради прохождения локального запроса. Для loopback development разрешены `localhost`, `127.0.0.1` и `[::1]`; в production они валидатором запрещены.

## Автоматический анализ кода

Workflow `.github/workflows/codeql.yml` запускает CodeQL-анализ JavaScript/TypeScript при push и pull request в `main`, а также по еженедельному расписанию. Он дополняет, но не заменяет локальные lint, build, tests, coverage и security gate.

## Обновление скриншотов

1. Примените миграции и импортируйте ожидаемый dataset.
2. Запустите приложение и убедитесь, что `/health` и каталог отвечают.
3. Очистите browser state, кроме специально подготовленного сценария профиля/сравнения.
4. Снимите все файлы из `docs/assets/screenshots` в тех же viewport.
5. Проверьте desktop, compare scroll position и mobile 390 px.
6. Измените query-версию изображений в README и `docs/screenshots.md`.

## Git hygiene

- не коммитьте `.env`, токены, dumps, coverage и временные `~$` workbooks;
- не перезаписывайте несвязанные изменения в dirty worktree;
- перед commit выполните `git diff --check` и просмотрите staged diff;
- commit message должен описывать результат для пользователя.
