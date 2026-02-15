# Database Schema: Study Project V2

> Traceability: Story 1 (protocol_assets, extraction), Story 2 (study_projects, ID), Story 3 (checklist_items), Story 4 (artifacts), Story 5 (intake), Story 6 (audit_log).

## Recommended: Postgres (Supabase or Neon)

### study_projects

- `id` (text, PK) — Study Project ID, form YYYY-###### (e.g. 2026-000001).
- `user_id` (uuid, FK to auth.users or users) — creator/owner.
- `title` (text).
- `sponsor` (text).
- `interventional` (boolean).
- `cancer_related` (boolean).
- `participating_orgs` (jsonb or text array) — array of organization names.
- `protocol_asset_id` (uuid, FK to protocol_assets).
- `status` (text) — e.g. active, archived.
- `created_at` (timestamptz).
- `updated_at` (timestamptz).

### protocol_assets

- `id` (uuid, PK).
- `user_id` (uuid).
- `content_type` (text) — e.g. application/pdf, docx, text/plain.
- `normalized_text` (text) — full text used for extraction and citation offsets.
- `metadata` (jsonb) — optional: page_boundaries (array of page, startOffset, endOffset), original_filename.
- `blob_url` (text, nullable) — optional storage URL for original file.
- `created_at` (timestamptz).

### extraction_results

- `id` (uuid, PK).
- `protocol_asset_id` (uuid, FK).
- `study_project_id` (uuid, FK, nullable) — set after project creation.
- `field_name` (text) — e.g. title, sponsor, interventional, cancer_related, participating_orgs.
- `value` (jsonb) — scalar or array for participating_orgs.
- `confidence` (text) — low, medium, high.
- `citations` (jsonb) — array of citation objects per extraction-and-citations-spec.
- `provenance` (text) — extracted, inferred, user-provided.
- `created_at` (timestamptz).
- `updated_at` (timestamptz).

Index: extraction_results(protocol_asset_id), extraction_results(study_project_id).

### checklist_items

- `id` (uuid, PK).
- `project_id` (text, FK to study_projects.id).
- `item_id` (text) — logical id from checklist rule.
- `status` (text) — not_started, in_progress, needs_review, ready_to_submit, complete, blocked.
- `artifact_id` (uuid, FK, nullable) — for document items.
- `intake_payload_id` (uuid, nullable) — for intake items.
- `created_at` (timestamptz).
- `updated_at` (timestamptz).

Unique: (project_id, item_id). Index: checklist_items(project_id).

### artifacts

- `id` (uuid, PK).
- `project_id` (text, FK to study_projects.id).
- `checklist_item_id` (uuid, FK to checklist_items.id).
- `type` (text) — e.g. doc, form, manual.
- `content` (text) — markdown or HTML.
- `version` (integer) — increment on regenerate.
- `created_at` (timestamptz).

Index: artifacts(project_id), artifacts(checklist_item_id).

### intake_payloads

- `id` (uuid, PK).
- `project_id` (text, FK).
- `checklist_item_id` (uuid, FK).
- `intake_type` (text) — e.g. epic_build, lab_processing, radiology, pharmacy.
- `field_values` (jsonb) — map of field id to value, source, provenance.
- `submitted_at` (timestamptz).
- `created_at` (timestamptz).

Index: intake_payloads(project_id).

### audit_log

- `id` (uuid, PK).
- `project_id` (text, nullable).
- `user_id` (uuid).
- `action` (text) — e.g. extract, edit_extraction, confirm_extraction, create_project, start_item, regenerate_artifact, approve_artifact, submit_intake.
- `details` (jsonb, nullable) — minimal context.
- `created_at` (timestamptz).

Index: audit_log(project_id), audit_log(user_id), audit_log(created_at).

## ID Generation for study_projects.id

Format YYYY-######. YYYY = current year. ###### = 6-digit sequence per year. Use DB sequence per year or timestamp-based with collision check. Ensure uniqueness with unique constraint.

## Row-Level Security (Supabase)

study_projects, protocol_assets: user can only access own rows. checklist_items, artifacts, intake_payloads: via project ownership. audit_log: user can read own; insert only by backend.

## Migration Strategy

Create new tables; do not drop workflow/workflow_versions until pivot is complete. Document env vars: database URL, storage bucket for protocol blobs if used.
