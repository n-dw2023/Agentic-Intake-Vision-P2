# Story 6: Dynamic form and results area

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 3 (shadcn components)

## User Story

**As a** user of Agent Config  
**I want** the dynamic form (workflow input) and results area to use the new design system and components  
**So that** form fields are accessible and results are easy to read, with clear loading and error states.

## Acceptance Criteria

- [x] Given the dynamic form, when I view or interact with it, then fields use shadcn Input/Select where applicable; labels and required indicators are clear; validation messages appear inline below the field.
- [x] Given the results area, when I view it, then sections use token-based typography and spacing; code or long text is readable (line length, optional "Show more" for long content).
- [x] Given a run is in progress, when I view the results area, then a loading state is shown (e.g. skeleton or spinner) without layout shift; the Run button shows loading state and is disabled.
- [x] Given the form and results, when I use the keyboard, then I can tab through fields and activate Run; focus ring is visible.

## Implementation Tasks

- [x] 6.1 Refactor DynamicForm to use shadcn Input for text, Select for select fields; keep file input styled with tokens. Preserve uiSpec-driven rendering and FormValues/onChange contract.
- [x] 6.2 Add inline validation message area below fields when validation is present; style with tokens and ensure it does not cause layout shift.
- [x] 6.3 Refactor ResultsArea to use token-based surfaces and typography; ensure section labels and content have clear hierarchy. If content is long, consider collapsible "Show more" per spec.
- [x] 6.4 Ensure run loading state: disable Run button and show spinner (or skeleton) in results area; preserve width/height to avoid layout shift.
- [x] 6.5 Verify acceptance criteria; test form submit and results display with a real workflow run.

## Notes

- Do not change the UI spec schema or interpreter logic; only styling and component primitives. Traceability: Story 5 (dynamic interpreter) in original spec.
- Code blocks in results: if the app displays code, use monospace and optional copy button per content-rendering standards; can be a follow-up if not currently in scope.

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Form and results tested with at least one workflow
- [x] No regressions in run flow or UI spec binding
