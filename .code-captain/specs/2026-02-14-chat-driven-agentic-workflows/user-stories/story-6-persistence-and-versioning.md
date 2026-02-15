# Story 6: Persistence and versioning

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 1

## User Story

**As a** user  
**I want** my workflows and their versions to be saved and loadable  
**So that** I can return to a workflow, see history, and run a specific version.

## Acceptance Criteria

- [x] Given a new or refined workflow, when the user accepts, then the workflow (and its version) is persisted to the database and associated with the user.
- [x] Given a user, when they open the app, then they can list their workflows and select one to view/edit/run.
- [x] Given a workflow, when viewing it, then the user sees the latest version by default and can optionally load or list previous versions.
- [x] All workflow and UI spec data is stored per user (user-scoped); no sharing or multi-tenant in v1.

## Implementation Tasks

- [x] 6.1 Implement database tables (or confirm migrations from Story 1): workflows, workflow_versions, run_history.
- [x] 6.2 Implement create workflow/version; generate and accept create new workflow_versions rows.
- [x] 6.3 Implement list workflows (GET /workflows) and get workflow by id with latest or specific version (GET /workflows/:id, GET /workflows/:id/versions/:versionId).
- [x] 6.4 Auth: API protected by x-user-id; Supabase Auth (JWT) optional follow-up.
- [x] 6.5 Client: My workflows list, load workflow, version selector; list refreshes when opening My workflows.

## Notes

- Use Supabase (Postgres + Auth) or Neon + separate auth; document choice in technical-spec. For Supabase, use RLS so rows are scoped by user.
- See [database-schema.md](../sub-specs/database-schema.md) and [api-spec.md](../sub-specs/api-spec.md).

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] RLS and DB documented (Story 1 / database-schema.md). Auth: x-user-id for dev; JWT optional follow-up.
