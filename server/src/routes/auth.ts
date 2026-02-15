/**
 * Entry password auth: shared password from env, session-only cookie.
 * Used by password-protect-entry spec (Story 2). Route protection in Story 3.
 */
import { randomBytes } from "crypto";
import { Request, Response, Router } from "express";

const SESSION_COOKIE_NAME = "app_session";

type SessionEntry = { createdAt: number };
const sessionStore = new Map<string, SessionEntry>();

function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

export function getSessionId(req: Request): string | null {
  const id = req.cookies?.[SESSION_COOKIE_NAME];
  if (!id || typeof id !== "string") return null;
  const entry = sessionStore.get(id);
  if (!entry) return null;
  return id;
}

export const authRouter = Router();

authRouter.post("/login", (req: Request, res: Response) => {
  const password = process.env.APP_ENTRY_PASSWORD;
  if (!password) {
    res.status(503).json({ error: "Auth not configured" });
    return;
  }
  const body = req.body as { password?: string };
  const submitted = typeof body?.password === "string" ? body.password : "";
  if (submitted !== password) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const sessionId = generateSessionId();
  sessionStore.set(sessionId, { createdAt: Date.now() });
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ ok: true });
});

authRouter.get("/session", (req: Request, res: Response) => {
  if (getSessionId(req)) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

authRouter.post("/logout", (req: Request, res: Response) => {
  const id = req.cookies?.[SESSION_COOKIE_NAME];
  if (id) sessionStore.delete(id);
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.status(200).json({ ok: true });
});
