# API Specification: Chat-Driven Agentic Workflows

> Traceability: Story 2 (generate), Story 3 (refine), Story 4 (run), Story 6 (CRUD, auth).

## Base

- **Base URL:** e.g. `/api` or environment-defined.
- **Auth:** All endpoints require an authenticated user (e.g. Bearer token from Supabase Auth). Return 401 when unauthenticated.
- **Errors:** Return JSON `{ error: string, code?: string }` with appropriate HTTP status (4xx, 5xx).

## Endpoints

### Generate initial workflow

- **POST** `/workflows/generate` (or `/api/workflows/generate`)
- **Body:** `{ prompt: string }` — natural-language description of the problem/workflow.
- **Response (200):** `{ workflowId: string, versionId: string, workflow: WorkflowDefinition, uiSpec: UiSpec }`.
- **Errors:** 400 (invalid prompt), 502 (OpenAI error or validation failure after retries).

### Refine workflow

- **POST** `/workflows/:workflowId/refine`
- **Body:** `{ versionId: string, workflow: WorkflowDefinition, uiSpec: UiSpec, message: string }` — current version and user's refinement message.
- **Response (200):** `{ proposedWorkflow: WorkflowDefinition, proposedUiSpec: UiSpec }`. Client may then call "accept" to persist.
- **Accept and persist:** Either same endpoint with `accept: true` and server persists new version and returns `{ versionId: string, workflow: ..., uiSpec: ... }`, or a separate **POST** `/workflows/:workflowId/versions` with the proposed workflow + uiSpec. Choose one and document.
- **Errors:** 400 (invalid body or validation failure), 404 (workflow not found or not owned), 502 (OpenAI error).

### Run workflow

- **POST** `/workflows/:workflowId/versions/:versionId/run`
- **Body:** multipart or JSON with input. For v1: e.g. `document` as file upload (field name `file`) or base64/text. Optionally additional form fields keyed by field id from UI spec.
- **Response (200):** `{ results: Array<{ agentId: string, outputLabel: string, content: string }> }`.
- **Errors:** 400 (missing/invalid input), 404 (workflow or version not found), 502 (OpenAI error, timeout). On partial failure, consider 200 with partial results plus error flag, or 502 with partial results in body — document chosen behavior.

### List workflows

- **GET** `/workflows`
- **Response (200):** `{ workflows: Array<{ id: string, name: string, updatedAt: string }> }` (and optionally latest version id). Scoped to authenticated user.

### Get workflow (with version)

- **GET** `/workflows/:workflowId` — returns workflow metadata and latest version (workflow + uiSpec).
- **GET** `/workflows/:workflowId/versions/:versionId` — returns workflow metadata and the specified version (workflow + uiSpec).
- **Response (200):** `{ id: string, name: string, versionId: string, workflow: WorkflowDefinition, uiSpec: UiSpec }`. For list of versions: **GET** `/workflows/:workflowId/versions` → `{ versions: Array<{ id: string, createdAt: string }> }`.
- **Errors:** 404 if workflow not found or not owned.

### Create workflow (optional)

- If initial creation is only via "generate", no separate create endpoint. If you want manual create: **POST** `/workflows` with `{ name?: string, workflow: WorkflowDefinition, uiSpec: UiSpec }` and create first version. Document in API spec.

## Types (conceptual)

- **WorkflowDefinition:** `{ input: { type: "document" }, agents: Array<{ id, name, systemPrompt, outputLabel }> }`.
- **UiSpec:** `{ form: { fields: Array<{ id, type, label, required?, options? }> }, results: { sections: Array<{ id, label, agentIdOrOutputLabel }> } }`.

Use the same shapes as in technical-spec and validation layer.
