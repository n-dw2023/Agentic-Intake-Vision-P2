# Vercel deployment

This project deploys to Vercel as a **single project**: a Vite SPA served from **dist/** and a Node serverless function at **api/index.ts** that runs the Express app. The `vercel.json` uses **version 2** with explicit **builds** and **routes** so both the static output and the API function are deployed correctly.

## What vercel.json does

- **buildCommand** / **installCommand**  
  Run before the build phase. `npm run build` must produce both `dist/` and `api/server-dist/` (see below).

- **builds**
  - **api/index.ts** with **@vercel/node** — Builds the serverless function. The handler imports the Express app from `./server-dist/index.js`; that directory is under `api/` so it is included in the function bundle.
  - **dist/** with **@vercel/static** — Treats the contents of `dist/` as static assets (CDN).

- **routes**
  1. **/api/(.*)** → **/api?path=$1** — Sends all `/api/*` requests to the API function with the path segment in the `path` query param. The handler restores `req.url` to `/api/<path>` and passes the request to Express.
  2. **handle: filesystem** — Serve static files from the build output when the path matches a file.
  3. **/(.*)** → **/dist/index.html** — SPA fallback: any other request serves the client `index.html`.

So: API requests hit the Node function; static assets and the SPA are served from `dist/`.

## Build steps (must exist)

`npm run build` is used as the Vercel build command. It **must**:

1. **Build shared** — `npm run build -w shared` (needed by server).
2. **Build server** — `npm run build -w server` → produces `server/dist/`.
3. **Copy server into api** — `npm run build:vercel-api` → copies `server/dist` → `api/server-dist`. Required so `api/index.ts` can `import "./server-dist/index.js"` and the function bundle contains the Express app.
4. **Build client** — `npm run build -w client` → produces `client/dist/`.
5. **Copy client to root dist** — `npm run build:vercel` → copies `client/dist` → `dist/`. Vercel serves this as static.

Root `package.json` scripts:

- **build** — Runs the five steps above in that order.
- **build:vercel-api** — Copies `server/dist` → `api/server-dist`.
- **build:vercel** — Copies `client/dist` → `dist`.

## Health endpoint

- **GET /api/health** returns JSON: `{ "ok": true, "timestamp": "<ISO string>" }`.
- The handler in **api/index.ts** responds to `path=health` **before** loading Express, so you can confirm the function is invoked even if the Express bundle fails.
- The Express app also exposes **GET /api/health** with the same shape when the full app is loaded.

Use **/api/health** to validate that the API function is deployed and reachable.

## How to validate

After deploying:

1. **Vercel dashboard** — In the deployment, open the **Functions** (or **Serverless Functions**) tab. You should see a function for **api/index** (or **api/index.ts**). If it’s missing, the build or route config is wrong.
2. **Health** — Open `https://<your-deployment>/api/health` in a browser or with `curl`. You should get `200` and JSON `{ "ok": true, "timestamp": "..." }`. If you get 404, the route to the API function is not applied or the function is not deployed.
3. **API route** — Call a known route, e.g. `GET https://<your-deployment>/api/study-projects` with a valid `Authorization: Bearer <token>` (and optionally `x-user-id`). It should return 200 (or 401 if auth is missing), not 404. If it’s 404, the request is not reaching the function or path restoration is wrong.

## Common pitfalls

- **Build order** — If `api/server-dist` is missing, the function will fail at runtime when it tries to load `./server-dist/index.js`. Ensure `build:vercel-api` runs **after** `npm run build -w server` and **before** the Vercel build step that packages the function.
- **outputDirectory only** — Using only `outputDirectory: "dist"` without explicit **builds** for the API can lead to the API not being deployed as a function. The config in this repo uses **builds** and **routes** so both static and the API are defined.
- **Route dest** — The route for `/api/(.*)` must send to the API with the path (e.g. `dest: "/api?path=$1"`). The handler must set `req.url` to `/api/<path>` so Express sees the same paths as in local dev.
- **Env vars** — Set **SUPABASE_URL**, **SUPABASE_JWT_SECRET** (or **SUPABASE_ANON_KEY** if used), **OPENAI_API_KEY**, etc. in **Project Settings → Environment Variables**. Missing env can cause the function or Express to fail after health.

## Local vs production

- **Local:** `npm run dev` runs the Vite dev server (proxies `/api` to the Express server) and the Express server on port 3000. No `vercel.json` routes; the app talks to Express directly.
- **Production:** The browser gets the SPA and static assets from `dist/`; `/api/*` is routed by Vercel to the **api/index.ts** function, which loads Express from `api/server-dist` and handles the request.

---

## Quick “how to verify” checklist

- [ ] **Vercel deployment** shows a Function for **api/index** (or api/index.ts) in the deployment’s Functions tab.
- [ ] **GET /api/health** in production returns **200** and JSON `{ "ok": true, "timestamp": "..." }`.
- [ ] A known route such as **GET /api/study-projects** (with valid auth headers) no longer returns **404** (e.g. 200 with data or 401 if unauthenticated).
