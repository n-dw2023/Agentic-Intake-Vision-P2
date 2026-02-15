const API_BASE = "/api";

import type { WorkflowDefinition, UiSpec } from "../../shared/src/index.js";
export type { WorkflowDefinition, UiSpec };

// --- Supabase Auth: session drives Authorization + x-user-id ---
export type AuthSession = { accessToken: string; userId: string } | null;
let authSession: AuthSession = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthSession(session: AuthSession) {
  authSession = session;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

const headers = (): HeadersInit => {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (authSession) {
    (h as Record<string, string>)["Authorization"] = `Bearer ${authSession.accessToken}`;
    (h as Record<string, string>)["x-user-id"] = authSession.userId;
  }
  return h;
};

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof Request) return input.url;
  return input.toString();
}

function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, credentials: "include" }).then((res) => {
    const url = getRequestUrl(input);
    if (res.status === 401 && !url.includes("/api/health")) {
      unauthorizedHandler?.();
    }
    return res;
  });
}

// --- API functions use fetchWithAuth; headers() include Bearer + x-user-id when session set ---

export async function listWorkflows(): Promise<{
  workflows: { id: string; name: string; createdAt: string; updatedAt: string }[];
}> {
  const res = await fetchWithAuth(`${API_BASE}/workflows`, { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed ${res.status}`);
  }
  return res.json();
}

export async function updateWorkflowName(workflowId: string, name: string): Promise<{ name: string }> {
  const res = await fetchWithAuth(`${API_BASE}/workflows/${workflowId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed ${res.status}`);
  }
  return res.json();
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/workflows/${workflowId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed ${res.status}`);
  }
}

export async function getWorkflow(
  workflowId: string,
  versionId?: string
): Promise<{
  id: string;
  name: string | null;
  versionId: string;
  workflow: WorkflowDefinition;
  uiSpec: UiSpec;
}> {
  const url = versionId
    ? `${API_BASE}/workflows/${workflowId}/versions/${versionId}`
    : `${API_BASE}/workflows/${workflowId}`;
  const res = await fetchWithAuth(url, { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed ${res.status}`);
  }
  return res.json();
}

export async function listVersions(workflowId: string): Promise<{
  versions: { id: string; createdAt: string }[];
}> {
  const res = await fetchWithAuth(`${API_BASE}/workflows/${workflowId}/versions`, { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed ${res.status}`);
  }
  return res.json();
}

export async function generateWorkflow(prompt: string): Promise<{
  workflowId: string;
  versionId: string;
  workflow: WorkflowDefinition;
  uiSpec: UiSpec;
}> {
  const res = await fetchWithAuth(`${API_BASE}/workflows/generate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed ${res.status}`);
  }
  return res.json();
}

export async function refineWorkflow(
  workflowId: string,
  versionId: string,
  workflow: WorkflowDefinition,
  uiSpec: UiSpec,
  message: string
): Promise<{ proposedWorkflow: WorkflowDefinition; proposedUiSpec: UiSpec }> {
  const res = await fetchWithAuth(`${API_BASE}/workflows/${workflowId}/refine`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ versionId, workflow, uiSpec, message }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed ${res.status}`);
  }
  return res.json();
}

export async function acceptVersion(
  workflowId: string,
  workflow: WorkflowDefinition,
  uiSpec: UiSpec
): Promise<{ versionId: string; workflow: WorkflowDefinition; uiSpec: UiSpec }> {
  const res = await fetchWithAuth(`${API_BASE}/workflows/${workflowId}/versions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ workflow, uiSpec }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed ${res.status}`);
  }
  return res.json();
}

export type RunResult = { agentId: string; outputLabel: string; content: string };

// --- Study Project V2: Protocol ingest and extraction (Story 1) ---

export type Citation = { snippet: string; startOffset?: number; endOffset?: number; page?: number };
export type ExtractionResult = {
  field_name: string;
  value: string | boolean | string[];
  confidence: string;
  citations: Citation[];
  provenance: string;
};

export async function ingestProtocolFile(file: File): Promise<{
  protocolAssetId: string;
  contentType: string;
  normalizedTextLength: number;
}> {
  const form = new FormData();
  form.append("file", file);
  const authHeaders: Record<string, string> = authSession
    ? { Authorization: `Bearer ${authSession.accessToken}`, "x-user-id": authSession.userId }
    : {};
  const res = await fetchWithAuth(`${API_BASE}/protocols/ingest`, {
    method: "POST",
    headers: authHeaders,
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Ingest failed ${res.status}`);
  }
  return res.json();
}

