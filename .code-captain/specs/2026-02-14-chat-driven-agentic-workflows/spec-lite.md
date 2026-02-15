# Chat-Driven Agentic Workflows (Lite)

> AI context summary for implementation.

**Goal:** Web app where a non-technical user describes a problem in chat; system (OpenAI o4-mini) produces an agentic workflow (N parallel agents + JSON prompts) + declarative UI spec; user runs it, iterates via chat, versions saved to DB.

**Workflow model:** One input (e.g. uploaded doc) → N agents in parallel → N outputs. Each agent has its own prompt; no DAG in v1.

**UX:** Cursor-like side chat. Describe problem → get workflow + UI → run → refine in chat → accept → new version saved. No AI-generated code execution; UI = one interpreter + generated UI spec (JSON).

**Tech:** Strict JSON schemas for workflow and UI spec; validate all AI output. Backend: generate, refine, run (parallel OpenAI), CRUD/versions. DB: Supabase recommended (Postgres + Auth). Front-end: dynamic form + results from UI spec.

**First use case:** One document → N draft documents (e.g. summary, technical brief, press release); one agent per draft, parallel execution.

**Out of scope v1:** Arbitrary DAGs, generated runnable UI code, multi-document input, sharing/collaboration.
