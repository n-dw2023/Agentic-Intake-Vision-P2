# Story 3: Chat UI and iterative refinement

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 1, Story 2

## User Story

**As a** non-technical user  
**I want to** refine the workflow and UI via chat (Cursor-like)  
**So that** I can improve the solution without editing JSON or code, and each accepted change is versioned.

## Acceptance Criteria

- [ ] Given an existing workflow, when the user sends a refinement message in chat (e.g. "add an agent for a one-pager"), then the system returns a proposed updated workflow and/or UI spec.
- [ ] Given a proposed update, when the user accepts, then a new version is saved and the UI reflects the new workflow/spec.
- [ ] Given the chat, when the user sends a message, then the conversation context includes the current workflow/spec so the model can propose coherent changes.
- [ ] Chat is available in a side panel; the main area shows the current workflow and interpreted UI (from Story 5).

## Implementation Tasks

- [x] 3.1 Implement chat side panel UI: message list, input, and send (no persistence of chat history required for v1; can keep in memory per session).
- [x] 3.2 Add backend endpoint (e.g. POST /api/workflows/:id/refine) that accepts the current version id, workflow, UI spec, and the user's refinement message.
- [x] 3.3 Implement refinement prompt: include current workflow + UI spec + user message; ask model to output updated workflow + UI spec; validate response.
- [x] 3.4 On valid response, return proposed workflow and UI spec to the client; client shows "Accept" / "Reject" or similar.
- [x] 3.5 On accept, persist new version (Story 6) and update client state; on reject, discard or allow further chat.
- [x] 3.6 Verify acceptance criteria and add tests for refine endpoint (mock OpenAI).

## Notes

- Refinement can be full replacement (model outputs complete new workflow + spec) or future: delta/diff. v1 full replacement is simpler.
- See [api-spec.md](../sub-specs/api-spec.md) and [ui-wireframes.md](../sub-specs/ui-wireframes.md).

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Chat UX documented
