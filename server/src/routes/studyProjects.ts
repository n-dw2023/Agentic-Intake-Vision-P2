/**
 * Study Project V2: Create, get, list study projects (Story 2); checklist (Story 3).
 */

import { Router, Request, Response } from "express";
import {
  getProtocolAsset,
  getExtractionResultsByProtocolAssetId,
  getExtractionResultsByStudyProjectId,
  generateStudyProjectId,
  insertStudyProject,
  insertProtocolAsset,
  insertExtractionResults,
  getStudyProject,
  listStudyProjects,
  deleteStudyProject,
  updateExtractionResultsStudyProjectId,
  insertAuditLog,
  getChecklistItems,
  getChecklistRowByItemId,
  addRevealedChecklistParent,
  upsertChecklistItem,
  insertArtifact,
  getLatestArtifactForItem,
  getIntakePayload,
  upsertIntakePayload,
} from "../supabase.js";
import { evaluateChecklist } from "../checklistEngine.js";
import { isAllowedTransition, type ChecklistStatus } from "../checklistRules.js";
import { CHECKLIST_RULES } from "../checklistRules.js";
import { generateDraftDocument } from "../artifactGenerator.js";
import { getPromptForItem } from "../agentPrompts.js";
import { DEMO_PROTOCOL_TEXT, DEMO_EXTRACTION_RESULTS, DEMO_CHECKLIST_ITEMS } from "../demoData.js";
import { isIntakeItemId } from "../intakeSchema.js";
import { buildFieldMap } from "../intakeFieldMap.js";

function getUserId(req: Request): string | null {
  const id = req.headers["x-user-id"];
  if (typeof id === "string" && id.length > 0) return id;
  return null;
}

export const studyProjectsRouter = Router();

/**
 * POST /study-projects
 * Body: { protocolAssetId, title, sponsor, interventional, cancerRelated, participatingOrgs }
 */
studyProjectsRouter.post("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }

  const {
    protocolAssetId,
    title,
    sponsor,
    interventional,
    cancerRelated,
    participatingOrgs,
  } = req.body ?? {};

  if (
    typeof protocolAssetId !== "string" ||
    typeof title !== "string" ||
    typeof sponsor !== "string" ||
    typeof interventional !== "boolean" ||
    typeof cancerRelated !== "boolean" ||
    !Array.isArray(participatingOrgs)
  ) {
    res.status(400).json({
      error:
        "Body must include protocolAssetId (string), title (string), sponsor (string), interventional (boolean), cancerRelated (boolean), participatingOrgs (string[])",
    });
    return;
  }

  const orgs = participatingOrgs.filter((o: unknown) => typeof o === "string");
  if (orgs.length !== participatingOrgs.length) {
    res.status(400).json({ error: "participatingOrgs must be an array of strings" });
    return;
  }

  try {
    const asset = await getProtocolAsset(protocolAssetId, userId);
    if (!asset) {
      res.status(404).json({ error: "Protocol asset not found" });
      return;
    }

    const extractionRows = await getExtractionResultsByProtocolAssetId(protocolAssetId);
    if (!extractionRows.length) {
      res.status(400).json({
        error: "No extraction results for this protocol; confirm extraction first",
      });
      return;
    }

    const id = await generateStudyProjectId();
    await insertStudyProject(
      userId,
      id,
      title.trim(),
      sponsor.trim(),
      interventional,
      cancerRelated,
      orgs,
      protocolAssetId
    );
    await updateExtractionResultsStudyProjectId(protocolAssetId, id);
    await insertAuditLog(id, userId, "project_created", {
      title,
      protocolAssetId,
    });

    const project = await getStudyProject(id, userId);
    if (!project) {
      res.status(500).json({ error: "Project created but could not be retrieved" });
      return;
    }

    res.status(200).json({
      id: project.id,
      title: project.title,
      sponsor: project.sponsor,
      interventional: project.interventional,
      cancerRelated: project.cancer_related,
      participatingOrgs: project.participating_orgs,
      protocolAssetId: project.protocol_asset_id,
      createdAt: project.created_at,
    });
  } catch (err) {
    console.error("Create study project error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create study project",
    });
  }
});

