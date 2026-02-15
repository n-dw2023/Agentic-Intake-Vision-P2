# Story 2: Study Project ID and entities

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 1 (extraction and confirm flow)

## User Story

**As a** PI or Research Protocol Specialist  
**I want** the system to assign a Study Project ID (YYYY-######) and persist the project and related data  
**So that** I have a stable reference and all extraction and protocol data are stored for checklist and workspaces.

## Acceptance Criteria

- [x] Given user has confirmed the Extraction Summary, when the system creates the project, then a unique Study Project ID in form YYYY-###### is generated and persisted.
- [x] Given a new Study Project, when it is created, then StudyProject record exists with id, title, sponsor, flags (interventional, cancer_related), participating_orgs, protocol_asset_id, created_by, status.
- [x] Given extraction results and protocol asset, when the project is created, then ExtractionResult and protocol asset are linked to the project (or referenced by protocol_asset_id).
- [x] Given the project is created, when I view the UI, then a "Project Created" card shows Project ID, Title, Sponsor, tags (Interventional / Cancer-related), and Participating Orgs.
- [x] Given the data model, when checklist or workspaces need project or protocol data, then they can resolve via project_id and protocol_asset_id.

## Implementation Tasks

- [x] 2.1 Define and document full data model (StudyProject, ChecklistItem, Artifact, ExtractionResult, protocol_asset) in database-schema sub-spec; add audit_log table for audit-lite.
- [x] 2.2 Implement ID generation: YYYY = current year; ###### = sequence or collision-safe suffix per year; expose as server API.
- [x] 2.3 Create database migrations (or Supabase schema): study_projects, protocol_assets, extraction_results, checklist_items, artifacts, audit_log; apply RLS or app-level scoping by user.
- [x] 2.4 Implement create-study-project API: input = confirmed extraction + protocol_asset_id; create StudyProject, link extraction results; return project and ID.
- [x] 2.5 Build "Project Created" card UI: display ID, title, sponsor, tags, participating orgs; wire from confirm flow (Story 1) to this card.
- [x] 2.6 Verify acceptance criteria; ensure ID format is unique and persisted correctly.

## Notes

- Sequence for ######: use DB sequence, or timestamp-based with collision check; avoid guessable IDs if needed for privacy.
- Traceability: Story 3 (checklist) and Stories 4–5 (workspaces) depend on project_id and related entities.

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Schema and migrations applied
- [x] Project Created card displays after confirm
