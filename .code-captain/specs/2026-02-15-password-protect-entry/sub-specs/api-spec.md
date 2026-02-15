# API Spec: Auth Endpoints and 401 Behavior

**Spec:** [Password-Protect Entry](../spec.md)

## Auth Endpoints

### POST /api/auth/login

**Purpose:** Verify shared password and establish a session (session-only cookie).

**Request:** POST, Content-Type application/json, Body: { "password": "string" }

**Response (success):** 200, Body { "ok": true }, Set-Cookie: app_session=sessionId; HttpOnly; Path=/; SameSite=Strict (no Max-Age/Expires).

**Response (wrong password):** 401, Body { "error": "Unauthorized" } or { "error": "Invalid password" }.

**Response (server not configured):** 503 optional if APP_ENTRY_PASSWORD is not set, Body { "error": "Auth not configured" }.

**Notes:** No session required. Request must include credentials so the response can set the session cookie (same-origin).

### POST /api/auth/logout

**Purpose:** Clear the session cookie and invalidate the session server-side.

**Request:** POST, Cookie app_session if present.

**Response (success):** 200, Body { "ok": true }, Set-Cookie to clear app_session (Max-Age=0 or Expires past).

**Notes:** Can be called with or without a valid session; always 200 and clear cookie.

### Optional: GET /api/auth/session

**Purpose:** Let client check if current session is valid. Not required for MVP.

**Response (valid):** 200 { "ok": true }. **Response (invalid):** 401 { "error": "Unauthorized" }.

---

## Protected Routes and 401

All routes under /api/workflows, /api/protocols, /api/study-projects, /api/prompts require:

1. Valid session (cookie app_session present and valid). If not then 401 { "error": "Unauthorized" }.
2. Valid x-user-id header (existing behavior). If missing then 401 with existing or standardized message.

Session check first (middleware); then existing route logic. Client treats any 401 as session invalid or user id missing and shows the gate.

**Consistent 401 body:** Use { "error": "Unauthorized" } for session-related 401.