/**
 * POST /study-projects/demo
 * Creates a full demo study project (protocol + extraction + project + checklist seed) with hard-coded data. No LLM.
 * Keep the demo in sync when adding features (e.g. artifacts, intake payloads, new checklist fields) so it shows an end-to-end workflow.
 */
studyProjectsRouter.post("/demo", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  try {
    const { id: protocolAssetId } = await insertProtocolAsset(
      userId,
      "text/plain",
      DEMO_PROTOCOL_TEXT,
      { demo: true },
      null
    );
    await insertExtractionResults(protocolAssetId, DEMO_EXTRACTION_RESULTS);
    const projectId = await generateStudyProjectId();
    const title = String(DEMO_EXTRACTION_RESULTS.find((r) => r.field_name === "title")?.value ?? "Demo study");
    const sponsor = String(DEMO_EXTRACTION_RESULTS.find((r) => r.field_name === "sponsor")?.value ?? "Demo Sponsor");
    const interventional = DEMO_EXTRACTION_RESULTS.find((r) => r.field_name === "interventional")?.value === true;
    const cancerRelated = DEMO_EXTRACTION_RESULTS.find((r) => r.field_name === "cancer_related")?.value === true;
    const participatingOrgs = (DEMO_EXTRACTION_RESULTS.find((r) => r.field_name === "participating_orgs")?.value as string[]) ?? [];
    await insertStudyProject(
      userId,
      projectId,
      title,
      sponsor,
      interventional,
      cancerRelated,
      participatingOrgs,
      protocolAssetId
    );
    await updateExtractionResultsStudyProjectId(protocolAssetId, projectId);
    await insertAuditLog(projectId, userId, "project_created", { title, demo: true });
    for (const row of DEMO_CHECKLIST_ITEMS) {
      await upsertChecklistItem(projectId, row.itemId, {
        ...(row.status && { status: row.status }),
        ...(row.not_needed !== undefined && { not_needed: row.not_needed }),
      });
    }
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(500).json({ error: "Demo project created but could not be retrieved" });
      return;
    }
    res.status(200).json({
      id: project.id,
      title: project.title,
      sponsor: project.sponsor,
      interventional: project.interventional,
      cancerRelated: project.cancer_related,
      participatingOrgs: project.participating_orgs,
      protocolAssetId: project.protocol_asset_id,
      createdAt: project.created_at,
    });
  } catch (err) {
    console.error("Demo study project error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create demo project",
    });
  }
});

/**
 * GET /study-projects
 */
studyProjectsRouter.get("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }

  try {
    const projects = await listStudyProjects(userId);
    res.status(200).json({
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        sponsor: p.sponsor,
        status: p.status,
        createdAt: p.created_at,
      })),
    });
  } catch (err) {
    console.error("List study projects error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to list study projects",
    });
  }
});

/**
 * GET /study-projects/:projectId/checklist
 */
studyProjectsRouter.get("/:projectId/checklist", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  if (!projectId) {
    res.status(400).json({ error: "Project ID required" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    const persisted = await getChecklistItems(projectId);
    const items = evaluateChecklist(
      { interventional: project.interventional, cancer_related: project.cancer_related },
      persisted.map((p) => ({
        item_id: p.item_id,
        status: p.status,
        artifact_id: p.artifact_id,
        intake_payload_id: p.intake_payload_id,
        not_needed: p.not_needed,
      }))
    );
    res.status(200).json({ items });
  } catch (err) {
    console.error("Get checklist error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to get checklist" });
  }
});

/**
 * POST /study-projects/:projectId/checklist/reveal
 * Body: { parentItemId: string }
 */
