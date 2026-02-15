# Vercel deployment

## Output directory

The build copies the client output to a root **`dist`** so Vercel finds it:

- **buildCommand:** `npm run build` (builds shared → server → client, then copies `client/dist` → `dist`)
- **outputDirectory:** `dist`
- **installCommand:** `npm install`

The root `package.json` script `build:vercel` runs after the client build and copies `client/dist` into `dist/` at the repo root.

## API (Express)

All `/api/*` requests are rewritten to **`/api?path=$1`** so they hit the single handler **`api/index.ts`**. That handler restores `req.url` to `/api/<path>` (e.g. `/api/study-projects`) before passing the request to the Express app. The app is imported from **`./server-dist/index.js`** inside the `api/` folder so the function bundle is self-contained.

**Build:** The **`build:vercel-api`** script (run after `npm run build -w server`) copies **`server/dist` → `api/server-dist`**. That way the serverless function has the full Express app inside `api/` and Vercel’s bundler includes it. Without this copy, the function would import from `../server/dist`, which is not included in the deployment, and you get 404 for `/api/study-projects`, `/api/workflows`, etc.

## If you still see "No Output Directory named 'dist' found"

1. **Use the repo root**  
   **Project Settings → General → Root Directory** should be **empty** (or `.`).

2. **Use vercel.json**  
   In **Build & Development Settings**, leave **Output Directory** empty so `vercel.json`’s `outputDirectory: "dist"` is used.

3. **Ensure the build succeeds**  
   If the build fails, `dist` is never created. Check build logs and set env vars (e.g. `SUPABASE_URL`, `OPENAI_API_KEY`) in **Project Settings → Environment Variables**.
