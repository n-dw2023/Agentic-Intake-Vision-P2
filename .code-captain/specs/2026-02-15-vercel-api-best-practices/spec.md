# Vercel API Best Practices Specification

> Created: 2026-02-15  
> Status: Active  
> Purpose: Reliable API routing and deployment on Vercel; single source of truth for config and conventions.

## 1. Problem statement

We have experienced:

- **Production 404s** — API requests (`/api/*`) or the SPA root (`/`) returning 404 in production while working locally.
- **SPA/asset 404s** — Static assets or the SPA fallback failing because of wrong `dest` (e.g. `/dist/index.html` instead of `/index.html`) or client `base` mismatch.
- **Vercel treating non-function files as functions** — Placing `.d.ts` or other non-runtime files under `api/` caused Vercel to list them as functions and risk deployment confusion.
- **Config drift** — Rewrites (e.g. `/api?path=...`), hard-coded single-file builds, or UI overrides (Output Directory) conflicting with `vercel.json`.

This spec and the associated repo conventions ensure API paths are always correctly deployed and routable in production.

## 2. Target architecture

- **Single Vercel project** at repo root.
- **Static SPA** — Built client output in `dist/` is served at the **site root** via `@vercel/static` (so `dist/index.html` → `/index.html`, `dist/assets/...` → `/assets/...`).
- **API** — All `/api` and `/api/*` requests are handled by **one** Node serverless function: the catch-all `api/[[...path]].ts`. That function loads the compiled Express app from `api/server-dist` (copied at build time from `server/dist`) and forwards requests with `req.url` unchanged.
- **No Next.js**, no split into multiple Vercel projects; monorepo structure (client / server / shared) is preserved.

## 3. File and directory conventions

### api/

- **Allowed:** Only runtime entrypoints and build output consumed by them.
  - `api/[[...path]].ts` — the single catch-all handler (only `.ts` file under `api/` that is a function).
  - `api/server-dist/` — produced by `build:vercel-api`; contains the compiled Express app. Required at runtime for the handler.
- **Not allowed:** No `.d.ts`, no ad-hoc scripts, no other source files that could be interpreted as functions. Type declarations for the server-dist import live in **server/types/** (e.g. `server/types/server-dist.d.ts`) and are referenced from the handler via a triple-slash reference.

### Build output

- **dist/** — Root-level static output. Created by copying `client/dist` → `dist`. Must contain `index.html` and `assets/` for the SPA.
- **api/server-dist/** — Created by copying `server/dist` → `api/server-dist`. Must contain the Express app entry (e.g. `index.js`) so the catch-all can `import "./server-dist/index.js"`.

## 4. Routing rules

- **Vercel** — No custom rewrite for `/api`. The catch-all `api/[[...path]].ts` is invoked for `/api` and `/api/*`; `req.url` is the full path (e.g. `/api/study-projects`).
- **Catch-all handler** — Handles `/api/health` and `/api/routes` directly (before loading Express) so deployment can be verified even if the Express bundle fails. All other requests are forwarded to the Express app with **req.url unchanged**, because Express routes are mounted under `/api` (e.g. `app.use("/api/study-projects", ...)`). No stripping or rewriting of the path.
- **Express** — All routes are mounted under the `/api` prefix. Local dev and production use the same base path; the client uses `API_BASE = "/api"`.

## 5. Build pipeline

- **Order (mandatory):**  
  1. Build shared  
  2. Build server → `server/dist/`  
  3. Copy `server/dist` → `api/server-dist` (`build:vercel-api`)  
  4. Build client → `client/dist/`  
  5. Copy `client/dist` → `dist` (`build:vercel`)

- **Vercel UI:** Root Directory must be the repo root. Output Directory must be **blank** when using this `vercel.json`; builds and routes are defined only in the config file.

## 6. Validation strategy

- **Endpoints:**  
  - GET `/api/health` — JSON `{ ok: true, timestamp }`.  
  - GET `/api/routes` — JSON list of known route prefixes (e.g. `["/api/health", "/api/workflows", ...]`).  
  - One real route (e.g. GET `/api/study-projects` with auth) must respond (200 or 401), not 404.
- **SPA:** `/index.html` and `/` both serve the app; `/assets/...` returns 200 for built assets.
- **Smoke script:** After `npm run build`, run `npm run smoke:vercel` to verify `dist/index.html` and `api/server-dist` (e.g. `api/server-dist/index.js`) exist.
- **Production checklist:** Documented in `.code-captain/docs/vercel-deploy.md`; includes Functions tab (single function), SPA, assets, `/api/health`, `/api/routes`, and one real API route.
