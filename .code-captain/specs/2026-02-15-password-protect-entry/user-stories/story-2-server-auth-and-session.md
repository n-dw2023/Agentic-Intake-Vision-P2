# Story 2: Server Auth Endpoint and Session

**Spec:** [Password-Protect Entry](../../spec.md)

## Goal

Server exposes an auth endpoint that verifies the shared password from environment and establishes a session-only session (HTTP-only cookie). Optional logout endpoint clears the session.

## Acceptance Criteria

- [ ] `APP_ENTRY_PASSWORD` is read from server environment; if missing, auth endpoint returns 503 or refuses to start (per project conventions).
- [ ] `POST /api/auth/login` (or agreed path) accepts JSON body `{ "password": "..." }`. If password matches `APP_ENTRY_PASSWORD`, respond 200 and set an HTTP-only, session cookie (no `Max-Age`/`Expires` so it ends when browser closes). If password does not match, respond 401 with a generic message.
- [ ] Session is stored server-side (e.g. in-memory map keyed by session id) or in a signed cookie; session id is unpredictable and tied to "session only" lifetime.
- [ ] Optional: `POST /api/auth/logout` clears the session cookie and invalidates the server-side session; responds 200.
- [ ] `.env.example` documents `APP_ENTRY_PASSWORD` (no real value); real value is set in `.env` or deployment env.

## Implementation Tasks

1. Add `APP_ENTRY_PASSWORD` to server env schema and `.env.example`. Fail fast or return 503 from login if not set (to avoid accidental unprotected deploy).
2. Create auth router (e.g. `server/src/routes/auth.ts`) with `POST /api/auth/login`: parse JSON body, compare `password` to `process.env.APP_ENTRY_PASSWORD`, return 401 on mismatch.
3. On successful password check: generate a secure session id (e.g. `crypto.randomBytes(32).toString('hex')`), store it in server-side session store (e.g. `Map<sessionId, { createdAt }>`), set HTTP-only cookie with name like `app_session`, value = session id, `Path=/`, `SameSite=Strict`, no `Max-Age`/`Expires`. Respond 200 with optional `{ "ok": true }`.
4. Add helper (e.g. `getSessionId(req)`) that reads the session cookie and validates it against the session store; export for use in route protection (Story 3).
5. Optional: Add `POST /api/auth/logout` that clears the session cookie (Set-Cookie with empty value and past expiry) and removes the session from the server store; respond 200.
6. Mount auth router in the main server app so `/api/auth/login` and `/api/auth/logout` are reachable.

## Notes

- Use a cryptographically secure random session id. Session store can be in-memory for a single process; if multiple processes, use a shared store (e.g. Redis) or stick with signed cookie containing session payload (stateless).
- Session-only: do not set `Max-Age` or `Expires` on the cookie so the browser drops it when the tab/window is closed.
