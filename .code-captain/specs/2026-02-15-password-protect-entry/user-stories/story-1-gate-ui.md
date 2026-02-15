# Story 1: Gate UI and Client Auth State

**Spec:** [Password-Protect Entry](../../spec.md)

## Goal

User sees a full-screen password gate until they enter the correct password. After success, the main app is shown and the client treats the session as valid until the server indicates otherwise (e.g. 401).

## Acceptance Criteria

- [ ] Unauthenticated users see only a full-screen gate: password input, submit, and error area. No app content (header, study projects, etc.) is visible.
- [ ] Submitting the correct password (via login API) causes the gate to disappear and the main app to render.
- [ ] Submitting an incorrect password shows an error message (e.g. "Incorrect password") and does not reveal app content.
- [ ] Client maintains "authenticated" state (e.g. in memory or sessionStorage) so that reloads within the same session do not show the gate if the server session is still valid (cookie sent automatically).
- [ ] If any API call returns 401, the client clears auth state and shows the gate again (no broken half-loaded app).
- [ ] Optional: Logout control (e.g. in header or gate) calls logout API and then shows the gate.

## Implementation Tasks

1. Add an auth gate component (full-screen overlay) with password input, submit button, and error message area. Style to match existing app (e.g. Tailwind/Stitches).
2. Add client-side auth state: e.g. React context or small store that holds `isAuthenticated` (or session validity). Initially `false`; set to `true` after successful login response.
3. In app entry (e.g. `main.tsx` or root layout), conditionally render: if not authenticated, render only the gate; if authenticated, render `<App />`.
4. Gate submit handler: call `POST /api/auth/login` (or equivalent) with `{ password }`. On success (2xx), set auth state to true and optionally store a "session valid" flag in sessionStorage for reloads; on 401, show error in gate.
5. Ensure login request uses `credentials: 'include'` (or equivalent) so the session cookie is stored and sent on same-origin requests.
6. Add global API response handling (e.g. in `api.ts` or fetch wrapper): on 401, clear auth state and redirect/re-render to show the gate. Ensure this runs for all protected API calls.
7. Optional: Add a "Log out" control that calls `POST /api/auth/logout`, then clears auth state and shows the gate.

## Notes

- Password must never be stored in client state beyond the form submission.
- Session cookie is set by the server; client only needs to know "we have a valid session" for UI (e.g. after login success, or after a successful API call that implies session is valid).
