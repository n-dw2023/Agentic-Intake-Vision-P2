# Vercel deployment

## Output directory

The build copies the client output to a root **`dist`** so Vercel finds it:

- **buildCommand:** `npm run build` (builds shared → server → client, then copies `client/dist` → `dist`)
- **outputDirectory:** `dist`
- **installCommand:** `npm install`

The root `package.json` script `build:vercel` runs after the client build and copies `client/dist` into `dist/` at the repo root.

## API (Express)

All `/api/*` requests are handled by the Express app via a catch-all: **`api/[[...path]].ts`** imports `server/dist/index.js`. The rewrite in `vercel.json` sends `/api/(.*)` to `/api/$1` so the full path is preserved and Express routes (e.g. `/api/study-projects`, `/api/workflows`) match correctly. The build must complete so `server/dist` exists before deploy.

## If you still see "No Output Directory named 'dist' found"

1. **Use the repo root**  
   **Project Settings → General → Root Directory** should be **empty** (or `.`).

2. **Use vercel.json**  
   In **Build & Development Settings**, leave **Output Directory** empty so `vercel.json`’s `outputDirectory: "dist"` is used.

3. **Ensure the build succeeds**  
   If the build fails, `dist` is never created. Check build logs and set env vars (e.g. `SUPABASE_URL`, `OPENAI_API_KEY`) in **Project Settings → Environment Variables**.
