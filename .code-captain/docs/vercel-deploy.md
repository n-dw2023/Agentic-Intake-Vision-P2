# Vercel deployment

## Output directory

The build copies the client output to a root **`dist`** so Vercel finds it:

- **buildCommand:** `npm run build` (builds shared → server → client, then copies `client/dist` → `dist`)
- **outputDirectory:** `dist`
- **installCommand:** `npm install`

The root `package.json` script `build:vercel` runs after the client build and copies `client/dist` into `dist/` at the repo root.

## API (Express)

All `/api/*` requests are rewritten to **`/api?path=$1`** so they hit the single handler **`api/index.ts`**. That handler restores `req.url` to `/api/<path>` (e.g. `/api/study-projects`) before passing the request to the Express app from `server/dist/index.js`, so Express routing works. The build must complete so `server/dist` exists before deploy.

**Why production 404s while local works:** Locally, the dev server runs Express directly and the client proxies `/api` to it. On Vercel, `api/index.ts` is a serverless function that imports `../server/dist/index.js`. Vercel’s bundler does not automatically include that path, so the function can fail to load and return 404. **`vercel.json`** therefore sets **`functions["api/index.ts"].includeFiles": "server/dist/**"`** so the server build output is included in the function deployment.

## If you still see "No Output Directory named 'dist' found"

1. **Use the repo root**  
   **Project Settings → General → Root Directory** should be **empty** (or `.`).

2. **Use vercel.json**  
   In **Build & Development Settings**, leave **Output Directory** empty so `vercel.json`’s `outputDirectory: "dist"` is used.

3. **Ensure the build succeeds**  
   If the build fails, `dist` is never created. Check build logs and set env vars (e.g. `SUPABASE_URL`, `OPENAI_API_KEY`) in **Project Settings → Environment Variables**.
