/**
 * API server for Agent Config.
 */
import "./env.js";
import express from "express";
import cookieParser from "cookie-parser";
import { requireSession } from "./middleware/requireSession.js";
import { authRouter } from "./routes/auth.js";
import { workflowsRouter } from "./routes/workflows.js";
import { protocolsRouter } from "./routes/protocols.js";
import { studyProjectsRouter } from "./routes/studyProjects.js";
import { promptsRouter } from "./routes/prompts.js";

const PORT = process.env.PORT ?? 3000;
const app = express();

// Allow large document payloads for POST .../run (protocol uploads)
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

// Session gate: all /api/* except health and auth require valid session (Story 3)
app.use((req, res, next) => {
  if (!req.path?.startsWith("/api")) return next();
  if (req.path === "/api/health") return next();
  if (req.path.startsWith("/api/auth")) return next();
  requireSession(req, res, next);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/workflows", workflowsRouter);
app.use("/api/protocols", protocolsRouter);
app.use("/api/study-projects", studyProjectsRouter);
app.use("/api/prompts", promptsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
