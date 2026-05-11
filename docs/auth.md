# Authentication

The app supports registration, login, token-based API authentication, persisted auth state, and logout.

![Авторизация](./assets/screenshots/login-page.png)

## Login Flow

```mermaid
sequenceDiagram
  participant U as User
  participant F as Frontend
  participant B as Backend

  U->>F: Submit email/password
  F->>B: POST /api/auth/login
  B-->>F: user + accessToken
  F->>F: Store eduplan-token and eduplan-user
  F-->>U: Navigate to /profile
```

## Register Flow

Registration calls `POST /api/auth/register` and receives the same response shape as login.

![Регистрация](./assets/screenshots/register-page.png)

## Local Storage

| Key | Value |
| --- | --- |
| `eduplan-token` | JWT access token |
| `eduplan-user` | Public user profile |

On app startup, `App.tsx` checks for `eduplan-token` and calls `/api/auth/me`. If validation fails, logout clears stored state.

## Axios Auth Header

`services/api/client.ts` attaches the token:

```ts
config.headers.Authorization = `Bearer ${token}`;
```

## Header Behavior

| State | Header Shows |
| --- | --- |
| Guest | Login button |
| Authenticated | Profile icon with dropdown |

Profile dropdown contains only:

- `Профиль`;
- `Выйти`.

## Logout

Logout:

1. removes `eduplan-token`;
2. removes `eduplan-user`;
3. clears Zustand `user`;
4. redirects to home.

## Security Considerations

- Tokens are currently stored in `localStorage`, which is simple but exposed to XSS.
- Production deployments should enforce HTTPS.
- Backend protected endpoints must always validate JWT server-side.
- Avoid storing sensitive user fields in `eduplan-user`.
