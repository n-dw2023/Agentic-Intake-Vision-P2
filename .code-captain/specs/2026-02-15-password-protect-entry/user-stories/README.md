# User Stories: Password-Protect Entry

Stories are ordered for implementation: gate first, then server auth and session, then route protection and 401 handling.

| # | Story | Summary |
|---|--------|--------|
| 1 | [Gate UI and client auth state](story-1-gate-ui.md) | Full-screen password gate; show app only when authenticated; client auth state and login API call. |
| 2 | [Server auth endpoint and session](story-2-server-auth-and-session.md) | POST verify password from env; set HTTP-only session cookie; optional logout endpoint. |
| 3 | [Protect API routes and 401 handling](story-3-protect-routes-and-401.md) | Middleware/check on protected routes; 401 when no valid session; client reacts to 401 by showing gate. |

**Dependencies:** 1 can start in parallel with 2; 3 depends on 2. Client 401 handling (part of 1) is fully testable after 3 is done.
