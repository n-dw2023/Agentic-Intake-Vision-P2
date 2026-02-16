# Vercel deployment

This project deploys to Vercel as a **single project**: a Vite SPA served from **dist/** and a Node serverless function that runs the Express app. The API uses a **catch-all** so `/api` and `/api/*` are routed automatically with no rewrite.

## What vercel.json does

- **buildCommand** / **installCommand**  
  Run before the build phase. `npm run build` must produce both `dist/` and `api/server-dist/` (see below).

- **builds**
  - **api/[[...path]].ts** with **@vercel/node** — Catch-all API function. Vercel routes `/api` and `/api/*` to it; `req.url` is already the full path (e.g. `/api/study-projects`). The handler imports the Express app from `./server-dist/index.js` (copied by `build:vercel-api`).
  - **dist/** with **@vercel/static** — Static assets (CDN).

- **routes**
  1. **handle: filesystem** — Serve static files from the build output when the path matches a file.
  2. **/(.*)** → **/dist/index.html** — SPA fallback.

The client is built with **base: "/dist/"** in production (`client/vite.config.ts`) so that asset URLs in `index.html` (e.g. `/dist/assets/...`) match the static paths under `dist/`. Without this, the browser would request `/assets/...`, which would 404 because files are served at `/dist/assets/...`.

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

## Health endpoint

- **GET /api/health** returns JSON: `{ "ok": true, "timestamp": "<ISO string>" }`.
- The catch-all handler responds to `/api/health` **before** loading Express, so you can confirm the function is invoked even if the Express bundle fails.
- The Express app also exposes **GET /api/health** with the same shape when the full app is loaded.

Use **/api/health** to validate that the API function is deployed and reachable.

## How to validate

After deploying:

1. **Vercel dashboard** — In the deployment, open the **Functions** tab. You should see a function for **api/[[...path]]** (or similar). If it’s missing, the build or root directory is wrong.
2. **Health** — Open `https://<your-deployment>/api/health` in a browser or with `curl`. You should get `200` and JSON `{ "ok": true, "timestamp": "..." }`. If you get 404, the catch-all is not deployed or not receiving the request.
3. **API route** — Call a known route, e.g. `GET https://<your-deployment>/api/study-projects` with a valid `Authorization: Bearer <token>`. It should return 200 (or 401 if auth is missing), not 404.

## Common pitfalls

- **Build order** — If `api/server-dist` is missing, the function will fail at runtime when it tries to load `./server-dist/index.js`. Ensure `build:vercel-api` runs **after** `npm run build -w server` and **before** the Vercel build step that packages the function.
- **outputDirectory only** — Using only `outputDirectory: "dist"` without explicit **builds** for the API can lead to the API not being deployed as a function. The config in this repo uses **builds** and **routes** so both static and the API are defined.
- **Catch-all** — Using **api/[[...path]].ts** avoids rewrite/`?path=` issues: Vercel routes `/api` and `/api/*` to the function and `req.url` is already the full path.
- **Env vars** — Set **SUPABASE_URL**, **SUPABASE_JWT_SECRET** (or **SUPABASE_ANON_KEY** if used), **OPENAI_API_KEY**, etc. in **Project Settings → Environment Variables**. Missing env can cause the function or Express to fail after health.
- **SPA 404 for JS/CSS** — If the root document loads but scripts/styles return 404, the client build likely used the default base `/`. Static files live under `/dist/`, so the client must be built with **base: "/dist/"** (see `client/vite.config.ts`). Do not remove this without adjusting routes or static output.

## Local vs production

- **Local:** `npm run dev` runs the Vite dev server (proxies `/api` to the Express server) and the Express server on port 3000. No `vercel.json` routes; the app talks to Express directly.
- **Production:** The browser gets the SPA and static assets from `dist/`; `/api` and `/api/*` are routed by Vercel to the **api/[[...path]].ts** catch-all, which loads Express from `api/server-dist` and handles the request.

---

## Quick “how to verify” checklist

- [ ] **Vercel deployment** shows a Function for **api/[[...path]]** (or similar) in the deployment’s Functions tab.
- [ ] **GET /api/health** in production returns **200** and JSON `{ "ok": true, "timestamp": "..." }`.
- [ ] A known route such as **GET /api/study-projects** (with valid auth headers) no longer returns **404** (e.g. 200 with data or 401 if unauthenticated).
