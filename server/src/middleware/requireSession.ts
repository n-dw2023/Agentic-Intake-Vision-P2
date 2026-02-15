/**
 * Session gate for password-protect-entry (Story 3).
 * Returns 401 if request has no valid session cookie; otherwise next().
 */
import { Request, Response, NextFunction } from "express";
import { getSessionId } from "../routes/auth.js";

export function requireSession(req: Request, res: Response, next: NextFunction): void {
  if (getSessionId(req)) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}
