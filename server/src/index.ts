/**
 * API server for Agent Config.
 */
import "./env.js";
import express from "express";
import { requireSupabaseAuth } from "./middleware/requireSupabaseAuth.js";
import { workflowsRouter } from "./routes/workflows.js";
import { protocolsRouter } from "./routes/protocols.js";
import { studyProjectsRouter } from "./routes/studyProjects.js";
import { promptsRouter } from "./routes/prompts.js";

const app = express();

// Allow large document payloads for POST .../run (protocol uploads)
app.use(express.json({ limit: "15mb" }));

// Supabase Auth: all /api/* except health require valid Bearer JWT
app.use((req, res, next) => {
  if (!req.path?.startsWith("/api")) return next();
  if (req.path === "/api/health") return next();
  requireSupabaseAuth(req, res, next);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/workflows", workflowsRouter);
app.use("/api/protocols", protocolsRouter);
app.use("/api/study-projects", studyProjectsRouter);
app.use("/api/prompts", promptsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

export { app };
export const PORT = process.env.PORT ?? 3000;
