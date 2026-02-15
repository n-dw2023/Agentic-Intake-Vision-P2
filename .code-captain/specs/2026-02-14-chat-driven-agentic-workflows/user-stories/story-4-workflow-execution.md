# Story 4: Workflow execution (parallel agents)

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 1

## User Story

**As a** user  
**I want to** run the current workflow with an uploaded document (and any form inputs)  
**So that** I see the generated outputs (e.g. draft documents) from each agent as a proof of concept.

## Acceptance Criteria

- [x] Given a workflow version and an uploaded document (and optional form values), when the user triggers "Run", then all N agents execute in parallel via the OpenAI API with the same input context.
- [x] Given the run result, when complete, then the client receives structured outputs per agent (e.g. agent id / output label + content) and can display them in the results area.
- [x] Given a run failure (e.g. API error, timeout), then the user sees a clear error and partial results if any are available.

## Implementation Tasks

- [x] 4.1 Add backend endpoint (e.g. POST /api/workflows/:id/versions/:versionId/run) that accepts the workflow version id and input (file upload + optional params).
- [x] 4.2 Load workflow definition for the given version; extract document content (or reference) and build shared context for all agents.
- [x] 4.3 For each agent, call OpenAI (o4-mini) with the agent's system prompt and the shared context; run all N calls in parallel (Promise.all or equivalent).
- [x] 4.4 Collect results into a structured response (agent id / output label, content); optionally persist run in run_history (Story 6).
- [x] 4.5 Return results to the client; handle and map errors (e.g. 429, timeouts) to user-facing messages.

## Notes

- Input: single document. Decide whether to send raw text (extracted from file) or a reference; for v1, sending extracted text is simpler. File type and size limits should be documented.
- See [api-spec.md](../sub-specs/api-spec.md) and [technical-spec.md](../sub-specs/technical-spec.md).

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Tests passing (mock OpenAI)
- [x] Run endpoint documented
