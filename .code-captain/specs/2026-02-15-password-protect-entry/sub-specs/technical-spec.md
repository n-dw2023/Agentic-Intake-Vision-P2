# Technical Spec: Password-Protect Entry

**Spec:** [Password-Protect Entry](../spec.md)

## Architecture Overview

- **Client:** React app entry wraps the app in an auth gate. Gate is a full-screen component that collects password and calls the login API. Auth state (boolean "session valid") is held in React state/context; no token stored in localStorage. All API calls use `credentials: 'include'` so the session cookie is sent. A global response handler (e.g. in `client/src/api.ts`) detects 401 and clears auth state so the gate is shown again.
- **Server:** Express. New auth router at `/api/auth` with `POST /api/auth/login` and `POST /api/auth/logout`. Session is stored server-side (in-memory Map keyed by session id) and identified by an HTTP-only cookie `app_session`. Cookie has no Max-Age/Expires (session-only). Middleware runs before protected routes: if path is under `/api/` and not `/api/health` or `/api/auth/login`, require valid session or return 401. Existing route handlers still use `getUserId(req)` for `x-user-id`; session check is an additional layer.

## Current Server Layout (Pre-Auth)

- `server/src/index.ts`: mounts express.json(), `/api/health`, `/api/workflows`, `/api/protocols`, `/api/study-projects`, `/api/prompts`, 404 handler.
- Each of workflows, protocols, studyProjects, prompts defines `getUserId(req)` and returns 401 when `x-user-id` is missing. No shared middleware yet.

## Session Store

- In-memory Map keyed by session id. Single process only; if scaling to multiple processes, switch to Redis or use a signed cookie (stateless).
- Session id: crypto.randomBytes(32).toString('hex') or equivalent. Cookie: app_session=sessionId; HttpOnly; Path=/; SameSite=Strict (no Max-Age/Expires).

## Middleware Order

1. express.json()
2. Session middleware for paths under /api/ except GET /api/health and POST /api/auth/login. If no valid session cookie then 401 and return; else next().
3. Existing route handlers; they continue to call getUserId(req) and return 401 if x-user-id is missing.

So: first session check (gate to the API), then existing x-user-id check (per-route).

## Public vs Protected Routes

- GET /api/health — session not required
- POST /api/auth/login — session not required
- POST /api/auth/logout — optional (can allow unauthenticated)
- /api/workflows, /api/protocols, /api/study-projects, /api/prompts — session required

## Client Auth State

- No JWT or token in localStorage for the password session. Cookie is HTTP-only. Client only needs a boolean "we have passed the gate" for this tab: in-memory or sessionStorage. On reload, first API call will either 200 (cookie sent) or 401 (show gate). After login success set "gate passed"; on any 401 clear state and show gate.

## Environment

- Server: APP_ENTRY_PASSWORD (required for login). Document in .env.example; do not commit real value.

## File and Module Changes (Summary)

- New: server/src/routes/auth.ts (login, logout, session store, cookie helpers).
- New: server/src/middleware/requireSession.ts or inline in index (session check before protected routes).
- Modify: server/src/index.ts (mount auth router, mount session middleware, optional APP_ENTRY_PASSWORD check at startup).
- New: client gate component and auth context (e.g. EntryGate.tsx, AuthContext.tsx).
- Modify: client/src/main.tsx (render gate vs app based on auth state).
- Modify: client/src/api.ts (credentials include, 401 interceptor to clear auth and show gate).
