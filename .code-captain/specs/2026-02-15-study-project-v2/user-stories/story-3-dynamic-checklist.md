# Story 3: Dynamic checklist

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 2 (Study Project exists)

## User Story

**As a** PI or Research Protocol Specialist  
**I want** a checklist whose items and sub-items depend on study flags and my selections  
**So that** I see only relevant tasks and can Start, View draft, Map data, Submit, or Regenerate with clear status.

## Acceptance Criteria

- [x] Given a Study Project with flags (interventional, cancer_related) and user selections, when the checklist is rendered, then base items and conditional items/sub-items appear per product spec (e.g. if Interventional AND Cancer-related → GTMR IRB, Florence eBinder, Patient Care Schedule; selecting Patient Care Schedule → sub-items CCA, Epic Build Intake, Lab Manual → Lab Processing Intake, etc.).
- [x] Given each checklist item, when I view it, then I see a status pill: Not started / In progress / Needs review / Ready to submit / Complete / Blocked.
- [x] Given item actions, when available, then I can Start, View draft, Map data (for intake steps), Submit (after confirmation), Regenerate (with reason).
- [x] Given state transitions, when generation completes then status is Needs review; when user approves then Ready to submit (if submission applies); when submit succeeds then Complete; when required data is missing then Blocked.
- [x] Given the checklist, when I open an item, then the appropriate workspace (document or intake) opens (Stories 4–5).

## Implementation Tasks

- [x] 3.1 Define checklist rule structure: declarative rules (conditions on flags + parent selection), item IDs, parent/child relationships; document in technical-spec.
- [x] 3.2 Implement checklist engine (server or shared): input = project flags + user selections + persisted item statuses; output = visible items and sub-items, allowed transitions; persist status updates.
- [x] 3.3 Implement checklist API: get checklist for project (with statuses); start item, update status, request regenerate (with reason); link to artifact or intake payload where applicable.
- [x] 3.4 Build Checklist Panel UI: render items and sub-items from engine output; status pills; actions (Start, View draft, Map data, Submit, Regenerate) wired to APIs and workspace open.
- [x] 3.5 Enforce state machine: backend or engine validates transitions (e.g. Not started → In progress → Needs review → Ready to submit → Complete); Blocked when validation fails.
- [x] 3.6 Verify acceptance criteria; test conditional visibility and state transitions for at least two item types (one document, one intake).

## Notes

- Product spec lists exact items and conditions; encode these in the rule structure so adding new items is configuration, not code.
- Sub-items "reveal" on parent selection; persist selection so checklist state is stable across reloads.

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Checklist renders correctly for sample project with mixed flags
- [x] Opening item opens correct workspace type (callback wired; full workspace in Stories 4–5)