studyProjectsRouter.post("/:projectId/checklist/reveal", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  const parentItemId = req.body?.parentItemId;
  if (!projectId || typeof parentItemId !== "string") {
    res.status(400).json({ error: "projectId and body.parentItemId (string) required" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    await addRevealedChecklistParent(projectId, parentItemId, userId);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Reveal checklist parent error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to reveal" });
  }
});

/**
 * POST /study-projects/:projectId/checklist/items/:itemId/start
 */
studyProjectsRouter.post("/:projectId/checklist/items/:itemId/start", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  const itemId = typeof req.params.itemId === "string" ? req.params.itemId : req.params.itemId?.[0] ?? "";
  if (!projectId || !itemId) {
    res.status(400).json({ error: "projectId and itemId required" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    await upsertChecklistItem(projectId, itemId, { status: "in_progress" });
    await insertAuditLog(projectId, userId, "start_item", { itemId });
    const items = await getChecklistItems(projectId);
    const row = items.find((r) => r.item_id === itemId);
    res.status(200).json({ status: "in_progress", itemId, row: row ?? null });
  } catch (err) {
    console.error("Start item error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to start item" });
  }
});

/**
 * PATCH /study-projects/:projectId/checklist/items/:itemId
 * Body: { status?: ChecklistStatus, notNeeded?: boolean }
 */
studyProjectsRouter.patch("/:projectId/checklist/items/:itemId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  const itemId = typeof req.params.itemId === "string" ? req.params.itemId : req.params.itemId?.[0] ?? "";
  const newStatus = req.body?.status as string | undefined;
  const notNeeded = req.body?.notNeeded as boolean | undefined;
  if (!projectId || !itemId) {
    res.status(400).json({ error: "projectId and itemId required" });
    return;
  }
  if (newStatus === undefined && notNeeded === undefined) {
    res.status(400).json({ error: "Body must include status and/or notNeeded" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    const updates: { status?: string; not_needed?: boolean } = {};
    if (notNeeded !== undefined) {
      updates.not_needed = notNeeded;
    }
    if (typeof newStatus === "string") {
      const valid: ChecklistStatus[] = ["not_started", "in_progress", "needs_review", "ready_to_submit", "complete", "blocked"];
      if (!valid.includes(newStatus as ChecklistStatus)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      const items = await getChecklistItems(projectId);
      const current = items.find((r) => r.item_id === itemId);
      const from = (current?.status ?? "not_started") as ChecklistStatus;
      if (!isAllowedTransition(from, newStatus as ChecklistStatus)) {
        res.status(400).json({ error: `Transition from ${from} to ${newStatus} not allowed` });
        return;
      }
      updates.status = newStatus;
      await insertAuditLog(projectId, userId, "update_item_status", { itemId, from, to: newStatus });
    }
    if (Object.keys(updates).length > 0) {
      await upsertChecklistItem(projectId, itemId, updates);
    }
    res.status(200).json({
      ...(newStatus !== undefined && { status: newStatus }),
      ...(notNeeded !== undefined && { notNeeded }),
      itemId,
    });
  } catch (err) {
    console.error("Update checklist item error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to update item" });
  }
});

/**
 * GET /study-projects/:projectId/checklist/items/:itemId/artifact
 * Returns latest artifact for the checklist item (draft preview). 404 if none.
 */
studyProjectsRouter.get("/:projectId/checklist/items/:itemId/artifact", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  const itemId = typeof req.params.itemId === "string" ? req.params.itemId : req.params.itemId?.[0] ?? "";
  if (!projectId || !itemId) {
    res.status(400).json({ error: "projectId and itemId required" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    const artifact = await getLatestArtifactForItem(projectId, itemId);
    if (!artifact) {
      res.status(404).json({ error: "No artifact for this item" });
      return;
    }
    res.status(200).json({
      id: artifact.id,
      content: artifact.content,
      version: artifact.version,
      createdAt: artifact.created_at,
    });
  } catch (err) {
    console.error("Get artifact error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to get artifact" });
  }
});

/**
 * POST /study-projects/:projectId/checklist/items/:itemId/generate
 * Generate first or new draft; store artifact; link to checklist item; set status to needs_review.
 */
studyProjectsRouter.post("/:projectId/checklist/items/:itemId/generate", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  const itemId = typeof req.params.itemId === "string" ? req.params.itemId : req.params.itemId?.[0] ?? "";
  if (!projectId || !itemId) {
    res.status(400).json({ error: "projectId and itemId required" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    const rule = CHECKLIST_RULES.find((r) => r.id === itemId);
    if (!rule || rule.type !== "document") {
      res.status(400).json({ error: "Item is not a document type" });
      return;
    }
    let checklistRow = await getChecklistRowByItemId(projectId, itemId);
    if (!checklistRow) {
      await upsertChecklistItem(projectId, itemId, { status: "in_progress" });
      checklistRow = await getChecklistRowByItemId(projectId, itemId);
    }
    if (!checklistRow) {
      res.status(500).json({ error: "Checklist item could not be created" });
      return;
    }
    const asset = await getProtocolAsset(project.protocol_asset_id, userId);
    const protocolSnippet = asset?.normalized_text ?? "";
    const agentPromptEntry = await getPromptForItem(itemId);
    const content = await generateDraftDocument({
      projectTitle: project.title,
      projectSponsor: project.sponsor,
      itemLabel: rule.label,
      protocolSnippet,
      agentPrompt: agentPromptEntry?.prompt,
    });
    const artifact = await insertArtifact(
      projectId,
      checklistRow.id,
      "doc",
      content
    );
    await upsertChecklistItem(projectId, itemId, {
      artifact_id: artifact.id,
      status: "needs_review",
    });
    await insertAuditLog(projectId, userId, "generate_artifact", { itemId, artifactId: artifact.id, version: artifact.version });
    res.status(200).json({ artifactId: artifact.id, version: artifact.version });
  } catch (err) {
    console.error("Generate artifact error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to generate artifact" });
  }
});

/**
 * POST /study-projects/:projectId/checklist/items/:itemId/regenerate
 * Body: { reason: string }
 * Create new artifact version; retain previous; update checklist item to new artifact; audit log.
 */
studyProjectsRouter.post("/:projectId/checklist/items/:itemId/regenerate", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  const itemId = typeof req.params.itemId === "string" ? req.params.itemId : req.params.itemId?.[0] ?? "";
  const reason = req.body?.reason;
  if (!projectId || !itemId || typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({ error: "projectId, itemId, and body.reason (non-empty string) required" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    const rule = CHECKLIST_RULES.find((r) => r.id === itemId);
    if (!rule || rule.type !== "document") {
      res.status(400).json({ error: "Item is not a document type" });
      return;
    }
    const checklistRow = await getChecklistRowByItemId(projectId, itemId);
    if (!checklistRow) {
      res.status(404).json({ error: "Checklist item not found" });
      return;
    }
    const asset = await getProtocolAsset(project.protocol_asset_id, userId);
    const protocolSnippet = asset?.normalized_text ?? "";
    const agentPromptEntry = await getPromptForItem(itemId);
    const content = await generateDraftDocument(
      {
        projectTitle: project.title,
        projectSponsor: project.sponsor,
        itemLabel: rule.label,
        protocolSnippet,
        agentPrompt: agentPromptEntry?.prompt,
      },
      { regenerateReason: reason.trim() }
    );
    const artifact = await insertArtifact(
      projectId,
      checklistRow.id,
      "doc",
      content
    );
    await upsertChecklistItem(projectId, itemId, { artifact_id: artifact.id });
    await insertAuditLog(projectId, userId, "regenerate_artifact", { itemId, reason, artifactId: artifact.id, version: artifact.version });
    res.status(200).json({ artifactId: artifact.id, version: artifact.version });
  } catch (err) {
    console.error("Regenerate error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to regenerate" });
  }
});

/**
 * GET /study-projects/:projectId/checklist/items/:itemId/field-map
 * Returns field map for intake workspace (required fields, proposed values, validation state).
 */
studyProjectsRouter.get("/:projectId/checklist/items/:itemId/field-map", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  const itemId = typeof req.params.itemId === "string" ? req.params.itemId : req.params.itemId?.[0] ?? "";
  if (!projectId || !itemId || !isIntakeItemId(itemId)) {
    res.status(400).json({ error: "Valid projectId and intake itemId required" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    const extractionRows = await getExtractionResultsByStudyProjectId(projectId);
    const saved = await getIntakePayload(projectId, itemId);
    const payload = saved?.payload && typeof saved.payload === "object" ? (saved.payload as Record<string, unknown>) : null;
    const fieldMap = buildFieldMap(itemId, extractionRows, payload);
    res.status(200).json(fieldMap);
  } catch (err) {
    console.error("Field map error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load field map" });
  }
});

/**
 * PATCH /study-projects/:projectId/checklist/items/:itemId/field-map
 * Body: { key: string, value: string | boolean | string[] }
 * Update one proposed value (source becomes user-provided).
 */
studyProjectsRouter.patch("/:projectId/checklist/items/:itemId/field-map", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  const itemId = typeof req.params.itemId === "string" ? req.params.itemId : req.params.itemId?.[0] ?? "";
  const { key, value } = req.body ?? {};
  if (!projectId || !itemId || !isIntakeItemId(itemId) || typeof key !== "string" || key.trim() === "") {
    res.status(400).json({ error: "projectId, itemId, and body.key (non-empty string) required" });
    return;
  }
  const validValue = value === undefined || value === null
    ? ""
    : Array.isArray(value)
      ? value.filter((x: unknown) => typeof x === "string")
      : typeof value === "boolean"
        ? value
        : String(value);
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    const existing = await getIntakePayload(projectId, itemId);
    const currentPayload = (existing?.payload && typeof existing.payload === "object" ? existing.payload : {}) as Record<string, unknown>;
    const nextPayload = { ...currentPayload, [key.trim()]: validValue };
    await upsertIntakePayload(projectId, itemId, nextPayload);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Update field map error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to update field" });
  }
});

