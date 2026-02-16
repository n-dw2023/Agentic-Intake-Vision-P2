# Vercel deployment

This project deploys to Vercel as a **single project**: a Vite SPA served from **dist/** and a Node serverless function that runs the Express app. The API uses a **catch-all** so `/api` and `/api/*` are routed automatically with no rewrite. Full conventions and rationale: [.code-captain/specs/2026-02-15-vercel-api-best-practices/spec.md](../specs/2026-02-15-vercel-api-best-practices/spec.md).

## Single source of truth

- **Root Directory** — Must be the repo root (e.g. `.` or blank in Vercel Project Settings). Do not set Root Directory to `client/` or any subfolder.
- **Output Directory** — In Project Settings → Build & Development Settings, leave **Output Directory** blank. This config uses `vercel.json` builds and routes; an Output Directory override can force static-only mode and break API routing.
- **Validation** — After deploy: `/index.html` and `/` load the SPA; `/api/health` and `/api/routes` return JSON; at least one real route (e.g. `/api/study-projects`) responds (200 or 401), not 404.

## Production verification

After every production deploy, run through this checklist. Full spec: [2026-02-15-reimplement-vercel-production/spec.md](../specs/2026-02-15-reimplement-vercel-production/spec.md).

- [ ] **Vercel Project Settings:** Root Directory = repo root (`.` or blank). Output Directory = **blank**.
- [ ] **Functions tab:** One function only: **api/[[...path]]** (no extra functions from other files under api/).
- [ ] **SPA:** `https://<deployment>/` and `https://<deployment>/index.html` load the app.
- [ ] **Assets:** A built asset URL (e.g. `/assets/index-….js`) returns 200.
- [ ] **GET /api/health:** Returns 200 and JSON `{ "ok": true, "timestamp": "..." }`.
- [ ] **GET /api/routes:** Returns 200 and JSON array of route prefixes.
- [ ] **One real route:** e.g. `GET /api/study-projects` with valid auth returns 200 or 401 (not 404).

**Local before push:** `npm run build && npm run smoke:vercel` must pass.

## What vercel.json does

- **buildCommand** / **installCommand**  
  Run before the build phase. `npm run build` must produce both `dist/` and `api/server-dist/` (see below).

- **builds**
  - **api/[[...path]].ts** with **@vercel/node** — Catch-all API function. `config.includeFiles: ["api/server-dist/**"]` ensures the server bundle is deployed with the function. Vercel routes `/api` and `/api/*` to it; `req.url` is the full path (e.g. `/api/study-projects`). The handler imports the Express app from `./server-dist/index.js` (copied by `build:vercel-api`).
  - **dist/** with **@vercel/static** — Static assets (CDN).

- **routes**
  1. **handle: filesystem** — Serve static files from the build output when the path matches a file.
  2. **/(.*)** → **/index.html** — SPA fallback.

With **@vercel/static** and `dist/**`, Vercel serves the contents of `dist/` at the **site root**. So `dist/index.html` is served as **`/index.html`**, and `dist/assets/...` as **`/assets/...`**. The fallback must be **`/index.html`** (not `/dist/index.html`). The client uses **base: "/"** so asset URLs in the built HTML match.

No `/api` rewrite is needed: the catch-all ensures all `/api` and `/api/*` requests hit the function.

**Build log warning:** You may see *"Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply."* That is **expected**. When `vercel.json` defines `builds` (and `routes`), Vercel uses only the config file for build/output; the Project Settings → Build & Development Settings in the UI are ignored. No action needed.

## Build steps (must exist)

`npm run build` is used as the Vercel build command. It **must**:

1. **Build shared** — `npm run build -w shared` (needed by server).
2. **Build server** — `npm run build -w server` → produces `server/dist/`.
3. **Copy server into api** — `npm run build:vercel-api` → copies `server/dist` → `api/server-dist`. Required so the API handler can `import "./server-dist/index.js"` and the function bundle contains the Express app.
4. **Build client** — `npm run build -w client` → produces `client/dist/`.
5. **Copy client to root dist** — `npm run build:vercel` → copies `client/dist` → `dist/`. Vercel serves this as static.

Root `package.json` scripts:

- **build** — Runs the five steps above in that order.
- **build:vercel-api** — Copies `server/dist` → `api/server-dist`.
- **build:vercel** — Copies `client/dist` → `dist`.

## Health and routes endpoints

- **GET /api/health** returns JSON: `{ "ok": true, "timestamp": "<ISO string>" }`.
- **GET /api/routes** returns a JSON array of known route prefixes (e.g. `["/api/health", "/api/workflows", "/api/study-projects", ...]`). Handled in the catch-all before loading Express so it works even if the Express bundle fails.
- The catch-all responds to both **before** loading Express, so you can confirm the function is invoked even if the Express bundle fails.
- The Express app also exposes **GET /api/health** with the same shape when the full app is loaded.

