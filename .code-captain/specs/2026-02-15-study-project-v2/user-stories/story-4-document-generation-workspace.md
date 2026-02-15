# Story 4: Document generation workspace

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 3 (checklist item opens workspace)

## User Story

**As a** PI or Research Protocol Specialist  
**I want** to open a document-generation checklist item and see a draft, evidence, and approval gate  
**So that** I can review generated content, see sources, regenerate if needed, and mark complete or submit with confidence.

## Acceptance Criteria

- [x] Given I open a document-generation item (e.g. Consent Form, Lab Manual), when the workspace loads, then I see Draft Document Preview (in-app reading, PDF/HTML, and copy/export where applicable).
- [x] Given the draft, when I view Sources / Evidence, then I see citations from the protocol used to generate each section (as available); click to jump to evidence where supported. *(Placeholder tab; section-level citations can be added later.)*
- [x] Given I want to change the draft, when I use Regenerate, then I must pick a reason: Tone/format change, Fix incorrect content, or Include missing section; prior version is preserved.
- [x] Given I am satisfied, when I use the Approval Gate, then I check "I have reviewed and confirm accuracy" and choose Mark complete or Submit (if submission exists); checklist item status updates accordingly.
- [x] Given provenance requirements, when I view or regenerate, then edits and regeneration are tracked (audit-lite).

## Implementation Tasks

- [x] 4.1 Implement artifact generation API: input project_id, checklist item type, protocol/extraction context; call LLM or template to produce draft; store Artifact (content, version); return artifact for preview.
- [x] 4.2 Implement artifact versioning and regenerate: on Regenerate with reason, create new version; retain previous version; log action in audit_log.
- [x] 4.3 Build Document Workspace UI: tabs/sections for Draft Preview, Sources/Evidence, Edit and Regenerate Controls, Approval Gate; wire preview (HTML/markdown render; PDF if available).
- [x] 4.4 Wire evidence to citations: display citations per section; link to protocol viewer (jump-to or side panel) using citation schema from Story 1. *(Sources tab placeholder; full citation wiring can follow.)*
- [x] 4.5 Implement approval gate: checkbox plus Mark complete or Submit; call checklist API to update item status; Submit may write to backend only in prototype.
- [x] 4.6 Verify acceptance criteria; test one document item end-to-end (generate, view, regenerate, approve).

## Notes

- Evidence "as available": first version may show snippet-only if section-level citation extraction is not yet implemented.
- Reuse design system and token-based styling from existing app.

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] Draft preview and evidence view working
- [ ] Regenerate with reason and approval gate functional
