# HTTP API

Development base URL: `http://localhost:4000`. Все прикладные endpoints, кроме `/health`, находятся под `/api`. Swagger UI доступен по `/api/docs`, только если `ENABLE_API_DOCS=true`.

## Общие правила

- JSON-запросы отправляются с `Content-Type: application/json`.
- Защищённые маршруты требуют `Authorization: Bearer <token>`.
- ID — положительные целые числа.
- Неизвестные поля strict-body контрактов отклоняются.
- Ошибки возвращаются в JSON с полем `message`; validation response может содержать дополнительные безопасные детали.
- `/api/*` получает `Cache-Control: no-store` и ограничивается rate limit.

## Служебные endpoints

| Метод | URL         | Auth | Назначение                             |
| ----- | ----------- | ---- | -------------------------------------- |
| GET   | `/health`   | нет  | `{ "status": "ok" }`                   |
| GET   | `/api/docs` | нет  | Swagger UI, если включён конфигурацией |

## Авторизация

| Метод | URL                  | Auth | Назначение                  |
| ----- | -------------------- | ---- | --------------------------- |
| POST  | `/api/auth/register` | нет  | регистрация и выдача токена |
| POST  | `/api/auth/login`    | нет  | вход и выдача токена        |
| GET   | `/api/auth/me`       | JWT  | текущий пользователь        |

Регистрация:

```json
{
  "email": "student@example.com",
  "password": "strong-pass-2026",
  "fullName": "Анна Смирнова"
}
```

Ограничения: email до 254 символов, пароль 12–128 символов, `fullName` необязателен и после trim должен содержать 1–120 символов. Email нормализуется в lowercase. Успешные register/login возвращают:

```json
{
  "user": {
    "id": 1,
    "email": "student@example.com",
    "fullName": "Анна Смирнова",
    "createdAt": "2026-08-24T10:00:00.000Z",
    "updatedAt": "2026-08-24T10:00:00.000Z"
  },
  "accessToken": "<jwt>"
}
```

## Учебные планы

| Метод | URL                              | Auth     | Назначение                                    |
| ----- | -------------------------------- | -------- | --------------------------------------------- |
| GET   | `/api/curricula`                 | нет      | список планов                                 |
| POST  | `/api/curricula/recommendations` | нет      | рекомендации по весам интересов               |
| GET   | `/api/curricula/:id`             | optional | план с дисциплинами; с JWT фиксирует просмотр |
| GET   | `/api/curricula/:id/disciplines` | нет      | строки дисциплин плана                        |
| GET   | `/api/curricula/:id/validation`  | нет      | результат проверки плана                      |
| POST  | `/api/curricula/import-fit`      | JWT      | запустить импорт каталогов из `FIT_DIR`       |

Параметры списка:

| Query            | Тип              | Описание                       |
| ---------------- | ---------------- | ------------------------------ |
| `specialityName` | string           | фильтр по названию направления |
| `specialityCode` | string           | фильтр по коду направления     |
| `facultyId`      | positive integer | фильтр по факультету           |
| `admissionYear`  | integer          | год приёма                     |

```bash
curl "http://localhost:4000/api/curricula?facultyId=1&admissionYear=2025"
```

Frontend-фильтры уровня, формы, профиля и поисковой строки применяются на клиенте после получения списка. Это описано в [filters.md](./filters.md).

Запрос рекомендаций:

```json
{
  "educationLevel": "bachelor",
  "studyForm": "fullTime",
  "limit": 6,
  "weights": {
    "software": 80,
    "web": 60,
    "data": 30
  }
}
```

`educationLevel`: `bachelor`, `specialist`, `master`, `postgraduate`. `studyForm`: `fullTime`, `partTime`, `evening`. `limit`: 1–12. Веса категорий находятся в диапазоне 0–100, хотя бы один должен быть больше нуля.

## Сравнение

| Метод | URL               | Auth |
| ----- | ----------------- | ---- |
| GET   | `/api/comparison` | нет  |

Обязательные query-параметры: `firstCurriculumId` и `secondCurriculumId`.

```bash
curl "http://localhost:4000/api/comparison?firstCurriculumId=99&secondCurriculumId=97"
```

Планы должны существовать, иметь разные ID и одинаковый уровень образования. Ответ содержит `firstCurriculum`, `secondCurriculum`, `summary`, `commonDisciplines`, `onlyInFirst`, `onlyInSecond`.

```json
{
  "summary": {
    "firstDisciplinesCount": 42,
    "secondDisciplinesCount": 39,
    "commonCount": 31,
    "onlyFirstCount": 11,
    "onlySecondCount": 8
  },
  "commonDisciplines": [
    {
      "name": "Алгоритмы и структуры данных",
      "first": { "semesterNumber": 3, "totalHours": 144, "credits": "4" },
      "second": { "semesterNumber": 4, "totalHours": 108, "credits": "3" },
      "differences": [
        { "field": "semesterNumber", "firstValue": 3, "secondValue": 4 },
        { "field": "totalHours", "firstValue": 144, "secondValue": 108 }
      ]
    }
  ],
  "onlyInFirst": [],
  "onlyInSecond": []
}
```

## Справочники

| Метод | URL                     | Auth | Назначение                                          |
| ----- | ----------------------- | ---- | --------------------------------------------------- |
| GET   | `/api/faculties`        | нет  | факультеты; поддерживается optional `admissionYear` |
| GET   | `/api/specialities`     | нет  | направления подготовки                              |
| GET   | `/api/specialities/:id` | нет  | направление по ID                                   |
| GET   | `/api/disciplines`      | нет  | дисциплины                                          |
| GET   | `/api/disciplines/:id`  | нет  | дисциплина по ID                                    |
| GET   | `/api/users/:id`        | JWT  | пользователь по ID                                  |

## Профиль

Все endpoints требуют JWT.

| Метод  | URL                                    | Назначение              |
| ------ | -------------------------------------- | ----------------------- |
| GET    | `/api/profile/favorites`               | список избранных планов |
| POST   | `/api/profile/favorites/:curriculumId` | добавить в избранное    |
| DELETE | `/api/profile/favorites/:curriculumId` | удалить из избранного   |
| GET    | `/api/profile/history`                 | история просмотров      |

## Файлы и скачивания

| Метод | URL                                           | Auth     | Назначение                                      |
| ----- | --------------------------------------------- | -------- | ----------------------------------------------- |
| POST  | `/api/files/fit`                              | JWT      | загрузить один `.xlsx` в multipart field `file` |
| GET   | `/api/downloads/curricula/:id`                | optional | скачать исходный workbook                       |
| GET   | `/api/downloads/curricula/:id/discipline-map` | optional | выгрузить карту дисциплин                       |
| GET   | `/api/downloads/comparison`                   | optional | выгрузить сравнение                             |

Для выгрузки сравнения используются те же query-параметры `firstCurriculumId` и `secondCurriculumId`. Upload ограничен 10 MiB и одним файлом.

## Статусы ошибок

| Статус | Значение                                                      |
| ------ | ------------------------------------------------------------- |
| `400`  | некорректный запрос, одинаковые ID или несовместимые уровни   |
| `401`  | отсутствует или невалиден JWT                                 |
| `404`  | сущность или endpoint не найден                               |
| `409`  | конфликт, например уже зарегистрированный email               |
| `413`  | превышен лимит тела или файла                                 |
| `415`  | неподдерживаемый content type                                 |
| `429`  | превышен rate limit                                           |
| `500`  | неожиданная серверная ошибка без раскрытия внутренних деталей |
