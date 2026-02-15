# API Specification: Study Project V2

> Traceability: Story 1 (ingest, extract, confirm), Story 2 (create project), Story 3 (checklist), Story 4 (artifacts), Story 5 (intake), Story 6 (audit).

## Base

- **Base URL:** e.g. `/api` or environment-defined.
- **Auth:** All endpoints require authenticated user (e.g. Bearer token). Return 401 when unauthenticated.
- **Errors:** JSON `{ error: string, code?: string }` with appropriate HTTP status.

## Protocol and Extraction

### Ingest protocol

- **POST** `/protocols/ingest`
- **Body:** Multipart: `file` (PDF or DOCX) **or** JSON `{ text: string }` for paste.
- **Response (200):** `{ protocolAssetId: string, contentType: string }`. Optional: `normalizedTextLength` for UI.
- **Errors:** 400 (invalid or missing file/text), 413 (file too large), 502 (parse error).

### Extract

- **POST** `/protocols/:protocolAssetId/extract`
- **Body:** none (or optional overrides). Server uses stored normalized text.
- **Response (200):** `{ extractionResults: ExtractionResult[] }`. Each: field_name, value, confidence, citations[], provenance. Shape per extraction-and-citations-spec.
- **Errors:** 404 (asset not found or not owned), 502 (LLM or validation failure).

### Confirm extraction (optional server step)

- **POST** `/protocols/:protocolAssetId/extraction/confirm`
- **Body:** `{ extractionResults: ExtractionResult[], studyProjectId?: string }` — may include user edits; if studyProjectId present, link results to project. Or confirm is implied by create study project with protocolAssetId + extraction snapshot.
- **Response (200):** `{ ok: true }` or return created project if confirm and create are combined.
- **Design choice:** Confirm can be part of "create study project" (client sends protocolAssetId + confirmed extraction snapshot in one call). Document chosen approach.

## Study Project

### Create study project

- **POST** `/study-projects`
- **Body:** `{ protocolAssetId: string, title: string, sponsor: string, interventional: boolean, cancerRelated: boolean, participatingOrgs: string[] }` — must match confirmed extraction or user-provided values.
- **Response (200):** `{ id: string, title, sponsor, interventional, cancerRelated, participatingOrgs, protocolAssetId, createdAt }`. `id` is YYYY-######.
- **Errors:** 400 (validation), 404 (protocol asset not found), 409 (ID collision, retry).

### Get study project

- **GET** `/study-projects/:id`
- **Response (200):** Full study project plus optional extraction summary and protocol asset reference. 404 if not found or not owned.

### List study projects

- **GET** `/study-projects`
- **Response (200):** `{ projects: Array<{ id, title, sponsor, status, createdAt }> }`. User-scoped.

## Checklist

### Get checklist

- **GET** `/study-projects/:projectId/checklist`
- **Response (200):** `{ items: Array<{ itemId, label, type, status, parentId?, artifactId?, intakePayloadId?, children? }> }`. Engine evaluates rules; returns visible items and statuses. Optional: include user selections for parent-revealed sub-items (or derive from persisted item presence).

### Start item / Update status

- **POST** `/study-projects/:projectId/checklist/items/:itemId/start` — set status in_progress; for document item may trigger artifact generation.
- **PATCH** `/study-projects/:projectId/checklist/items/:itemId` — body `{ status }` for transitions (e.g. needs_review, ready_to_submit, complete, blocked). Validate state machine.

### Regenerate artifact

- **POST** `/study-projects/:projectId/checklist/items/:itemId/regenerate`
- **Body:** `{ reason: string }` — e.g. tone_format_change, fix_incorrect_content, include_missing_section.
- **Response (200):** `{ artifactId: string, version: number }`. New artifact version created; previous retained.
- **Errors:** 400 (invalid reason or item not document type), 404.

## Artifacts

### Get artifact (draft)

- **GET** `/study-projects/:projectId/artifacts/:artifactId` or **GET** `/study-projects/:projectId/checklist/items/:itemId/artifact` — returns latest artifact for item or specific version.
- **Response (200):** `{ id, content, version, createdAt }`. If no artifact, 404; client may call "start" or "generate" to create.

### Generate artifact

- **POST** `/study-projects/:projectId/checklist/items/:itemId/generate` — generate first or new draft; store artifact; link to checklist item; set item status to needs_review when done.
- **Response (200):** `{ artifactId: string, version: number }`. May be async; return job id and poll, or wait (prototype: synchronous acceptable).
- **Errors:** 404, 502 (LLM failure).

## Intake

### Get field map

- **GET** `/study-projects/:projectId/checklist/items/:itemId/intake`
- **Response (200):** `{ requiredFields: Array<{ id, label, type }>, proposedValues: Array<{ fieldId, value, source, confidence, validationState }>, exceptions: Array<{ questionId, text, answer?: string }> }`. Proposed values from extraction or saved payload; validationState = ok | missing | needs_attention.

### Update field / Answer exception

- **PATCH** `/study-projects/:projectId/checklist/items/:itemId/intake`
- **Body:** `{ fieldUpdates?: Array<{ fieldId, value }>, exceptionAnswers?: Array<{ questionId, answer }> }`. Updates proposed values; marks provenance user-provided where applicable.
- **Response (200):** Updated field map and validation state.

### Submit intake

- **POST** `/study-projects/:projectId/checklist/items/:itemId/intake/submit`
- **Body:** `{ confirmed: boolean }` — must be true; backend validates no required Missing.
- **Response (200):** `{ intakePayloadId: string }`; checklist item status set to complete; audit log entry.
- **Errors:** 400 (validation failed or confirmed false), 404.

## Audit (optional read)

- **GET** `/study-projects/:projectId/audit` — optional: return recent audit_log entries for project (action, timestamp, user_id, details). Pagination if needed. Scope to own projects.

## Types (conceptual)

- **ExtractionResult:** field_name, value, confidence, citations[], provenance. Citations per extraction-and-citations-spec.
- **ChecklistItem (response):** itemId, label, type (document | intake), status, parentId?, artifactId?, intakePayloadId?, children?.
