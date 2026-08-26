# Backend

Backend расположен в `apps/backend`. Это Express API на TypeScript с Prisma/PostgreSQL, Zod-валидацией, JWT-аутентификацией, импортом FIT Excel и OpenAPI-документацией.

## Структура

```text
apps/backend/
├── prisma/
│   ├── migrations/            # версионируемая схема БД
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── config/                # env и Prisma Client
    ├── middlewares/           # auth, optional auth, security, errors
    ├── modules/               # предметные модули
    ├── scripts/import-fit.ts  # CLI-импорт
    ├── shared/                # validation, AppError, OpenAPI
    ├── tests/
    ├── app.ts                 # сборка Express app
    └── main.ts                # запуск HTTP server
```

## Модули и префиксы

| Префикс             | Модуль                                           |
| ------------------- | ------------------------------------------------ |
| `/health`           | liveness endpoint                                |
| `/api/docs`         | Swagger UI при `ENABLE_API_DOCS=true`            |
| `/api/auth`         | регистрация, вход, текущий пользователь          |
| `/api/curricula`    | список, детали, рекомендации, валидация и импорт |
| `/api/faculties`    | факультеты                                       |
| `/api/specialities` | направления подготовки                           |
| `/api/disciplines`  | справочник дисциплин                             |
| `/api/comparison`   | сравнение двух планов                            |
| `/api/profile`      | избранное и история                              |
| `/api/downloads`    | исходники и экспорты                             |
| `/api/files`        | авторизованная загрузка `.xlsx`                  |
| `/api/users`        | получение пользователя по ID                     |

Полный HTTP-контракт: [api.md](./api.md).

## Конфигурация

Backend читает корневой `.env` в development. Основные переменные:

| Переменная                   | Назначение                                                            |
| ---------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection string                                          |
| `PORT`                       | HTTP port, по умолчанию `4000`                                        |
| `JWT_SECRET`                 | ключ подписи JWT; в production минимум 32 символа                     |
| `JWT_EXPIRES_IN`             | срок жизни токена, по умолчанию `1d`                                  |
| `JWT_ISSUER`, `JWT_AUDIENCE` | issuer и audience токена                                              |
| `FIT_DIR`                    | один или несколько каталогов импорта через запятую                    |
| `FIT_IMPORT_ADMISSION_YEAR`  | необязательный фильтр года                                            |
| `FRONTEND_URL`               | основной разрешённый frontend origin                                  |
| `CORS_ORIGIN`                | дополнительные origins через запятую, включая `https://*.example.com` |
| `ENABLE_API_DOCS`            | Swagger UI; по умолчанию включён вне production                       |

В production localhost запрещён для URL, frontend origins должны быть HTTPS, а Swagger выключен, пока его не включили явно.

## Импорт FIT-файлов

CLI-команда:

```bash
npm run import:fit
```

Импортёр:

1. рекурсивно обходит каждый каталог из `FIT_DIR`;
2. принимает `.xlsx`, `.xls` и `.xlsm`, пропускает файлы `~$*`;
3. при заданном `FIT_IMPORT_ADMISSION_YEAR=2025` обрабатывает только планы 2025 года;
4. считает SHA-256 содержимого и пропускает уже импортированный hash;
5. выводит факультет из структуры пути и извлекает метаданные workbook;
6. валидирует план и дисциплины;
7. записывает справочники, план и строки дисциплин в одной транзакции;
8. печатает счётчики `imported`, `skipped`, `ignored`, `failed` и детали файлов.

Текущая `.env.example` настроена на 2025 год. Фильтр влияет только на новый импорт и не удаляет старые записи из PostgreSQL. Очистку другого года выполняйте отдельной проверенной миграцией или административной операцией после резервной копии.

HTTP upload `POST /api/files/fit` сохраняет один `.xlsx` под UUID-именем. Ограничения: 10 MiB, ноль дополнительных form fields и разрешённый MIME type. Загрузка файла и запуск его импорта — отдельные операции.

При стандартном локальном `FIT_DIR=../../FIT` загруженные файлы попадают непосредственно в `FIT/`. Маска `FIT/*.xlsx` исключает эти runtime uploads из Git; версионируемые и разрешённые к публикации workbooks размещаются только в годовых подкаталогах.

## Валидация учебного плана

Проверяются:

- наличие направления и допустимого года приёма;
- непустой список дисциплин;
- семестр в диапазоне 1–12;
- отрицательные и аномально высокие часы или зачётные единицы;
- дубли и строки без семестра;
- базовая согласованность агрегатов.

Ошибки блокируют импорт; предупреждения сохраняют возможность импорта и должны быть видны в результате проверки.

## Сравнение

Backend не доверяет selection state клиента. `ComparisonService` требует:

- два положительных и разных ID;
- существование обоих планов;
- одинаковый нормализованный уровень образования.

Уровень выводится сначала из `educationLevel`, затем при необходимости из кода направления (`.03.` бакалавриат, `.04.` магистратура, `.05.` специалитет, `.06.` аспирантура). Дисциплины сопоставляются по имени после trim, lower-case и схлопывания пробелов.

## Безопасность

- Helmet, CSP `frame-ancestors 'none'` и `X-Frame-Options: DENY`;
- отключён `x-powered-by`;
- API-ответы получают запрет кеширования;
- JSON body ограничен 2 MiB и проверяется content type;
- общий rate limit 300 запросов за 15 минут;
- auth и uploads ограничены 20 запросами за 15 минут;
- Zod проверяет params, query и body в strict-контрактах;
- пароли хешируются bcrypt;
- CORS сопоставляет точные origins и безопасные wildcard-поддомены;
- error middleware не раскрывает внутренние детали неожиданной ошибки.

## Изменение базы

После правки `schema.prisma` создайте миграцию в development, проверьте её на копии данных и закоммитьте каталог миграции. В deployment применяется `prisma migrate deploy`; `db push` не является production-процессом.

## Проверки

```bash
npm run lint:backend
npm run build:backend
npm run test -w apps/backend
npm run test:coverage -w apps/backend
npm run test:security -w apps/backend
```
