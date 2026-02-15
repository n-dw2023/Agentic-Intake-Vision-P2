# Story 5: Dynamic UI interpreter

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 1

## User Story

**As a** user  
**I want to** see a form and results area that are driven entirely by the workflow's UI spec  
**So that** I can input the document (and any options) and view outputs without hand-coded screens per workflow.

## Acceptance Criteria

- [x] Given a valid UI spec, when the workflow is loaded, then the main area renders a dynamic form (e.g. file upload, plus any fields defined in the spec) and a results area (sections per agent/output).
- [x] Given the user has filled the form and run the workflow, when results return, then each agent output is rendered in the corresponding result section (e.g. by output label).
- [x] Given an invalid or missing UI spec, when the workflow is loaded, then a fallback or error state is shown instead of breaking the app.

## Implementation Tasks

- [x] 5.1 Implement a form renderer that reads the UI spec's form definition and renders fields (file upload, text, dropdown, etc.) with labels and required/optional.
- [x] 5.2 Implement a results renderer that reads the UI spec's result sections and displays placeholders; after a run, map run results (by agent id or output label) to sections and render content.
- [x] 5.3 Wire "Run" button: collect form values (including file), call run endpoint (Story 4), show loading state, then pass results to the results renderer.
- [x] 5.4 Add error handling: invalid spec → show message; run failure → show error in results area or toast.
- [x] 5.5 Ensure the interpreter only uses the UI spec and never evaluates or renders arbitrary code (security).
- [x] 5.6 Verify acceptance criteria and add tests (e.g. render form from fixture spec, render results from fixture run response).

## Notes

- Start with a minimal form (single file upload + optional text/dropdown) and result sections as labeled blocks. Extend spec later for layout hints or more field types.
- See [ui-wireframes.md](../sub-specs/ui-wireframes.md) and [technical-spec.md](../sub-specs/technical-spec.md).

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Tests passing
- [x] No execution of user- or AI-generated code
