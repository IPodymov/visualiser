# API Documentation

Base URL in development:

```text
http://localhost:4000
```

When called from the Vite frontend, `/api` is proxied to the backend.

## Health

| Method | URL | Auth |
| --- | --- | --- |
| GET | `/health` | No |

Response:

```json
{ "status": "ok" }
```

## Auth

### Register

| Method | URL | Auth |
| --- | --- | --- |
| POST | `/api/auth/register` | No |

Request:

```json
{
  "email": "student@example.com",
  "password": "password123",
  "fullName": "Student Name"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "email": "student@example.com",
    "fullName": "Student Name",
    "createdAt": "2026-05-11T10:00:00.000Z",
    "updatedAt": "2026-05-11T10:00:00.000Z"
  },
  "accessToken": "jwt-token"
}
```

### Login

| Method | URL | Auth |
| --- | --- | --- |
| POST | `/api/auth/login` | No |

Request:

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

Errors:

| Status | Reason |
| --- | --- |
| 401 | Invalid email or password |
| 400 | Validation error |

### Current User

| Method | URL | Auth |
| --- | --- | --- |
| GET | `/api/auth/me` | Bearer token |

## Curricula

### List Curricula

| Method | URL | Auth |
| --- | --- | --- |
| GET | `/api/curricula` | No |

Query parameters:

| Parameter | Type | Required | Example |
| --- | --- | --- | --- |
| `specialityName` | string | No | `Веб-технологии` |
| `specialityCode` | string | No | `09.03` |
| `admissionYear` | integer | No | `2025` |

Example:

```bash
curl "http://localhost:4000/api/curricula?admissionYear=2025"
```

Response item:

```json
{
  "id": 99,
  "specialityId": 64,
  "admissionYear": 2025,
  "educationLevel": "Аспирантура",
  "educationForm": "Очная",
  "profileName": null,
  "sourceFileName": "2. - 000021698 - 2025.xlsx",
  "uploadedAt": "2026-05-10T20:40:54.212Z",
  "speciality": {
    "id": 64,
    "code": "2.",
    "name": "..."
  }
}
```

### Curriculum Details

| Method | URL | Auth |
| --- | --- | --- |
| GET | `/api/curricula/:id` | Optional |

Returns curriculum metadata and disciplines grouped by semester.

### Curriculum Disciplines

| Method | URL | Auth |
| --- | --- | --- |
| GET | `/api/curricula/:id/disciplines` | No |

### Curriculum Validation

| Method | URL | Auth |
| --- | --- | --- |
| GET | `/api/curricula/:id/validation` | No |

### Import FIT Files

| Method | URL | Auth |
| --- | --- | --- |
| POST | `/api/curricula/import-fit` | Bearer token |

## Comparison

| Method | URL | Auth |
| --- | --- | --- |
| GET | `/api/comparison` | No |

Query:

| Parameter | Type | Required |
| --- | --- | --- |
| `firstCurriculumId` | integer | Yes |
| `secondCurriculumId` | integer | Yes |

Example:

```bash
curl "http://localhost:4000/api/comparison?firstCurriculumId=1&secondCurriculumId=2"
```

Response:

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
      "name": "Алгоритмы",
      "differences": [
        {
          "field": "totalHours",
          "firstValue": 144,
          "secondValue": 108
        }
      ]
    }
  ],
  "onlyInFirst": [],
  "onlyInSecond": []
}
```

## Profile

All profile endpoints require a Bearer token.

| Method | URL | Description |
| --- | --- | --- |
| GET | `/api/profile/favorites` | List favorite curricula |
| POST | `/api/profile/favorites/:curriculumId` | Add favorite |
| DELETE | `/api/profile/favorites/:curriculumId` | Remove favorite |
| GET | `/api/profile/history` | View history |

## Files and Downloads

| Method | URL | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/files/fit` | Bearer | Upload `.xlsx` FIT file |
| GET | `/api/downloads/curricula/:id` | Optional | Download source file |
| GET | `/api/downloads/curricula/:id/discipline-map` | Optional | Download discipline map |
| GET | `/api/downloads/comparison` | Optional | Download comparison export |

## Common Errors

| Status | Meaning |
| --- | --- |
| 400 | Validation error |
| 401 | Missing or invalid authentication |
| 404 | Entity not found |
| 409 | Conflict, such as duplicate user email |
| 500 | Unexpected server error |
