# Re-implement Vercel Production (APIs, Routing, Repo)

> Created: 2026-02-15  
> Status: Planning  
> Contract Locked: Yes  
> Authority: [2026-02-15-vercel-api-best-practices/spec.md](../2026-02-15-vercel-api-best-practices/spec.md)

## Contract Summary

**Deliverable:** Re-implement APIs, routing, and repo structure so they align with the Vercel API best-practices spec and the production build and deployment succeed: SPA and `/api/*` are routable, with no 404s from routing or missing artifacts.

**Must Include:**
- Single source of truth: `vercel.json` and build pipeline match the spec; no conflicting Vercel UI overrides (Root = repo root, Output Directory blank).
- API reliability: `/api/health` and `/api/routes` always served by the catch-all; Express bundle included in the deployed function (e.g. via `includeFiles` or verified bundling); handler robust (path normalization if needed, optional try/catch for Express with 503 on failure).
- Verification: `npm run build && npm run smoke:vercel` passes; a production checklist (SPA at `/` and `/index.html`, `/api/health`, `/api/routes`, one real route) is documented and used to confirm production.

**Hardest Constraint:** Ensuring the server bundle (`api/server-dist` or equivalent) is present and used in the Vercel serverless function at runtime.

**Success Criteria:**
- After deploy, production checklist passes: `/`, `/index.html`, `/api/health`, `/api/routes`, and at least one real API route respond (no 404 from routing).
- Local `npm run build && npm run smoke:vercel` passes.
- Repo and docs describe the setup and checklist so future changes don’t regress production.

**Scope Boundaries:**
- **Included:** Aligning vercel.json, api/ contents, catch-all handler, build scripts, and deploy docs with the best-practices spec; hardening (path handling, error responses); production verification checklist.
- **Excluded:** Changing product features or auth logic; Next.js or multiple Vercel projects; rewriting Express route definitions (only how they’re mounted and invoked in production).

---

## Detailed Requirements

1. **vercel.json**
   - Version 2. Single build entry for the API: `api/[[...path]].ts` with `@vercel/node`. Include `config.includeFiles: ["api/server-dist/**"]` so the server bundle is deployed with the function.
   - Static: `dist/**` with `@vercel/static`.
   - Routes: `handle: filesystem` then `src: "/(.*)"` → `dest: "/index.html"` (SPA fallback). No custom rewrite for `/api`.

2. **api/ folder**
   - Only `api/[[...path]].ts` as runtime source. Type declaration for server-dist in `server/types/server-dist.d.ts` (referenced from handler). Build output `api/server-dist/` produced by `build:vercel-api` (not committed).

3. **Catch-all handler**
   - Respond to `GET /api/health` and `GET /api/routes` in the handler (before loading Express). Forward all other `/api/*` requests to Express with `req.url` unchanged.
   - Optional: normalize `req.url` if path does not start with `/api` (return 404 from handler). Optional: try/catch around `app(req, res)` and return 503 JSON if Express throws.
   - `DEBUG_API=1` env: log method and URL to stdout.

4. **Build pipeline**
   - Root `npm run build`: shared → server → build:vercel-api → client → build:vercel. Scripts `build:vercel-api` (server/dist → api/server-dist) and `build:vercel` (client/dist → dist) must exist.
   - `smoke:vercel`: after build, verify `dist/index.html` and `api/server-dist/index.js` exist; exit 1 with clear message if not.

5. **Documentation**
   - `.code-captain/docs/vercel-deploy.md`: single source of truth (Root Directory = repo root, Output Directory blank); production checklist; reference to best-practices spec.

---

## Production Verification Checklist

Use this after every production deploy:

- [ ] **Vercel Project Settings:** Root Directory = repo root (e.g. `.` or blank). Output Directory = **blank**.
- [ ] **Functions tab:** One function only: `api/[[...path]]` (no extra “functions” from other files under api/).
- [ ] **SPA:** `https://<deployment>/` and `https://<deployment>/index.html` load the app.
- [ ] **Assets:** A built asset URL (e.g. `/assets/index-….js`) returns 200.
- [ ] **GET /api/health:** Returns 200 and JSON `{ "ok": true, "timestamp": "..." }`.
- [ ] **GET /api/routes:** Returns 200 and JSON array of route prefixes.
- [ ] **One real route:** e.g. `GET /api/study-projects` with valid auth returns 200 or 401 (not 404).

**Local:** `npm run build && npm run smoke:vercel` must pass before pushing.

---

## Implementation Approach

- Treat [2026-02-15-vercel-api-best-practices/spec.md](../2026-02-15-vercel-api-best-practices/spec.md) as the canonical architecture; this spec only adds the re-implementation scope and the production checklist.
- Audit current `vercel.json`, `api/[[...path]].ts`, and `package.json` against the spec; add or fix `includeFiles`, handler path/error handling, and smoke script as needed.
- Ensure vercel-deploy.md contains the checklist and single-source-of-truth rules; add a short “Production verification” section that points to this checklist.
