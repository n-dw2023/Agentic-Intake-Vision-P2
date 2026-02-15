/**
 * Vercel serverless entry: routes send /api/* to this handler with ?path=<segment>.
 * We restore req.url to /api/<path> and delegate to the Express app in api/server-dist.
 * Build step build:vercel-api copies server/dist → api/server-dist so the bundle is self-contained.
 */
import { app } from "./server-dist/index.js";

function handler(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  const raw = req.url || "";
  const qIdx = raw.indexOf("?");
  const query = qIdx >= 0 ? raw.slice(qIdx + 1) : "";
  const params = new URLSearchParams(query);
  const pathSeg = params.get("path") ?? "";

  // Health check: respond without loading Express so deployment can be validated
  if (pathSeg === "health") {
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
    return;
  }

  if (pathSeg) {
    params.delete("path");
    const newQs = params.toString() ? "?" + params.toString() : "";
    req.url = "/api/" + pathSeg + newQs;
  } else if (raw.startsWith("/api") && qIdx < 0) {
    req.url = "/api";
  }
  return app(req, res);
}

export default handler;