export async function ingestProtocolText(text: string): Promise<{
  protocolAssetId: string;
  contentType: string;
  normalizedTextLength: number;
}> {
  const res = await fetchWithAuth(`${API_BASE}/protocols/ingest`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Ingest failed ${res.status}`);
  }
  return res.json();
}

export async function extractProtocol(protocolAssetId: string): Promise<{
  extractionResults: ExtractionResult[];
}> {
  const res = await fetchWithAuth(`${API_BASE}/protocols/${protocolAssetId}/extract`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Extract failed ${res.status}`);
  }
  return res.json();
}

export async function getProtocolAsset(protocolAssetId: string): Promise<{
  id: string;
  contentType: string;
  normalizedText: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}> {
  const res = await fetchWithAuth(`${API_BASE}/protocols/${protocolAssetId}`, { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to get protocol ${res.status}`);
  }
  return res.json();
}

export async function getExtraction(protocolAssetId: string): Promise<{
  extractionResults: ExtractionResult[];
}> {
  const res = await fetchWithAuth(`${API_BASE}/protocols/${protocolAssetId}/extraction`, {
    headers: headers(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to get extraction ${res.status}`);
  }
  return res.json();
}

export async function confirmExtraction(
  protocolAssetId: string,
  extractionResults: ExtractionResult[]
): Promise<{ extractionResults: ExtractionResult[] }> {
  const res = await fetchWithAuth(`${API_BASE}/protocols/${protocolAssetId}/extraction/confirm`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ extractionResults }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Confirm failed ${res.status}`);
  }
  return res.json();
}

// --- Study Project V2: Create study project (Story 2) ---

export type StudyProject = {
  id: string;
  title: string;
  sponsor: string;
  interventional: boolean;
  cancerRelated: boolean;
  participatingOrgs: string[];
  protocolAssetId: string;
  createdAt: string;
};

export async function createStudyProject(
  protocolAssetId: string,
  payload: {
    title: string;
    sponsor: string;
    interventional: boolean;
    cancerRelated: boolean;
    participatingOrgs: string[];
  }
): Promise<StudyProject> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      protocolAssetId,
      title: payload.title,
      sponsor: payload.sponsor,
      interventional: payload.interventional,
      cancerRelated: payload.cancerRelated,
      participatingOrgs: payload.participatingOrgs,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Create study project failed ${res.status}`);
  }
  return res.json();
}

export type StudyProjectListItem = {
  id: string;
  title: string;
  sponsor: string;
  status: string;
  createdAt: string;
};

export async function listStudyProjects(): Promise<{ projects: StudyProjectListItem[] }> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects`, { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `List study projects failed ${res.status}`);
  }
  return res.json();
}

export async function deleteStudyProject(projectId: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects/${projectId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Delete study project failed ${res.status}`);
  }
}

export async function getStudyProject(projectId: string): Promise<StudyProject & { status?: string; updatedAt?: string }> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects/${projectId}`, { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Get study project failed ${res.status}`);
  }
  return res.json();
}

// --- Study Project V2: Checklist (Story 3) ---

export type ChecklistStatus =
  | "not_started"
  | "in_progress"
  | "needs_review"
  | "ready_to_submit"
  | "complete"
  | "blocked";

export type ChecklistItem = {
  itemId: string;
  label: string;
  questionForUser?: string;
  expandedText?: string;
  type: "document" | "intake";
  status: ChecklistStatus;
  parentId: string | null;
  artifactId: string | null;
  intakePayloadId: string | null;
  hasChildren: boolean;
  notNeeded?: boolean;
  children?: ChecklistItem[];
};

/** Demo bypass: load example protocol + extraction (no LLM). */
export async function loadDemoProtocol(): Promise<{
  protocolAssetId: string;
  contentType: string;
  normalizedTextLength: number;
  extractionResults: ExtractionResult[];
}> {
  const res = await fetchWithAuth(`${API_BASE}/protocols/demo`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Demo protocol failed ${res.status}`);
  }
  return res.json();
}

/** Demo bypass: create a full demo study project and return it (no LLM). */
export async function loadDemoProject(): Promise<StudyProject> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects/demo`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Demo project failed ${res.status}`);
  }
  return res.json();
}

export async function getChecklist(projectId: string): Promise<{ items: ChecklistItem[] }> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects/${projectId}/checklist`, { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Get checklist failed ${res.status}`);
  }
  return res.json();
}

export async function startChecklistItem(projectId: string, itemId: string): Promise<{ status: string }> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects/${projectId}/checklist/items/${itemId}/start`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Start item failed ${res.status}`);
  }
  return res.json();
}

export async function updateChecklistItemStatus(
  projectId: string,
  itemId: string,
  status: ChecklistStatus
): Promise<{ status: string }> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects/${projectId}/checklist/items/${itemId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Update status failed ${res.status}`);
  }
  return res.json();
}

