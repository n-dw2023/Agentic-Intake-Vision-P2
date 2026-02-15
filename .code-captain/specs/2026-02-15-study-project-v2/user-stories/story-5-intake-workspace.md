# Story 5: Intake workspace

> **Status:** Not Started  
> **Priority:** High  
> **Dependencies:** Story 3 (checklist item opens workspace)

## User Story

**As a** PI or Research Protocol Specialist  
**I want** to open an intake checklist item and see a field map, evidence viewer, and submit gate  
**So that** I can compare required intake fields to extracted protocol data, resolve missing or conflicting fields, and submit when validation passes.

## Acceptance Criteria

- [ ] Given I open an intake item (e.g. Start Epic Build Intake, Lab Processing Intake), when the workspace loads, then I see a Field Map Table: Required Field, Proposed Value, Source (protocol citation or "user-provided"), Confidence, Validation state (OK / Missing / Needs attention); inline edit for Proposed Value.
- [ ] Given a citation in the map, when I click it, then the Protocol Evidence Viewer highlights or scrolls to the source text (where supported).
- [ ] Given missing or conflicting fields, when the agent has unresolved questions, then Exceptions / Questions are listed and I can answer inline; answers update the map.
- [ ] Given the submit gate, when I attempt Submit, then validation runs (all required fields populated, no required Missing); I must check a confirmation checkbox; submit writes to backend and updates checklist item to Complete.
- [ ] Given provenance, when I edit a value or submit, then source and user-provided edits are recorded; no silent overwrites.

## Implementation Tasks

- [ ] 5.1 Define intake-type schemas: required fields per intake type (Epic Build, Lab Processing, Radiology, Pharmacy); document in technical-spec or api-spec; validation rules.
- [ ] 5.2 Implement field map API: get required fields for intake type; get proposed values (from extraction or prior save); return map with source, confidence, validation state; support inline update and agent questions/answers.
- [ ] 5.3 Build Intake Workspace UI: Field Map Table with columns and inline edit; Protocol Evidence Viewer (reuse or link to citation viewer from Story 1/4); Exceptions/Questions section with inline answers.
- [ ] 5.4 Implement validation: compute OK / Missing / Needs attention per field; block Submit when any required is Missing; show validation state in UI.
- [ ] 5.5 Implement submit gate: confirmation checkbox; submit API persists intake payload (or placeholder), updates checklist item status to Complete, logs in audit_log.
- [ ] 5.6 Verify acceptance criteria; test one intake type end-to-end (open → fill/map → resolve question → validate → submit).

## Notes

- Proposed values initially populated from extraction results where field names align; gaps filled by user or agent questions.
- Downstream integration (Epic, etc.) out of scope; submit writes to backend only.

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] Field map and evidence viewer working
- [ ] Validation and submit gate functional for at least one intake type
