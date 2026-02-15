/**
 * Local dev entry: start the Express server. Vercel uses the app via api/index.ts instead.
 */
import "./env.js";
import { app, PORT } from "./index.js";

const hasAuth =
  Boolean(process.env.SUPABASE_URL?.trim()) || Boolean(process.env.SUPABASE_JWT_SECRET?.trim());
console.log(`Auth: ${hasAuth ? "configured (JWKS and/or JWT secret)" : "not configured (set SUPABASE_URL or SUPABASE_JWT_SECRET)"}`);

app.listen(Number(PORT), () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
