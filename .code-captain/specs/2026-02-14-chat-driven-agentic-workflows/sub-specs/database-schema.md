# Database Schema: Chat-Driven Agentic Workflows

> Traceability: Story 1 (migrations), Story 6 (persistence and versioning).

## Recommended: Supabase (Postgres)

### Tables

**workflows**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users if using Supabase Auth)
- `name` (text, nullable or default from first version)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**workflow_versions**
- `id` (uuid, PK)
- `workflow_id` (uuid, FK to workflows)
- `workflow_definition` (jsonb) — full workflow JSON (input + agents)
- `ui_spec` (jsonb) — full UI spec JSON (form + results)
- `created_at` (timestamptz)

**run_history** (optional for v1)
- `id` (uuid, PK)
- `workflow_id` (uuid, FK)
- `workflow_version_id` (uuid, FK to workflow_versions)
- `user_id` (uuid)
- `status` (text: success | partial | failed)
- `results` (jsonb, nullable) — per-agent outputs
- `created_at` (timestamptz)

### Indexes

- `workflow_versions(workflow_id, created_at DESC)` for "latest version" and version list.
- `workflows(user_id)` for listing a user's workflows.
- If using run_history: `run_history(workflow_id)`, `run_history(user_id)` for listing runs.

### Row-Level Security (Supabase)

- `workflows`: user can only SELECT/INSERT/UPDATE/DELETE own rows (`auth.uid() = user_id`).
- `workflow_versions`: user can only access versions of workflows they own (join to workflows).
- `run_history`: same as workflows (user sees only own runs).

### Alternative: Neon (or plain Postgres)

- Same table and column design. Omit `auth.users` FK if not using Supabase; use your own `users` table and set `user_id` from your auth layer.
- Enforce user scoping in application code on every read/write.

## Migration Strategy

- Create migrations (e.g. Supabase CLI or raw SQL) for workflows and workflow_versions in Story 1.
- Add run_history in Story 1 or Story 4 if run persistence is in scope for v1.
- Document env vars: database URL, service role key (backend only).
