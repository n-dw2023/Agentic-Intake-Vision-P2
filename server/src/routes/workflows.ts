import { Router, Request, Response } from "express";
import { generateWorkflowFromPrompt } from "../generateWorkflow.js";
import { refineWorkflow } from "../refineWorkflow.js";
import { executeWorkflow } from "../runWorkflow.js";
import {
  insertWorkflow,
  insertWorkflowVersion,
  getWorkflowOwnerId,
  getWorkflowVersion,
  insertRunHistory,
  listWorkflows,
  getWorkflowWithVersion,
  listWorkflowVersions,
  updateWorkflowName,
  deleteWorkflow,
} from "../supabase.js";
import { validateWorkflow } from "shared";

export const workflowsRouter = Router();

/** Get user id from header (Story 6 will replace with Supabase Auth JWT). */
function getUserId(req: Request): string | null {
  const id = req.headers["x-user-id"];
  if (typeof id === "string" && id.length > 0) return id;
  return null;
}

workflowsRouter.get("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  try {
    const workflows = await listWorkflows(userId);
    res.status(200).json({
      workflows: workflows.map((w) => ({
        id: w.id,
        name: w.name ?? "Untitled workflow",
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list workflows";
    res.status(502).json({ error: message, code: "LIST_FAILED" });
  }
});

workflowsRouter.patch("/:workflowId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const workflowId = typeof req.params.workflowId === "string" ? req.params.workflowId : req.params.workflowId?.[0] ?? "";
  if (!workflowId) {
    res.status(400).json({ error: "workflowId required" });
    return;
  }
  let name: string;
  try {
    const body = req.body as { name?: unknown };
    if (body == null || typeof body.name !== "string") {
      res.status(400).json({ error: "Body must be { name: string }" });
      return;
    }
    name = body.name.trim();
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  try {
    const ok = await updateWorkflowName(workflowId, userId, name);
    if (!ok) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    res.status(200).json({ name: name || "Untitled workflow" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update name";
    res.status(502).json({ error: message, code: "UPDATE_FAILED" });
  }
});

workflowsRouter.delete("/:workflowId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const workflowId = typeof req.params.workflowId === "string" ? req.params.workflowId : req.params.workflowId?.[0] ?? "";
  if (!workflowId) {
    res.status(400).json({ error: "workflowId required" });
    return;
  }
  try {
    const ok = await deleteWorkflow(workflowId, userId);
    if (!ok) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete workflow";
    res.status(502).json({ error: message, code: "DELETE_FAILED" });
  }
});

workflowsRouter.get("/:workflowId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const workflowId = typeof req.params.workflowId === "string" ? req.params.workflowId : req.params.workflowId?.[0] ?? "";
  if (!workflowId) {
    res.status(400).json({ error: "workflowId required" });
    return;
  }
  try {
    const wf = await getWorkflowWithVersion(workflowId, userId);
    if (!wf) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    res.status(200).json({
      id: wf.id,
      name: wf.name,
      versionId: wf.versionId,
      workflow: wf.workflow,
      uiSpec: wf.uiSpec,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get workflow";
    res.status(502).json({ error: message, code: "GET_FAILED" });
  }
});

workflowsRouter.get("/:workflowId/versions", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const workflowId = typeof req.params.workflowId === "string" ? req.params.workflowId : req.params.workflowId?.[0] ?? "";
  if (!workflowId) {
    res.status(400).json({ error: "workflowId required" });
    return;
  }
  const ownerId = await getWorkflowOwnerId(workflowId);
  if (ownerId !== userId) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  try {
    const versions = await listWorkflowVersions(workflowId);
    res.status(200).json({
      versions: versions.map((v) => ({ id: v.id, createdAt: v.created_at })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list versions";
    res.status(502).json({ error: message, code: "LIST_VERSIONS_FAILED" });
  }
});

workflowsRouter.get("/:workflowId/versions/:versionId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const workflowId = typeof req.params.workflowId === "string" ? req.params.workflowId : req.params.workflowId?.[0] ?? "";
  const versionId = typeof req.params.versionId === "string" ? req.params.versionId : req.params.versionId?.[0] ?? "";
  if (!workflowId || !versionId) {
    res.status(400).json({ error: "workflowId and versionId required" });
    return;
  }
  try {
    const wf = await getWorkflowWithVersion(workflowId, userId, versionId);
    if (!wf) {
      res.status(404).json({ error: "Workflow or version not found" });
      return;
    }
    res.status(200).json({
      id: wf.id,
      name: wf.name,
      versionId: wf.versionId,
      workflow: wf.workflow,
      uiSpec: wf.uiSpec,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get workflow";
    res.status(502).json({ error: message, code: "GET_FAILED" });
  }
});

workflowsRouter.post("/generate", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }

  let prompt: string;
  try {
    const body = req.body as { prompt?: unknown };
    if (body == null || typeof body.prompt !== "string") {
      res.status(400).json({ error: "Body must be { prompt: string }" });
      return;
    }
    prompt = body.prompt.trim();
    if (!prompt) {
      res.status(400).json({ error: "prompt must be non-empty" });
      return;
    }
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  try {
    const { workflow, uiSpec } = await generateWorkflowFromPrompt(prompt);
    const { workflowId, versionId } = await insertWorkflow(
      userId,
      null,
      workflow,
      uiSpec
    );
    res.status(200).json({
      workflowId,
      versionId,
      workflow,
      uiSpec,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    const isValidation = message.includes("Invalid workflow") || message.includes("Invalid uiSpec");
    res.status(502).json({
      error: message,
      code: isValidation ? "VALIDATION_FAILED" : "GENERATION_FAILED",
    });
  }
});

workflowsRouter.post("/:workflowId/refine", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const rawId = req.params.workflowId;
  const workflowId = typeof rawId === "string" ? rawId : rawId?.[0] ?? "";
  if (!workflowId) {
    res.status(400).json({ error: "workflowId required" });
    return;
  }
  const ownerId = await getWorkflowOwnerId(workflowId);
  if (ownerId !== userId) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  let body: { versionId?: string; workflow?: unknown; uiSpec?: unknown; message?: string };
  try {
    body = req.body as typeof body;
    if (body == null || typeof body.workflow !== "object" || typeof body.uiSpec !== "object" || typeof body.message !== "string") {
      res.status(400).json({ error: "Body must be { versionId?, workflow, uiSpec, message: string }" });
      return;
    }
    if (!body.message.trim()) {
      res.status(400).json({ error: "message must be non-empty" });
      return;
    }
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  try {
    const { workflow, uiSpec } = await refineWorkflow(
      body.workflow as import("shared").WorkflowDefinition,
      body.uiSpec as import("shared").UiSpec,
      body.message.trim()
    );
    res.status(200).json({ proposedWorkflow: workflow, proposedUiSpec: uiSpec });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refinement failed";
    res.status(502).json({ error: message, code: "REFINEMENT_FAILED" });
  }
});

workflowsRouter.post("/:workflowId/versions", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const rawId = req.params.workflowId;
  const workflowId = typeof rawId === "string" ? rawId : rawId?.[0] ?? "";
  if (!workflowId) {
    res.status(400).json({ error: "workflowId required" });
    return;
  }
  const ownerId = await getWorkflowOwnerId(workflowId);
  if (ownerId !== userId) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  let body: { workflow?: unknown; uiSpec?: unknown };
  try {
    body = req.body as typeof body;
    if (body == null || typeof body.workflow !== "object" || typeof body.uiSpec !== "object") {
      res.status(400).json({ error: "Body must be { workflow, uiSpec }" });
      return;
    }
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  try {
    const { versionId } = await insertWorkflowVersion(
      workflowId,
      body.workflow,
      body.uiSpec
    );
    res.status(200).json({
      versionId,
      workflow: body.workflow,
      uiSpec: body.uiSpec,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save version";
    res.status(502).json({ error: message, code: "PERSIST_FAILED" });
  }
});

workflowsRouter.post("/:workflowId/versions/:versionId/run", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const workflowId = typeof req.params.workflowId === "string" ? req.params.workflowId : req.params.workflowId?.[0] ?? "";
  const versionId = typeof req.params.versionId === "string" ? req.params.versionId : req.params.versionId?.[0] ?? "";
  if (!workflowId || !versionId) {
    res.status(400).json({ error: "workflowId and versionId required" });
    return;
  }
  const ownerId = await getWorkflowOwnerId(workflowId);
  if (ownerId !== userId) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  const version = await getWorkflowVersion(workflowId, versionId);
  if (!version) {
    res.status(404).json({ error: "Version not found" });
    return;
  }
  const workflowResult = validateWorkflow(version.workflowDefinition);
  if (!workflowResult.success) {
    res.status(400).json({ error: "Invalid workflow definition", code: "VALIDATION_FAILED" });
    return;
  }
  const workflow = workflowResult.data;

  let documentText: string;
  const body = req.body as { document?: unknown };
  if (body?.document != null && typeof body.document === "string") {
    documentText = body.document.trim();
  } else {
    res.status(400).json({ error: "Body must be { document: string } with the document text" });
    return;
  }
  if (!documentText) {
    res.status(400).json({ error: "document must be non-empty" });
    return;
  }

  try {
    const results = await executeWorkflow(workflow, documentText);
    try {
      await insertRunHistory(workflowId, versionId, userId, "success", results);
    } catch {
      // run_history optional; ignore insert failure
    }
    res.status(200).json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workflow run failed";
    const isRateLimit = message.includes("429") || message.toLowerCase().includes("rate");
    res.status(502).json({
      error: isRateLimit ? "OpenAI rate limit exceeded; try again shortly." : message,
      code: "RUN_FAILED",
    });
  }
});
