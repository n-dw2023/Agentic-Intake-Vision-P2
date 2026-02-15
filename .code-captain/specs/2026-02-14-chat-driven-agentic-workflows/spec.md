# Chat-Driven Agentic Workflows Specification

> Created: 2026-02-14  
> Status: Planning  
> Contract Locked: Yes

## Contract Summary

**Deliverable:** A web app where a non-technical user describes a problem in chat; the system (OpenAI o4-mini) produces an initial agentic workflow (N parallel agents, each with JSON prompts) plus a declarative UI spec; the user runs it as a proof of concept, iterates via the same chat to refine workflow and UI, and all versions are saved to the database.

**Must Include:** Natural-language to initial workflow + UI spec; Cursor-like chat where the AI produces/refines workflow and UI; one interpreter that renders a dynamic form and results from the UI spec (no execution of AI-generated code); parallel execution of N agents from one shared input; versioned persistence (Supabase recommended; Neon alternative).

**Hardest Constraint:** Reliably generating both workflow definition and UI spec from natural language in one shot (and on refinement turns) while keeping schema strict enough for a single, safe interpreter.

**Success Criteria:**
- User can describe the "one document to many drafts" use case and receive a runnable workflow (upload doc, N agents with distinct prompts, N draft outputs).
- User can run the workflow once (upload, execute, see results) and iterate via chat to change agents/prompts/UI; each accepted refinement is saved as a new version.
- UI is entirely driven by the generated spec (no hand-coded forms per workflow).

**Scope Boundaries:**
- **In scope:** Chat-driven workflow + UI spec generation and refinement; versioned storage; parallel N-agent execution (OpenAI o4-mini); single document upload as input; one dynamic form/results interpreter; first use case = multiple draft documents from one source.
- **Out of scope for v1:** Arbitrary DAGs (v1 = one input to N parallel agents); AI-generated runnable UI code (Option B); multi-document or complex input shapes; public sharing or multi-tenant collaboration.

**Technical Concerns:**
- Structured generation: Workflow and UI spec should be generated against a strict schema (e.g. JSON Schema or typed structure) with validation so invalid outputs do not break the interpreter.
- Database: Supabase recommended (Postgres, Auth, optional Realtime) for user-scoped workflows and versions; Neon viable if you prefer serverless Postgres and will add auth elsewhere.
- Token usage: Generating workflow + UI spec on every refinement can add cost; consider caching or delta updates in a later iteration.

**Recommendations:**
- Define workflow schema and UI spec schema up front and use them in the prompt (and validation) so model output is parseable and safe to render.
- Start with a single "document upload, run, show N results" template in the interpreter; extend the UI spec (e.g. extra form fields, layout hints) once that is stable.
- Implement "run workflow" as a dedicated backend path that accepts workflow id/version and input (e.g. file + params), runs N agents in parallel, and returns structured results for the interpreter.

---

## Detailed Requirements

### Workflow Model
- One workflow = one shared input (e.g. uploaded document) + N agent nodes.
- Each agent has a distinct role/prompt and produces one output (e.g. one draft document).
- Execution: all N agents run in parallel against the same input; results are collected and presented per agent.

### Chat and Iteration
- Primary UX: Cursor-like side chat. User describes the problem; system generates initial workflow + UI spec and presents it.
- User can run the workflow (upload, execute, view results) and continue chatting to refine (e.g. "add an agent for a one-pager", "make the technical brief more formal").
- Refinement: AI proposes updated workflow and/or UI spec; user accepts; new version is saved. No execution of AI-generated code; only structured workflow and UI spec are stored and rendered.

### Front-End (v1 = Option C)
- AI generates a declarative UI spec (JSON): form sections, field types (e.g. file upload, text, dropdown), labels, and bindings to workflow inputs/outputs.
- The app has one interpreter: a dynamic form (for inputs) and a results view (for per-agent outputs). All workflow-specific UI is driven by this spec.

### Persistence and Versioning
- Workflow definition and UI spec are stored per user (user-scoped).
- Each accepted generation or refinement creates a new version; previous versions are retained for history/rollback.
- Recommendation: Supabase (Postgres + Auth). Alternative: Neon for Postgres with auth handled separately.

### First Use Case
- Upload a single document; provide (or generate) specific prompting/context per agent; generate multiple draft documents from the original (e.g. executive summary, technical brief, press release). Each draft is produced by one agent in parallel.

---

## Implementation Approach

1. **Schema-first:** Define and document the workflow JSON schema and UI spec JSON schema before implementing generation or interpreter. Use these in prompts and in validation.
2. **Backend:** API for (a) generate initial workflow + UI spec from natural language, (b) refine workflow + UI spec from chat message + current version, (c) run workflow (id/version + input) with parallel OpenAI calls, (d) CRUD and version list for workflows.
3. **Front-end:** Single-page app with side chat panel; main area shows current workflow summary and the interpreted UI (form + results). Run triggers backend execution; results are rendered according to UI spec.
4. **Database:** Tables for users (or use Supabase Auth), workflows (metadata), workflow_versions (workflow def + UI spec snapshot), and optionally run_history for debugging/display.
