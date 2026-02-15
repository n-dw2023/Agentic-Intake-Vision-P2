# Story 6: Chat orchestration and polish

> **Status:** Not Started  
> **Priority:** Medium  
> **Dependencies:** Stories 1–5 (flows exist to orchestrate)

## User Story

**As a** PI or Research Protocol Specialist  
**I want** the chat to guide me with plan–act–report, next-action suggestions, and the ability to stop or resume  
**So that** I stay in control and the app feels responsive and accessible.

## Acceptance Criteria

- [ ] Given any agent operation, when it runs, then the agent posts a one-line plan, shows progress (streaming or stepper), produces an output card/panel, and suggests next best actions (chips).
- [ ] Given a long-running operation, when I click Stop, then processing stops and partial outputs are preserved; I can Resume where supported.
- [ ] Given the app, when I use the keyboard, then I can navigate and activate controls; focus is visible (AA-compliant).
- [ ] Given loading or async states, when content updates, then feedback appears within ~100ms (skeletons or "Working…"); no layout shift where avoidable.
- [ ] Given key actions (extract, edit, confirm, regenerate, submit), when they occur, then an audit-lite log records project_id, action, timestamp, user_id.

## Implementation Tasks

- [ ] 6.1 Implement plan–act–report in chat: for protocol ingest, extraction, project creation, checklist actions, and workspace actions, agent sends plan message, progress indicator, then result card; add "next action" chips that trigger the suggested step.
- [ ] 6.2 Add Stop button during processing; implement cancel or pause for long-running calls; persist partial state and expose Resume when applicable.
- [ ] 6.3 Verify accessibility: keyboard navigation, focus visible, contrast AA for new UI (reuse existing design tokens and components); fix any regressions.
- [ ] 6.4 Verify latency and layout: skeletons or immediate "Working…" for async operations; reserve space for output areas to avoid shift; document any exceptions.
- [ ] 6.5 Ensure audit-lite: log extract, edit (extraction field), confirm, regenerate, submit to audit_log with project_id, action, timestamp, user_id; no PII in log payload unless required.

## Notes

- Chat orchestration can wrap or replace current workflow chat; agent prompts and response shape change to Study Project flows.
- Reuse existing ChatPanel and design system; extend with plan/progress and chips as needed.

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] Plan–act–report and chips verified for at least two flows
- [ ] Stop/Resume and audit-lite verified