export async function updateChecklistItemNotNeeded(
  projectId: string,
  itemId: string,
  notNeeded: boolean
): Promise<{ notNeeded: boolean }> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects/${projectId}/checklist/items/${itemId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ notNeeded }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Update not needed failed ${res.status}`);
  }
  return res.json();
}

export async function regenerateChecklistItem(
  projectId: string,
  itemId: string,
  reason: string
): Promise<{ artifactId: string | null; version: number }> {
  const res = await fetchWithAuth(`${API_BASE}/study-projects/${projectId}/checklist/items/${itemId}/regenerate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Regenerate failed ${res.status}`);
  }
  return res.json();
}

export type Artifact = {
  id: string;
  content: string;
  version: number;
  createdAt: string;
};

export async function getArtifact(
  projectId: string,
  itemId: string
): Promise<Artifact> {
  const res = await fetchWithAuth(
    `${API_BASE}/study-projects/${projectId}/checklist/items/${itemId}/artifact`,
    { headers: headers() }
  );
  if (!res.ok) {
    if (res.status === 404) {
      const e = new Error("No artifact for this item") as Error & { status?: number };
      e.status = 404;
      throw e;
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Get artifact failed ${res.status}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    content: data.content,
    version: data.version,
    createdAt: data.createdAt,
  };
}

export async function generateArtifact(
  projectId: string,
  itemId: string
): Promise<{ artifactId: string; version: number }> {
  const res = await fetchWithAuth(
    `${API_BASE}/study-projects/${projectId}/checklist/items/${itemId}/generate`,
    { method: "POST", headers: headers() }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Generate artifact failed ${res.status}`);
  }
  return res.json();
}

// --- Intake workspace (Story 5) ---

export type IntakeFieldMapEntry = {
  key: string;
  label: string;
  required: boolean;
  proposedValue: string | boolean | string[];
  source: "extraction" | "user-provided";
  citationSnippet?: string;
  confidence?: "low" | "medium" | "high";
  validationState: "ok" | "missing" | "needs_attention";
};

export type IntakeFieldMap = {
  itemId: string;
  fields: IntakeFieldMapEntry[];
  questions: { id: string; text: string; answer?: string }[];
};

export async function getIntakeFieldMap(
  projectId: string,
  itemId: string
): Promise<IntakeFieldMap> {
  const res = await fetchWithAuth(
    `${API_BASE}/study-projects/${projectId}/checklist/items/${itemId}/field-map`,
    { headers: headers() }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Get field map failed ${res.status}`);
  }
  return res.json();
}

export async function updateIntakeField(
  projectId: string,
  itemId: string,
  key: string,
  value: string | boolean | string[]
): Promise<void> {
  const res = await fetchWithAuth(
    `${API_BASE}/study-projects/${projectId}/checklist/items/${itemId}/field-map`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ key, value }),
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Update field failed ${res.status}`);
  }
}

export async function submitIntake(
  projectId: string,
  itemId: string,
  confirmed: boolean
): Promise<void> {
  const res = await fetchWithAuth(
    `${API_BASE}/study-projects/${projectId}/checklist/items/${itemId}/submit`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ confirmed }),
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Submit intake failed ${res.status}`);
  }
}

// --- Agent prompts (generation drafters) ---

export type AgentPromptEntry = { label: string; prompt: string };

export async function getAgentPrompts(): Promise<{
  prompts: Record<string, AgentPromptEntry>;
}> {
  const res = await fetchWithAuth(`${API_BASE}/prompts`, { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Get prompts failed ${res.status}`);
  }
  return res.json();
}

export async function updateAgentPrompts(updates: Record<string, Partial<AgentPromptEntry>>): Promise<{
  prompts: Record<string, AgentPromptEntry>;
}> {
  const res = await fetchWithAuth(`${API_BASE}/prompts`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ prompts: updates }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Update prompts failed ${res.status}`);
  }
  return res.json();
}

export async function runWorkflow(
  workflowId: string,
  versionId: string,
  document: string
): Promise<{ results: RunResult[] }> {
  const res = await fetchWithAuth(
    `${API_BASE}/workflows/${workflowId}/versions/${versionId}/run`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ document }),
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed ${res.status}`);
  }
  return res.json();
}
