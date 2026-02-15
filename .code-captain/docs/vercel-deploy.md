# Vercel deployment

## Output directory

The app is a monorepo: the **client** (Vite) builds to **`client/dist`**. `vercel.json` sets:

- **outputDirectory:** `client/dist`
- **buildCommand:** `npm run build` (builds shared → server → client)
- **installCommand:** `npm install`

## If you see "No Output Directory named 'dist' found"

1. **Use the repo root as the project root**  
   In Vercel: **Project Settings → General → Root Directory** should be **empty** (or `.`).  
   Do **not** set Root Directory to `client`. If it’s `client`, Vercel looks for `dist` inside `client` and can’t find `client/dist` from the repo root.

2. **Let vercel.json set the output**  
   In **Project Settings → Build & Development Settings**, leave **Output Directory** empty so `vercel.json`’s `outputDirectory: "client/dist"` is used.  
   If you set Output Directory to `dist`, change it to **`client/dist`** or clear it.

3. **Ensure the build succeeds**  
   If the build fails (e.g. missing env, or shared package not built), `client/dist` is never created. Check the build logs and set required env vars (e.g. `SUPABASE_URL`, `OPENAI_API_KEY`) in **Project Settings → Environment Variables**.
