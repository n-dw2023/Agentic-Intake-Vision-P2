# Password-Protect Entry (Lite)

> 2026-02-15 · Contract locked ✅

**Goal:** Single shared password gate for UI + API; session-only (until browser close).

**Must have:** Gate UI (password form) before app; server verifies password from env (`APP_ENTRY_PASSWORD`), sets session (HTTP-only session cookie); all protected API routes require valid session (401 otherwise); optional logout.

**Out of scope:** Per-user accounts, password change, forgot password, remember-me, Supabase Auth.

**Success:** Unauthenticated → only gate visible, API returns 401. After correct password → app loads, API works. After tab close → gate again.

**Stories:** 1) Gate UI and client auth state. 2) Server auth endpoint and session. 3) Protect API routes and 401 handling.
