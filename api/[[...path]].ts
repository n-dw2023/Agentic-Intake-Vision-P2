/**
 * Catch-all API handler: Vercel routes /api and /api/* here automatically.
 * No rewrite with ?path= needed; req.url is already the full path (e.g. /api/study-projects).
 * Build step build:vercel-api copies server/dist → api/server-dist so the bundle is self-contained.
 */
/// <reference path="../server/types/server-dist.d.ts" />
import { app } from "./server-dist/index.js";

export default function handler(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  const url = req.url || "";

  // Health: respond without loading Express so deployment can be validated
  if (url === "/api/health" || url.startsWith("/api/health?")) {
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
    return;
  }

  // Express expects paths like /api/study-projects; req.url is already that from Vercel
  return app(req, res);
}
