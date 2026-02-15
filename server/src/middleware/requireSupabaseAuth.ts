/**
 * Require valid Supabase Auth JWT (Bearer token).
 * Verifies using JWKS (Supabase asymmetric signing keys) from SUPABASE_URL – no JWT Secret or Key Id needed.
 * Optional: SUPABASE_JWT_SECRET for legacy symmetric (HS256) projects; use the full JWT Secret, not the Key Id.
 */
import { Request, Response, NextFunction } from "express";
import * as jose from "jose";

const AUTH_HEADER = "authorization";
const BEARER_PREFIX = "Bearer ";

function getJwksUrl(): URL | null {
  const base = process.env.SUPABASE_URL?.trim();
  if (!base) return null;
  const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
  return new URL(`${normalized}/auth/v1/.well-known/jwks.json`);
}

async function verifyToken(token: string): Promise<{ sub: string } | null> {
  const jwksUrl = getJwksUrl();
  if (jwksUrl) {
    try {
      const JWKS = jose.createRemoteJWKSet(jwksUrl);
      const { payload } = await jose.jwtVerify(token, JWKS);
      const sub = payload.sub;
      if (sub && typeof sub === "string") return { sub };
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth] JWKS verification failed:", (err as Error).message);
      }
    }
  }
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (secret) {
    try {
      const key = new TextEncoder().encode(secret);
      const { payload } = await jose.jwtVerify(token, key);
      const sub = payload.sub;
      if (sub && typeof sub === "string") return { sub };
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth] JWT secret verification failed:", (err as Error).message);
      }
    }
  }
  return null;
}

export function requireSupabaseAuth(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers[AUTH_HEADER];
  const token =
    typeof raw === "string" && raw.startsWith(BEARER_PREFIX)
      ? raw.slice(BEARER_PREFIX.length).trim()
      : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!getJwksUrl() && !process.env.SUPABASE_JWT_SECRET?.trim()) {
    res.status(503).json({ error: "Auth not configured (set SUPABASE_URL or SUPABASE_JWT_SECRET)" });
    return;
  }
  (async () => {
    try {
      const result = await verifyToken(token);
      if (!result) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      (req as Request & { authUserId?: string }).authUserId = result.sub;
      req.headers["x-user-id"] = result.sub;
      next();
    } catch {
      if (!res.headersSent) res.status(401).json({ error: "Unauthorized" });
    }
  })().catch(() => {
    if (!res.headersSent) res.status(401).json({ error: "Unauthorized" });
  });
}
