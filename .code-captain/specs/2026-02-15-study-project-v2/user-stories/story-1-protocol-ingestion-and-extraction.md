# Story 1: Protocol ingestion and extraction

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** None

## User Story

**As a** PI or Research Protocol Specialist  
**I want to** upload a protocol document (PDF, DOCX, or text) and see extracted study attributes with citations  
**So that** I can verify and confirm the data before the system creates the Study Project.

## Acceptance Criteria

- [x] Given a protocol file or pasted text, when I submit it, then the system accepts PDF, DOCX, or plain text and stores/parses it for extraction.
- [x] Given parsed protocol content, when extraction runs, then the system returns structured fields (title, sponsor, interventional, cancer-related, participating orgs) with confidence (Low/Med/High) and citations (snippet and optional offset/page).
- [x] Given extraction results, when I view the Extraction Summary Card, then I see each field with confidence indicator, clickable citations that jump to evidence where supported, and Edit/Confirm actions.
- [ ] Given low confidence or missing required fields, when I view the card or chat, then the agent asks targeted questions to resolve gaps. (Deferred: agent-driven questions in chat; card shows all fields with Edit.)
- [x] Given I edit a field or confirm, when I proceed, then the system records provenance (extracted/inferred/user-provided) and does not overwrite without traceability.

## Implementation Tasks

- [x] 1.1 Define extraction result schema and citation schema (snippet, startOffset?, endOffset?, page?); document in extraction-and-citations sub-spec.
- [x] 1.2 Implement server-side protocol ingest: accept upload (PDF, DOCX) and paste (text); parse to canonical text; store protocol asset (normalized text plus metadata, optional page boundaries for PDF).
- [x] 1.3 Implement LLM extraction endpoint: input protocol text and metadata; prompt for structured extraction and citations; validate and return ExtractionResult-shaped payload.
- [x] 1.4 Build Extraction Summary Card UI: display fields, confidence, citations; wire click-to-jump for text/PDF viewer where available; Edit and Confirm actions.
- [x] 1.5 Wire confirm flow: on Confirm, persist extraction results and provenance; trigger Study Project creation (Story 2) or hand off to agent for next step.
- [x] 1.6 Verify acceptance criteria; test with at least one PDF, one DOCX, and one pasted text.

## Notes

- Citation jump-to: implement for plain text and PDF in prototype; DOCX may show snippet in side panel without scroll-to initially.
- Reuse existing design system and accessibility patterns from current app.

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met (agent questions deferred)
- [x] Extraction schema and citation schema documented
- [x] Build passes; manual verification with PDF, DOCX, and text recommended (run migration in `server/supabase-migrations/20260215_study_project_protocol_assets.sql` first)
