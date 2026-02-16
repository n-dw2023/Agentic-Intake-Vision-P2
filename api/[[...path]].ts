/**
 * Catch-all API handler: Vercel routes /api and /api/* here automatically.
 * No rewrite with ?path= needed; req.url is already the full path (e.g. /api/study-projects).
 * Build step build:vercel-api copies server/dist → api/server-dist so the bundle is self-contained.
 * req.url is passed through unchanged to Express because all Express routes are mounted under /api.
 */
/// <reference path="../server/types/server-dist.d.ts" />
import { app } from "./server-dist/index.js";

const KNOWN_ROUTES = [
  "/api/health",
  "/api/routes",
  "/api/workflows",
  "/api/protocols",
  "/api/study-projects",
  "/api/prompts",
];

function sendJson(res: import("http").ServerResponse, status: number, data: unknown) {
  res.setHeader("Content-Type", "application/json");
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

export default function handler(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  const url = req.url || "";
  const method = req.method || "GET";

  if (process.env.DEBUG_API === "1") {
    console.log(`[api] ${method} ${url}`);
  }

  // Health: respond without loading Express so deployment can be validated
  if (url === "/api/health" || url.startsWith("/api/health?")) {
    sendJson(res, 200, { ok: true, timestamp: new Date().toISOString() });
    return;
  }

  // Routes list: discoverable list of API route prefixes (handler-level so it works even if Express fails to load)
  if (url === "/api/routes" || url.startsWith("/api/routes?")) {
    sendJson(res, 200, KNOWN_ROUTES);
    return;
  }

  // Only forward paths under /api (normalize: some platforms may pass path without prefix)
  const pathname = url.split("?")[0] || "";
  if (!pathname.startsWith("/api")) {
    sendJson(res, 404, { error: "Not Found", path: pathname });
    return;
  }

  // Forward to Express with req.url unchanged (Express routes are mounted at /api)
  try {
    return app(req, res);
  } catch (err) {
    if (process.env.DEBUG_API === "1") {
      console.error("[api] Express error", err);
    }
    sendJson(res, 503, {
      error: "API temporarily unavailable",
      timestamp: new Date().toISOString(),
    });
  }
}
