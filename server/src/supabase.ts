import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getEnvOptional } from "./env.js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = getEnvOptional("SUPABASE_URL");
    const key = getEnvOptional("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for persistence");
    client = createClient(url, key);
  }
  return client;
}

export type WorkflowRow = {
  id: string;
  user_id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkflowVersionRow = {
  id: string;
  workflow_id: string;
  workflow_definition: unknown;
  ui_spec: unknown;
  created_at: string;
};

export async function insertWorkflow(
  userId: string,
  name: string | null,
  workflowDefinition: unknown,
  uiSpec: unknown
): Promise<{ workflowId: string; versionId: string }> {
  const supabase = getSupabase();

  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .insert({
      user_id: userId,
      name: name ?? "Untitled workflow",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (workflowError || !workflow) {
    throw new Error(workflowError?.message ?? "Failed to create workflow");
  }

  const { data: version, error: versionError } = await supabase
    .from("workflow_versions")
    .insert({
      workflow_id: workflow.id,
      workflow_definition: workflowDefinition,
      ui_spec: uiSpec,
    })
    .select("id")
    .single();

  if (versionError || !version) {
    throw new Error(versionError?.message ?? "Failed to create workflow version");
  }

  return { workflowId: workflow.id, versionId: version.id };
}

/** Add a new version to an existing workflow. Caller must ensure user owns the workflow. */
export async function insertWorkflowVersion(
  workflowId: string,
  workflowDefinition: unknown,
  uiSpec: unknown
): Promise<{ versionId: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workflow_versions")
    .insert({
      workflow_id: workflowId,
      workflow_definition: workflowDefinition,
      ui_spec: uiSpec,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create version");
  return { versionId: data.id };
}

/** Verify workflow exists and belongs to user (for refine/accept). */
export async function getWorkflowOwnerId(workflowId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workflows")
    .select("user_id")
    .eq("id", workflowId)
    .single();
  if (error || !data) return null;
  return data.user_id as string;
}

/** Load workflow version by workflow id and version id. Returns null if not found. */
export async function getWorkflowVersion(
  workflowId: string,
  versionId: string
): Promise<{ workflowDefinition: unknown; uiSpec: unknown } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workflow_versions")
    .select("workflow_definition, ui_spec")
    .eq("workflow_id", workflowId)
    .eq("id", versionId)
    .single();
  if (error || !data) return null;
  return {
    workflowDefinition: data.workflow_definition,
    uiSpec: data.ui_spec,
  };
}

/** List workflows for a user (id, name, created_at, updated_at). */
export async function listWorkflows(userId: string): Promise<
  { id: string; name: string | null; created_at: string; updated_at: string }[]
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workflows")
    .select("id, name, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; name: string | null; created_at: string; updated_at: string }[];
}

/** Update workflow name. Returns false if not found or not owned. */
export async function updateWorkflowName(
  workflowId: string,
  userId: string,
  name: string
): Promise<boolean> {
  const ownerId = await getWorkflowOwnerId(workflowId);
  if (ownerId !== userId) return false;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("workflows")
    .update({ name: name.trim() || "Untitled workflow", updated_at: new Date().toISOString() })
    .eq("id", workflowId);
  return !error;
}

/** Delete a workflow (and its versions via cascade). Returns false if not found or not owned. */
export async function deleteWorkflow(workflowId: string, userId: string): Promise<boolean> {
  const ownerId = await getWorkflowOwnerId(workflowId);
  if (ownerId !== userId) return false;
  const supabase = getSupabase();
  const { error } = await supabase.from("workflows").delete().eq("id", workflowId);
  return !error;
}

/** Get workflow metadata and a specific version (or latest). Returns null if not found or not owned. */
export async function getWorkflowWithVersion(
  workflowId: string,
  userId: string,
  versionId?: string
): Promise<{
  id: string;
  name: string | null;
  versionId: string;
  workflow: unknown;
  uiSpec: unknown;
} | null> {
  const supabase = getSupabase();
  const { data: wf, error: wfError } = await supabase
    .from("workflows")
    .select("id, name")
    .eq("id", workflowId)
    .eq("user_id", userId)
    .single();
  if (wfError || !wf) return null;

  if (versionId) {
    const ver = await getWorkflowVersion(workflowId, versionId);
    if (!ver) return null;
    return {
      id: wf.id,
      name: wf.name as string | null,
      versionId,
      workflow: ver.workflowDefinition,
      uiSpec: ver.uiSpec,
    };
  }

  const { data: latest, error: verError } = await supabase
    .from("workflow_versions")
    .select("id, workflow_definition, ui_spec")
    .eq("workflow_id", workflowId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (verError || !latest) return null;

  return {
    id: wf.id,
    name: wf.name as string | null,
    versionId: latest.id,
    workflow: latest.workflow_definition,
    uiSpec: latest.ui_spec,
  };
}

/** List version ids and created_at for a workflow. Caller must ensure user owns workflow. */
export async function listWorkflowVersions(workflowId: string): Promise<
  { id: string; created_at: string }[]
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workflow_versions")
    .select("id, created_at")
    .eq("workflow_id", workflowId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; created_at: string }[];
}

/** Record a run in run_history (optional for v1). */
export async function insertRunHistory(
  workflowId: string,
  workflowVersionId: string,
  userId: string,
  status: "success" | "partial" | "failed",
  results: unknown
): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("run_history").insert({
    workflow_id: workflowId,
    workflow_version_id: workflowVersionId,
    user_id: userId,
    status,
    results,
  });
}

// --- Study Project V2: protocol_assets and extraction_results (Story 1) ---

export type ProtocolAssetRow = {
  id: string;
  user_id: string;
  content_type: string;
  normalized_text: string;
  metadata: Record<string, unknown>;
  blob_url: string | null;
  created_at: string;
};

export async function insertProtocolAsset(
  userId: string,
  contentType: string,
  normalizedText: string,
  metadata: Record<string, unknown> = {},
  blobUrl: string | null = null
): Promise<{ id: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("protocol_assets")
    .insert({
      user_id: userId,
      content_type: contentType,
      normalized_text: normalizedText,
      metadata,
      blob_url: blobUrl,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create protocol asset");
  return { id: data.id };
}

export async function getProtocolAsset(
  assetId: string,
  userId: string
): Promise<ProtocolAssetRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("protocol_assets")
    .select("id, user_id, content_type, normalized_text, metadata, blob_url, created_at")
    .eq("id", assetId)
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return data as ProtocolAssetRow;
}

export type ExtractionResultRow = {
  id: string;
  protocol_asset_id: string;
  study_project_id: string | null;
  field_name: string;
  value: unknown;
  confidence: string;
  citations: unknown;
  provenance: string;
  created_at: string;
  updated_at: string;
};

export async function insertExtractionResults(
  protocolAssetId: string,
  results: Array<{
    field_name: string;
    value: unknown;
    confidence: string;
    citations: unknown;
    provenance: string;
  }>
): Promise<void> {
  const supabase = getSupabase();
  const rows = results.map((r) => ({
    protocol_asset_id: protocolAssetId,
    field_name: r.field_name,
    value: r.value,
    confidence: r.confidence,
    citations: r.citations,
    provenance: r.provenance,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("extraction_results").insert(rows);
  if (error) throw new Error(error.message);
}

export async function getExtractionResultsByProtocolAssetId(
  protocolAssetId: string
): Promise<ExtractionResultRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("extraction_results")
    .select("*")
    .eq("protocol_asset_id", protocolAssetId)
    .order("field_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as ExtractionResultRow[];
}

export async function getExtractionResultsByStudyProjectId(
  studyProjectId: string
): Promise<ExtractionResultRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("extraction_results")
    .select("*")
    .eq("study_project_id", studyProjectId)
    .order("field_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as ExtractionResultRow[];
}

/** Delete existing extraction results for a protocol asset (e.g. before re-extracting or confirm overwrite). */
export async function deleteExtractionResultsByProtocolAssetId(
  protocolAssetId: string
): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("extraction_results").delete().eq("protocol_asset_id", protocolAssetId);
}

// --- Study Project V2: study_projects and audit_log (Story 2) ---

export type StudyProjectRow = {
  id: string;
  user_id: string;
  title: string;
  sponsor: string;
  interventional: boolean;
  cancer_related: boolean;
  participating_orgs: string[];
  protocol_asset_id: string;
  status: string;
  revealed_checklist_parent_ids?: string[];
  created_at: string;
  updated_at: string;
};

/** Generate next study project ID (YYYY-######) via DB function. */
export async function generateStudyProjectId(): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("generate_study_project_id");
  if (error) throw new Error(error.message);
  if (typeof data !== "string") throw new Error("generate_study_project_id returned non-string");
  return data;
}

export async function insertStudyProject(
  userId: string,
  id: string,
  title: string,
  sponsor: string,
  interventional: boolean,
  cancerRelated: boolean,
  participatingOrgs: string[],
  protocolAssetId: string
): Promise<StudyProjectRow> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("study_projects")
    .insert({
      id,
      user_id: userId,
      title,
      sponsor,
      interventional,
      cancer_related: cancerRelated,
      participating_orgs: participatingOrgs,
      protocol_asset_id: protocolAssetId,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudyProjectRow;
}

export async function getStudyProject(
  projectId: string,
  userId: string
): Promise<StudyProjectRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("study_projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return data as StudyProjectRow;
}

export async function listStudyProjects(userId: string): Promise<StudyProjectRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("study_projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as StudyProjectRow[];
}

export async function deleteStudyProject(projectId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("study_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return true;
}

export async function updateExtractionResultsStudyProjectId(
  protocolAssetId: string,
  studyProjectId: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("extraction_results")
    .update({ study_project_id: studyProjectId, updated_at: new Date().toISOString() })
    .eq("protocol_asset_id", protocolAssetId);
  if (error) throw new Error(error.message);
}

// --- Study Project V2: checklist (Story 3) ---

export type ChecklistItemRow = {
  id: string;
  project_id: string;
  item_id: string;
  status: string;
  artifact_id: string | null;
  intake_payload_id: string | null;
  not_needed?: boolean;
  created_at: string;
  updated_at: string;
};

export async function getChecklistItems(projectId: string): Promise<ChecklistItemRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  return (data ?? []) as ChecklistItemRow[];
}

/** Get single checklist row by project and logical item_id. */
export async function getChecklistRowByItemId(
  projectId: string,
  itemId: string
): Promise<ChecklistItemRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("project_id", projectId)
    .eq("item_id", itemId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ChecklistItemRow) ?? null;
}

/** Ensure a checklist item row exists; update status, artifact_id, intake_payload_id, and/or not_needed. */
export async function upsertChecklistItem(
  projectId: string,
  itemId: string,
  updates: {
    status?: string;
    artifact_id?: string | null;
    intake_payload_id?: string | null;
    not_needed?: boolean;
  }
): Promise<ChecklistItemRow> {
  const supabase = getSupabase();
  const existing = await supabase
    .from("checklist_items")
    .select("*")
    .eq("project_id", projectId)
    .eq("item_id", itemId)
    .maybeSingle();
  const now = new Date().toISOString();
  if (existing.data) {
    const { data, error } = await supabase
      .from("checklist_items")
      .update({
        ...(updates.status != null && { status: updates.status }),
        ...(updates.artifact_id !== undefined && { artifact_id: updates.artifact_id }),
        ...(updates.intake_payload_id !== undefined && { intake_payload_id: updates.intake_payload_id }),
        ...(updates.not_needed !== undefined && { not_needed: updates.not_needed }),
        updated_at: now,
      })
      .eq("project_id", projectId)
      .eq("item_id", itemId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ChecklistItemRow;
  }
  const { data, error } = await supabase
    .from("checklist_items")
    .insert({
      project_id: projectId,
      item_id: itemId,
      status: updates.status ?? "not_started",
      artifact_id: updates.artifact_id ?? null,
      intake_payload_id: updates.intake_payload_id ?? null,
      not_needed: updates.not_needed ?? false,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ChecklistItemRow;
}

/** Add a parent item id to revealed list (so sub-items appear). Idempotent. Caller must ensure userId owns project. */
export async function addRevealedChecklistParent(projectId: string, parentItemId: string, userId: string): Promise<void> {
  const current = await getRevealedChecklistParentIds(projectId);
  if (current.includes(parentItemId)) return;
  const supabase = getSupabase();
  const next = [...current, parentItemId];
  const { error } = await supabase
    .from("study_projects")
    .update({ revealed_checklist_parent_ids: next, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

/** Get revealed parent ids for a project (for engine). */
export async function getRevealedChecklistParentIds(projectId: string): Promise<string[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("study_projects")
    .select("revealed_checklist_parent_ids")
    .eq("id", projectId)
    .single();
  if (error || !data) return [];
  const raw = data.revealed_checklist_parent_ids;
  return Array.isArray(raw) ? (raw as string[]) : [];
}

export async function insertAuditLog(
  projectId: string,
  userId: string,
  action: string,
  details: Record<string, unknown> | null = null
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("audit_log").insert({
    project_id: projectId,
    user_id: userId,
    action,
    details,
  });
  if (error) throw new Error(error.message);
}

// --- Artifacts (Story 4) ---

export type ArtifactRow = {
  id: string;
  project_id: string;
  checklist_item_id: string;
  type: string;
  content: string;
  version: number;
  created_at: string;
};

export async function getMaxArtifactVersionForChecklistItem(
  projectId: string,
  checklistItemId: string
): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("artifacts")
    .select("version")
    .eq("project_id", projectId)
    .eq("checklist_item_id", checklistItemId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { version: number } | null)?.version ?? 0;
}

export async function insertArtifact(
  projectId: string,
  checklistItemId: string,
  type: string,
  content: string
): Promise<ArtifactRow> {
  const supabase = getSupabase();
  const maxVersion = await getMaxArtifactVersionForChecklistItem(projectId, checklistItemId);
  const version = maxVersion + 1;
  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      project_id: projectId,
      checklist_item_id: checklistItemId,
      type: type || "doc",
      content: content || "",
      version,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ArtifactRow;
}

export async function getLatestArtifactForItem(
  projectId: string,
  itemId: string
): Promise<ArtifactRow | null> {
  const row = await getChecklistRowByItemId(projectId, itemId);
  if (!row) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("project_id", projectId)
    .eq("checklist_item_id", row.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ArtifactRow) ?? null;
}

export async function getArtifactById(
  projectId: string,
  artifactId: string
): Promise<ArtifactRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", artifactId)
    .single();
  if (error || !data) return null;
  return data as ArtifactRow;
}

// --- Intake payloads (Story 5) ---

export type IntakePayloadRow = {
  id: string;
  project_id: string;
  item_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function getIntakePayload(
  projectId: string,
  itemId: string
): Promise<IntakePayloadRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("intake_payloads")
    .select("*")
    .eq("project_id", projectId)
    .eq("item_id", itemId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as IntakePayloadRow) ?? null;
}

export async function upsertIntakePayload(
  projectId: string,
  itemId: string,
  payload: Record<string, unknown>
): Promise<IntakePayloadRow> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("intake_payloads")
    .upsert(
      {
        project_id: projectId,
        item_id: itemId,
        payload: payload ?? {},
        updated_at: now,
      },
      { onConflict: "project_id,item_id", ignoreDuplicates: false }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as IntakePayloadRow;
}
