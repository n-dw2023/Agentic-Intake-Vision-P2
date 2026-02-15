# Story 1: Schema and project foundation

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** None

## User Story

**As a** developer  
**I want to** have a defined workflow schema, UI spec schema, and project structure  
**So that** generation and interpreter can rely on strict, validated structures and the app can be built consistently.

## Acceptance Criteria

- [x] Given a workflow definition, when validated against the schema, then invalid shapes are rejected with clear errors.
- [x] Given a UI spec, when validated against the schema, then invalid shapes are rejected with clear errors.
- [x] Given the project repo, when a new developer clones it, then they can run the app (front-end and backend) and tests with minimal setup.
- [x] Given the database, when migrations run, then tables for workflows, versions, and (optionally) runs exist and match the schema.

## Implementation Tasks

- [x] 1.1 Create project structure (monorepo or separate front/back), package.json, and tooling (TypeScript, lint, test).
- [x] 1.2 Define workflow JSON schema (agents array: id, name, systemPrompt, outputLabel; input type: e.g. single file).
- [x] 1.3 Define UI spec JSON schema (form: fields with type/label/required; results: sections keyed by agent/output).
- [x] 1.4 Implement validation utilities (or use a validator) for workflow and UI spec against schemas.
- [x] 1.5 Document database schema (workflows, workflow_versions, run_history if needed) and add migrations (e.g. Supabase).
- [x] 1.6 Verify acceptance criteria and add unit tests for validation.

## Notes

- Keep workflow schema v1 minimal: single input type (e.g. `document`), N agents, no branching. UI spec should support file upload + optional form fields and result sections.
- See [technical-spec.md](../sub-specs/technical-spec.md) and [database-schema.md](../sub-specs/database-schema.md).

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Schemas documented in sub-specs