Use **/api/health** and **/api/routes** to validate that the API function is deployed and reachable.

## How to validate

After deploying:

1. **Vercel dashboard** — In the deployment, open the **Functions** tab. You should see **one** function: **api/[[...path]]**. If you see extra "functions" (e.g. server-dist.d.ts), type declarations belong in **server/types/**; if the function is missing, check build or root directory.
2. **SPA** — Visit **`/`** and **`/index.html`**; both should serve the app. If `/index.html` works but `/` 404s, the fallback is wrong (`dest: "/index.html"`). If `/index.html` 404s, `dist/` or static config is wrong.
3. **Assets** — Open any asset URL from the HTML (e.g. `/assets/index-….js`); should return 200.
4. **Health** — Open `https://<your-deployment>/api/health`. You should get `200` and JSON `{ "ok": true, "timestamp": "..." }`. If you get 404, the catch-all is not deployed or not receiving the request.
5. **Routes list** — Open `https://<your-deployment>/api/routes`. You should get `200` and a JSON array of route prefixes.
6. **API route** — Call a known route, e.g. `GET https://<your-deployment>/api/study-projects` with a valid `Authorization: Bearer <token>`. It should return 200 (or 401 if auth is missing), not 404.

**Local build verification:** Run `npm run build && npm run smoke:vercel` to ensure `dist/index.html` and `api/server-dist/index.js` exist after build.

## Test the build locally

After `npm run build` you can test the built app in two ways:

1. **Smoke only (no server)**  
   `npm run smoke:vercel` — Confirms build artifacts exist. Does not run the app.

2. **Full local test (SPA + API, like production)**  
   From the **repo root**, run:
   ```bash
   npm run build && vercel dev
   ```
   (Requires [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`.)  
   `vercel dev` serves your built `dist/` and runs the `api/[[...path]]` function locally so `/` and `/api/*` behave like production. Open the URL it prints (e.g. `http://localhost:3000`).

3. **SPA only (no API)**  
   `npx serve dist -p 4173` — Serves the built SPA at `http://localhost:4173`. API calls to `/api` will 404 because there is no server; use this only to check static build/UI.

**Recommendation:** Use `npm run build && vercel dev` to test the full stack before pushing.

## Common pitfalls

- **Build order** — If `api/server-dist` is missing, the function will fail at runtime when it tries to load `./server-dist/index.js`. Ensure `build:vercel-api` runs **after** `npm run build -w server` and **before** the Vercel build step that packages the function.
- **outputDirectory only** — Using only `outputDirectory: "dist"` without explicit **builds** for the API can lead to the API not being deployed as a function. The config in this repo uses **builds** and **routes** so both static and the API are defined.
- **Catch-all** — Using **api/[[...path]].ts** avoids rewrite/`?path=` issues: Vercel routes `/api` and `/api/*` to the function and `req.url` is already the full path.
- **Env vars** — Set **SUPABASE_URL**, **SUPABASE_JWT_SECRET** (or **SUPABASE_ANON_KEY** if used), **OPENAI_API_KEY**, etc. in **Project Settings → Environment Variables**. Missing env can cause the function or Express to fail after health.
- **SPA 404 for `/`** — If `/` 404s but `/index.html` works, the fallback route is wrong: it must be **`dest: "/index.html"`**, not `/dist/index.html`. With `dist/**` and `@vercel/static`, files are served at the root.
- **Extra “functions” in Vercel** — Only **api/[[...path]].ts** should be a function. Do not use `api/**/*.ts` (that can pick up other files). Type declarations must live **outside** `api/` (e.g. **server/types/server-dist.d.ts**) so Vercel does not treat them as functions.
- **Output Directory in UI** — In Project Settings → Build & Development Settings, leave **Output Directory** blank. If set (e.g. to `dist`), it can force static-only mode and break custom routing.

## Local vs production

- **Local:** `npm run dev` runs the Vite dev server (proxies `/api` to the Express server) and the Express server on port 3000. No `vercel.json` routes; the app talks to Express directly.
- **Production:** The browser gets the SPA at `/` (fallback to `/index.html`) and static assets at `/assets/...` (from `dist/` at root); `/api` and `/api/*` are routed by Vercel to the **api/[[...path]].ts** catch-all, which loads Express from `api/server-dist` and handles the request.

---

## Quick “how to verify” checklist

- [ ] **Vercel deployment** shows a Function for **api/[[...path]]** (or similar) in the deployment’s Functions tab.
- [ ] **/** and **/index.html** load the SPA.
- [ ] **GET /api/health** in production returns **200** and JSON `{ "ok": true, "timestamp": "..." }`.
- [ ] **GET /api/routes** in production returns **200** and a JSON array of route prefixes.
- [ ] A known route such as **GET /api/study-projects** (with valid auth headers) responds (200 or 401), not 404.