/**
 * POST /study-projects/:projectId/checklist/items/:itemId/submit
 * Body: { confirmed: boolean }
 * Validate no required missing; persist payload; set checklist item complete; audit.
 */
studyProjectsRouter.post("/:projectId/checklist/items/:itemId/submit", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const projectId = typeof req.params.projectId === "string" ? req.params.projectId : req.params.projectId?.[0] ?? "";
  const itemId = typeof req.params.itemId === "string" ? req.params.itemId : req.params.itemId?.[0] ?? "";
  const confirmed = req.body?.confirmed === true;
  if (!projectId || !itemId || !isIntakeItemId(itemId)) {
    res.status(400).json({ error: "Valid projectId and intake itemId required" });
    return;
  }
  if (!confirmed) {
    res.status(400).json({ error: "Submit requires confirmation (body.confirmed: true)" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    const extractionRows = await getExtractionResultsByStudyProjectId(projectId);
    const saved = await getIntakePayload(projectId, itemId);
    const payload = saved?.payload && typeof saved.payload === "object" ? (saved.payload as Record<string, unknown>) : {};
    const fieldMap = buildFieldMap(itemId, extractionRows, payload);
    const hasMissing = fieldMap.fields.some((f) => f.required && f.validationState === "missing");
    if (hasMissing) {
      res.status(400).json({ error: "All required fields must be filled before submit" });
      return;
    }
    const payloadRow = await upsertIntakePayload(projectId, itemId, payload);
    const checklistRow = await getChecklistRowByItemId(projectId, itemId);
    if (checklistRow) {
      await upsertChecklistItem(projectId, itemId, { intake_payload_id: payloadRow.id, status: "complete" });
    }
    await insertAuditLog(projectId, userId, "submit_intake", { itemId, intakePayloadId: payloadRow.id });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Submit intake error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to submit" });
  }
});

/**
 * GET /study-projects/:id
 */
studyProjectsRouter.get("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }

  const projectId = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0] ?? "";
  if (!projectId) {
    res.status(400).json({ error: "Project ID required" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    res.status(200).json({
      id: project.id,
      title: project.title,
      sponsor: project.sponsor,
      interventional: project.interventional,
      cancerRelated: project.cancer_related,
      participatingOrgs: project.participating_orgs,
      protocolAssetId: project.protocol_asset_id,
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    });
  } catch (err) {
    console.error("Get study project error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to get study project",
    });
  }
});

/**
 * DELETE /study-projects/:id
 */
studyProjectsRouter.delete("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }

  const projectId = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0] ?? "";
  if (!projectId) {
    res.status(400).json({ error: "Project ID required" });
    return;
  }
  try {
    const project = await getStudyProject(projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Study project not found" });
      return;
    }
    await deleteStudyProject(projectId, userId);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Delete study project error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete study project",
    });
  }
});
