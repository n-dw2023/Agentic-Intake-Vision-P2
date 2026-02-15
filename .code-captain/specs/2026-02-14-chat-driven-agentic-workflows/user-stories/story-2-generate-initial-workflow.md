# Story 2: Generate initial workflow from natural language

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 1

## User Story

**As a** non-technical user  
**I want to** describe the problem I want to solve in chat  
**So that** I get an initial agentic workflow and UI spec I can run and refine.

## Acceptance Criteria

- [ ] Given a natural-language description (e.g. "one document to many drafts: executive summary, technical brief, press release"), when the user submits it, then the system returns a valid workflow definition and UI spec.
- [ ] Given the generated output, when validated, then it passes schema validation; invalid outputs are retried or surfaced with a clear message.
- [ ] Given a successful generation, when the user accepts, then the initial version is persisted (workflow + UI spec) and the user sees the workflow summary and interpreted UI.

## Implementation Tasks

- [x] 2.1 Add backend endpoint (e.g. POST /api/workflows/generate) that accepts a natural-language prompt.
- [x] 2.2 Implement prompt and call to OpenAI (o4-mini) to generate workflow + UI spec conforming to the defined schemas (include schema or examples in the prompt).
- [x] 2.3 Parse and validate the model response; on validation failure, retry or return a structured error.
- [x] 2.4 On success, persist the initial workflow and first version (integrate with Story 6 persistence).
- [x] 2.5 Return workflow id, version id, workflow definition, and UI spec to the client.
- [x] 2.6 Verify acceptance criteria and add tests (e.g. mock OpenAI, assert valid schema output).

## Notes

- Prompt engineering is critical: provide the workflow and UI spec schemas (or compact examples) in the prompt so the model outputs parseable JSON. Consider asking for JSON only in a code block.
- See [api-spec.md](../sub-specs/api-spec.md) and [technical-spec.md](../sub-specs/technical-spec.md).

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Documentation updated
