# Study Project V2 (Lite)

> AI context summary for implementation.

**Goal:** Pivot Agent Config into a Study Project product. PI/RPS creates a study project via agentic chat: upload protocol (PDF/DOCX/text) → LLM extraction with citations → user confirms → Study Project ID (YYYY-######) → dynamic checklist (conditional items/sub-items) → workspaces per item: document generation (draft + evidence + approval) or intake (field map + validation + submit).

**Flow:** Chat orchestrates. Protocol upload → Extraction Summary Card (confidence, citations, edit/confirm) → Project Created card → Checklist Panel (status pills, Start/View draft/Map data/Submit/Regenerate) → Document workspace (preview, evidence, regenerate with reason, approval gate) or Intake workspace (field map, evidence viewer, exceptions, submit gate).

**Data:** StudyProject (id YYYY-######, title, sponsor, flags, participating_orgs, protocol_asset_id); ChecklistItem (type, status, artifact_ids, intake_payload_id); Artifact (content, version); ExtractionResult (field, value, confidence, citations, provenance). Provenance on every value; no silent overwrites.

**Tech:** Protocol parsing (PDF/DOCX/text) server-side; LLM extraction with structured output + citation schema; citation schema (snippet, startOffset?, endOffset?, page?) for jump-to; checklist engine (declarative rules + state machine); reuse chat panel and design system. DB: study_projects, checklist_items, artifacts, extraction_results, protocol_assets, audit_log.

**Success:** Upload → extraction with citations; confirm → ID assigned; checklist with conditional items; document workspace approve; intake workspace field map, resolve missing, submit.

**Out of scope prototype:** Full audit/compliance; real Epic/Florence integrations; multi-tenant.
