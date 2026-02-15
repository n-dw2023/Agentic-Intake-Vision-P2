# Authentication: Supabase Email/Password

The application uses **Supabase Auth** only. There is no app-level shared password or session cookie.

## Flow

1. **Client (UI)**  
   - User signs in via **EntryGate** (email + password).  
   - `AuthContext` calls `supabase.auth.signInWithPassword()` and, on success, stores `{ accessToken, userId }` in memory via `api.setAuthSession()`.  
   - Session is also in `sessionStorage` (Supabase client), so closing the tab logs out.

2. **Client → API**  
   - All API calls use `api.ts`: `fetchWithAuth()` sends `Authorization: Bearer <accessToken>` and `x-user-id: <userId>` on every request.

3. **Server (API)**  
   - All `/api/*` routes except `/api/health` are protected by **requireSupabaseAuth**:  
     - Reads `Authorization` header, verifies JWT using **JWKS** from `SUPABASE_URL` (asymmetric signing keys; no secret needed), or optionally `SUPABASE_JWT_SECRET` (legacy symmetric). Use the full JWT Secret if needed, not the Key Id (kid).  
     - Sets `req.authUserId` and `req.headers["x-user-id"]`; missing/invalid token → 401.  
   - Route handlers use `x-user-id` (or `getUserId(req)`) for data scoping (workflows, study-projects, protocols).

4. **401 handling**  
   - If the API returns 401, `api.ts` invokes `unauthorizedHandler`; `AuthContext` clears session and sets `isAuthenticated = false`, so the UI shows EntryGate again.

## Key files

| Layer   | File | Role |
|--------|------|------|
| Client | `client/src/context/AuthContext.tsx` | Login (Supabase signIn), logout, session restore, 401 handler |
| Client | `client/src/components/EntryGate.tsx` | Email/password form |
| Client | `client/src/api.ts` | `setAuthSession`, `headers()` (Bearer + x-user-id), `fetchWithAuth` |
| Client | `client/src/lib/supabase.ts` | Supabase client (sessionStorage) |
| Server | `server/src/middleware/requireSupabaseAuth.ts` | JWT verify, set `req.authUserId` and `x-user-id` |
| Server | `server/src/index.ts` | Mounts requireSupabaseAuth for all /api/* except /api/health |

## Env

- **Client:** No auth-specific env; `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` come from repo-root `.env` via Vite.  
- **Server:** `SUPABASE_URL` is used to verify JWTs via JWKS (recommended; no secret or Key Id). Optional: `SUPABASE_JWT_SECRET` (full JWT Secret only, not Key Id) for legacy HS256 projects. At least one of these required for protected routes; otherwise 503.

## Removed (legacy)

- Cookie/session auth (`server/src/routes/auth.ts`, `server/src/middleware/requireSession.ts`) and `APP_ENTRY_PASSWORD` are **removed**.  
- No cookie-parser; no `/api/auth/login` or `/api/auth/logout` on the server.
