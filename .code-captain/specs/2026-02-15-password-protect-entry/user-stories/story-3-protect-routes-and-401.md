# Story 3: Protect API Routes and 401 Handling

**Spec:** [Password-Protect Entry](../../spec.md)

## Goal

All protected API routes require a valid session. Requests without a valid session receive 401. Existing `x-user-id` behavior is unchanged; session check is an additional gate.

## Acceptance Criteria

- [ ] Every protected route (study-projects, protocols, workflows, prompts, etc.) first checks for a valid session (via cookie + server session store). If missing or invalid, respond 401 with a consistent body (e.g. `{ "error": "Unauthorized" }`).
- [ ] Routes that are intentionally public (e.g. health check, or the login endpoint itself) do not require a session.
- [ ] Existing logic that uses `x-user-id` for data scoping remains unchanged; session check runs before or alongside it and does not replace it.
- [ ] Client receives 401 on any protected API call and reacts by clearing auth state and showing the gate (covered in Story 1).

## Implementation Tasks

1. Identify all protected API route modules (e.g. under `server/src/routes/`). List routes that must require session: study-projects, protocols, workflows, prompts, and any other that currently use `getUserId(req)` or similar.
2. Add a reusable session check (e.g. `requireSession(req, res, next)` or `withSession(handler)`): read session cookie, validate against session store; if invalid or missing, send 401 and do not call the route handler; if valid, attach session info to `req` if needed and call the handler.
3. Apply the session check to all protected routes. Prefer a single middleware that runs for all `/api/*` except `/api/auth/login` (and optionally health), or apply per router.
4. Ensure 401 response body is consistent (e.g. `{ "error": "Unauthorized" }`) and status code is 401 so the client can reliably detect "session invalid."
5. Verify that `getUserId(req)` (or equivalent) still runs after the session check and that 401 is still returned when `x-user-id` is missing (so two checks: session required, then user id required for data routes).
6. Document which routes are public vs protected in technical spec or API spec.

## Notes

- Order of checks: first session (valid cookie + session store), then optional `x-user-id` for routes that need it. Unauthenticated (no session) → 401 before any business logic.
- Client 401 handling is implemented in Story 1; this story ensures the server sends 401 for missing/invalid session so the client can react.
