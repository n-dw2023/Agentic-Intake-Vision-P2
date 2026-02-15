# Study Project (Product Objective V2) Specification

> Created: 2026-02-15  
> Status: Planning  
> Contract Locked: Yes

## Contract Summary

**Deliverable:** Pivot the existing Agent Config app into a Study Project product. A PI or Research Protocol Specialist creates a Study Project through agentic chat: upload protocol (PDF, DOCX, or text) → system extracts key attributes with citations → user confirms → system issues Study Project ID (YYYY-######) → dynamic checklist renders (conditional items and sub-items) → each checklist item opens an interactive workspace (document generation: draft + evidence + approval; or intake creation: field map + validation + submit). Chat orchestrates; outputs appear as panels/cards; human-in-the-loop at extraction confirm, approval gates, and submit.

**Must Include:**
- Protocol ingestion (PDF, DOCX, plain text) and LLM-based extraction returning field values plus citations (quoted snippets or offsets) for title, sponsor, interventional, cancer-related, participating orgs.
- Extraction Summary Card: show extracted fields with confidence, citations (click to jump to evidence), edit/confirm; agent asks targeted questions when confidence low.
- Study Project ID assignment (YYYY-######) after confirmation.
- Dynamic checklist driven by flags and user selections (conditional items and sub-items per spec).
- Two workspace types: (1) Document generation — draft preview, sources/evidence, regenerate with reason, approval gate; (2) Intake creation — field map (required field, proposed value, source, confidence, validation), protocol evidence viewer, exceptions/questions, submit gate with validation and confirmation.
- Provenance on every proposed value (extracted / inferred / user-provided); no silent overwrites.

**Hardest Constraint:** Reliably getting from LLM both structured extraction (typed fields, confidence) and citations that can be used for "jump to evidence" across PDF, DOCX, and text. This requires a clear contract: how citations are represented (e.g. snippet text, character offsets in a canonical document text, or page + region for PDF), and how the viewer resolves them for each format.

**Success Criteria:**
- Upload protocol → extraction summary with citations; user can edit and confirm.
- System creates Study Project ID YYYY-######.
- Checklist renders with correct conditional items and sub-items.
- Document workspace: draft appears, evidence view works, user can approve.
- Intake workspace: field map shows required fields; missing/conflict triggers agent question; user supplies; validation passes; submit completes.

**Scope Boundaries:**
- **Included:** Protocol upload (PDF/DOCX/text); LLM extraction + citations; extraction summary card and confirm flow; Study Project ID; dynamic checklist (state machine: Not started → In progress → Needs review → Ready to submit → Complete / Blocked); document-generation workspace (draft, evidence, regenerate, approval); intake workspace (field map, evidence viewer, exceptions, submit gate); chat as orchestrator (plan–act–report, suggest next actions); interruptibility (Stop / Resume); audit-lite (log key actions); accessibility (keyboard, focus, AA contrast); prototype-grade latency (feedback within ~100ms).
- **Excluded for prototype:** Full audit trail and compliance reporting; real downstream integrations (Epic, Florence, etc.) — submit can write to backend only; multi-tenant/collaboration; arbitrary document types beyond protocol.

**Technical Concerns:**
1. Citation format and jump-to: define minimal citation schema and implement jump-to for at least plain text and PDF in prototype.
2. PDF/DOCX parsing: server-side parsing to extract text and optionally page boundaries for PDF.
3. Checklist conditional logic: encode rules in a declarative structure (rules + item IDs + parent/child).
4. Intake required fields: schema per intake type or shared schema with type-specific subsets.

**Recommendations:**
- Define extraction result schema and citation schema up front; use in LLM prompt and validate model output.
- Store protocol asset as normalized text + metadata (e.g. for PDF: text plus page boundaries).
- Implement checklist engine as a single module: input = project flags + user selections; output = visible items and allowed transitions.
- Audit-lite: log (project_id, action, timestamp, user_id) for extract, edit, confirm, regenerate, submit.

---

## Detailed Requirements

### Target Users
- **Principal Investigator (PI):** speed, minimal friction, confidence in correctness.
- **Research Protocol Specialist (RPS):** completeness, traceability, intake readiness.
- **Primary job:** "Turn a protocol into an initialized study project + all downstream activation artifacts, with clear confirmation points."

### Interaction Model
- **Chat** is the orchestrator (plans, asks questions, reports progress).
- Dynamic outputs are rendered as interactive panels/cards adjacent to or inline with chat.
- User can act on outputs (edit fields, check boxes, approve, regenerate, submit).
- **UI regions (layout-flexible):** Chat Thread; Output Surface (Checklist, Draft Docs, Intake Mapper, Comparison View); Artifact Viewer (document preview + diff tools). Implement as split-pane, tabs, drawer, or inline expansions — spec is behavior-first.

### End-to-End Flow

**Step A — Start Project**
- Entry: "Create Study Project" button or "New chat" with agent prompt.
- Agent asks for protocol upload (drag/drop). If user cannot upload, allow paste text or link (optional for v2).

**Step B — Protocol Ingestion & Extraction**
- Required extracted fields (v1): Study Title, Sponsor, Interventional trial? (boolean), Cancer-related? (boolean), Participating Organizations (user-confirmed list).
- Output: Extraction Summary Card with confidence (Low/Med/High), citations to protocol snippets (click to jump), Edit per field, Confirm to proceed.
- Agent: if confidence Low or missing, ask targeted question(s); otherwise propose values and ask for confirmation.

**Step C — Assign Study Project ID**
- After user confirms extraction: system generates Study Project ID YYYY-######.
- Output: Project Created card (Project ID, Title, Sponsor, Tags, Participating Orgs).

**Step D — Generate Dynamic Checklist**
- Items based on extracted flags and user selections. Base + conditional items and sub-items per product spec (e.g. if Interventional AND Cancer-related → additional items; selecting "Generate Patient Care Schedule" → sub-items CCA, Epic Build Intake, Lab Manual → Lab Processing Intake, etc.).
- Checklist Panel: each item has status pill (Not started / In progress / Needs review / Ready to submit / Complete) and actions: Start, View draft, Map data, Submit, Regenerate (with reason).

### Checklist Item Workspaces

**Document Generation Workspace (e.g. Consent Form)**
- Tabs/sections: Draft Document Preview; Sources / Evidence; Edit & Regenerate Controls; Approval Gate.
- Preview: in-app reading (PDF/HTML) + copy/export. Evidence tab: citations from protocol. Regenerate: user picks reason (tone/format change, fix incorrect content, include missing section). Approval: checkbox "I have reviewed and confirm accuracy" then Mark complete / Submit.

**Intake Creation Workspace (e.g. Start Epic Build Intake)**
- Field Map Table: Required Field, Proposed Value, Source (citation or user-provided), Confidence, Validation state (OK / Missing / Needs attention); inline edit for Proposed Value.
- Protocol Evidence Viewer: click citation to highlight source text.
- Exceptions / Questions: agent lists unresolved questions; user answers inline.
- Submit Gate: all required fields populated, user confirmation checkbox, submit writes to backend.

### Agent Orchestration
- Plan–Act–Report: agent posts 1-line plan, shows progress (streaming or stepper), produces output card/panel, suggests next best actions (chips).
- Interruptibility: Stop button during processing; if stopped, preserve partial outputs with Resume.
- Transparency: every extracted value has citation or "inferred" or "user-provided"; edits tracked, no silent overwrites.

### Data Model (Minimum Viable)
- **StudyProject:** id (YYYY-######), title, sponsor, flags (interventional, cancer_related), participating_orgs[], protocol_asset_id, created_by, status.
- **ChecklistItem:** id, project_id, type (enum), status, dependencies/subitems, artifact_ids[], intake_payload_id (optional).
- **Artifact:** id, project_id, type (doc, form, manual), content (html/markdown) + export pdf, version, created_at.
- **ExtractionResult:** field_name, value, confidence, citations[] (protocol offsets), provenance (extracted/inferred/user).

### Checklist Item State Machine
- Statuses: Not started, In progress, Needs review, Ready to submit, Complete, Blocked.
- Rules: Generation ends in Needs review; user approve → Ready to submit (if submission); submit success → Complete; missing required fields → Blocked.

### Guardrails & Validation
- Required fields for project creation must be confirmed by user.
- Intake submissions: all required fields populated, user confirmation checkbox, record of provenance.
- Regeneration requires reason and preserves prior versions.

### Non-Functional (Prototype-Grade)
- Latency: feedback within ~100ms (skeletons / "Working…").
- Accessibility: keyboard navigable, focus visible, AA contrast.
- Audit-lite: log actions (extract, edit, regenerate, submit) per project.

---

## Implementation Approach

1. **Schema-first:** Define extraction result schema, citation schema, and checklist rule structure before implementation. Use in LLM prompts and validate all model output.
2. **Backend:** Replace or extend current workflow APIs with: protocol ingest (upload/store/parse PDF/DOCX/text), extract (LLM + citation extraction), confirm extraction, create study project (assign ID, persist entities), checklist CRUD and state transitions, artifact generation and versioning, intake field map and submit. Protocol parsing and storage with normalized text + metadata for citations.
3. **Front-end:** Pivot from workflow list + run to Study Project flow: chat as orchestrator; Output Surface for Extraction Summary, Project Created, Checklist Panel; workspaces (document and intake) as panels/drawers/tabs; artifact viewer with citation jump-to. Reuse existing chat panel, design system, and accessibility patterns.
4. **Database:** New tables for study_projects, checklist_items, artifacts, extraction_results, protocol_assets, audit_log; migrate or retire workflow/workflow_versions as needed for pivot.
