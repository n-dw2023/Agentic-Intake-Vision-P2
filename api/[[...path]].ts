/**
 * Vercel catch-all: handles /api and /api/* so all API requests reach the Express app.
 * Build must run first so server/dist exists (npm run build).
 */
// @ts-ignore - built output; path is correct at deploy time
import { app } from "../server/dist/index.js";
export default app;
