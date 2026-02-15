# User Stories Overview

> **Specification:** Chat-Driven Agentic Workflows  
> **Created:** 2026-02-14  
> **Status:** Planning

## Stories Summary

| Story | Title | Status | Tasks | Progress |
| ----- | ----- | ------ | ----- | -------- |
| 1 | Schema and project foundation | Done | 6 | 6/6 |
| 2 | Generate initial workflow from natural language | Done | 6 | 6/6 |
| 3 | Chat UI and iterative refinement | Done | 6 | 6/6 |
| 4 | Workflow execution (parallel agents) | Done | 5 | 5/5 |
| 5 | Dynamic UI interpreter | Done | 6 | 6/6 |
| 6 | Persistence and versioning | Done | 5 | 5/5 |

**Total Progress:** 34/34 tasks (100%)

## Story Dependencies

- Story 2 depends on Story 1 (schemas and project).
- Story 3 depends on Story 1 and Story 2 (chat refines existing workflow).
- Story 4 depends on Story 1 (workflow schema).
- Story 5 depends on Story 1 (UI spec schema).
- Story 6 depends on Story 1 (DB schema); Stories 2, 3, 4, 5 integrate with Story 6 for persistence.

## Quick Links

- [Story 1: Schema and project foundation](./story-1-schema-and-foundation.md)
- [Story 2: Generate initial workflow from natural language](./story-2-generate-initial-workflow.md)
- [Story 3: Chat UI and iterative refinement](./story-3-chat-and-refinement.md)
- [Story 4: Workflow execution (parallel agents)](./story-4-workflow-execution.md)
- [Story 5: Dynamic UI interpreter](./story-5-dynamic-ui-interpreter.md)
- [Story 6: Persistence and versioning](./story-6-persistence-and-versioning.md)
