# Password-Protect Application Entry Specification

> **Created:** 2026-02-15  
> **Status:** Planning  
> **Contract Locked:** ✅

## Contract Summary

**Deliverable:** A single shared password gate that protects both the UI and the API. Users must enter the password once per browser session; the server verifies it, establishes a session, and all API requests require that session until the tab is closed.

**Must Include:**
- Full-screen gate (password form) before any app content; app only renders after successful auth.
- Server-side password check: password stored only in server env (e.g. `APP_ENTRY_PASSWORD`); no password in client bundle.
- Session binding: after correct password, server sets a session (e.g. HTTP-only cookie or signed token); all protected API routes reject requests without a valid session (401).
- Session-only lifetime: session invalid when the browser session ends (e.g. session cookie or client clearing sessionStorage + server session store keyed by session id with same semantics).

**Hardest Constraint:** Keeping the existing `x-user-id` flow for backend identity while layering session auth so that only session-authenticated requests are accepted (no change to how study projects etc. are scoped per user, just an extra "must be logged in" check).

**Success Criteria:**
- Unauthenticated: visiting the app shows only the password screen; direct API calls without a valid session receive 401.
- After correct password: app loads and all API calls succeed for that session.
- After closing the tab/window: next visit shows the gate again and API calls without a new login get 401.

**Scope Boundaries:**
- **In scope:** Gate UI (password form, submit, error state), server auth endpoint (e.g. POST verify password, set session), middleware (or equivalent) that rejects protected routes when session is missing/invalid, session storage (server-side or signed cookie) with session-only lifetime, optional logout that clears session.
- **Out of scope:** Per-user accounts, password change flow, "forgot password," remember-me, and Supabase Auth integration (remains future).

## Detailed Requirements

### Gate (Client)
- Single full-screen view shown before the main application when the user is not authenticated.
- Password input (type password), submit control, and error message area (e.g. "Incorrect password").
- No app content (header, study projects, checklist, etc.) visible until the user has passed the gate.
- After successful login, the client stores that the session is valid (e.g. in memory or sessionStorage for "do we show gate?" only; actual auth is cookie/token sent with requests). If the server returns 401 on any API call, the client clears auth state and shows the gate again.

### Auth (Server)
- One shared password configured via environment variable (e.g. `APP_ENTRY_PASSWORD`). Never shipped in client code or in repo.
- Auth endpoint (e.g. `POST /api/auth/login` or `POST /api/auth/verify`) accepts `{ "password": "..." }`. If the password matches the env value, the server creates a session and sets an HTTP-only, session cookie (or returns a short-lived signed token; if token, client sends it on subsequent requests). If the password does not match, return 401.
- Session lifetime: session-only (browser session). Use a session cookie with no `Max-Age`/`Expires` so it is cleared when the browser is closed.

### API Protection (Server)
- All existing protected API routes (study-projects, protocols, workflows, prompts) must require a valid session in addition to `x-user-id`. If the session is missing or invalid, return 401. No change to how `x-user-id` is used for data scoping; this is an additional gate.

### Logout (Optional but Recommended)
- A way to clear the session (e.g. "Log out" link or button). Server endpoint (e.g. `POST /api/auth/logout`) clears the session cookie or invalidates the session; client then shows the gate again.

### Security and UX
- Password never stored or logged on the client. Env var only on the server.
- On 401 from any API call, treat as "session invalid" and show the gate again so the app does not sit in a broken state.

## Implementation Approach

- **Client:** Wrap the app entry (e.g. in `main.tsx` or a new root component) with an auth gate. If "not authenticated," render only the gate UI. If "authenticated," render `<App />`. Authentication is established by calling the login API; success sets a cookie (automatically sent on same-origin requests) or client stores a token and sends it in headers (existing `headers()` in `api.ts` can be extended to include the token or rely on cookie). On 401 from any fetch, clear auth and show gate.
- **Server:** Add `APP_ENTRY_PASSWORD` to env (and `.env.example`). Add auth router with `POST /api/auth/login` (verify password, set session cookie) and optionally `POST /api/auth/logout` (clear cookie). Use a session store (in-memory or signed cookie) with session-only semantics. Add middleware (or per-route check) that runs before existing route handlers: if request has no valid session, respond 401. Existing routes continue to use `x-user-id` for data ownership.
- **Session mechanism:** Prefer HTTP-only session cookie with a server-side session id (or signed cookie containing session id + signature) so the client cannot tamper with it and the session ends when the browser is closed.
