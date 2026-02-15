/**
 * Vercel serverless entry: all /api/* are rewritten to /api?path=... so this handler receives them.
 * We restore the path so the Express app can route correctly.
 * Build copies server/dist → api/server-dist so this function is self-contained (see build:vercel-api).
 */
import { app } from "./server-dist/index.js";

function handler(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  const raw = req.url || "";
  const qIdx = raw.indexOf("?");
  const pathOnly = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const query = qIdx >= 0 ? raw.slice(qIdx + 1) : "";
  const params = new URLSearchParams(query);
  const pathSeg = params.get("path") ?? "";
  if (pathSeg) {
    params.delete("path");
    const newQs = params.toString() ? "?" + params.toString() : "";
    req.url = "/api/" + pathSeg + newQs;
  } else if (pathOnly === "/api" && !query) {
    req.url = "/api";
  }
  return app(req, res);
}

export default handler;
