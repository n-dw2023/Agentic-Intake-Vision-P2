# Story 7: Error handling and polish

> **Status:** Done  
> **Priority:** Medium  
> **Dependencies:** Story 3 (components); can overlap with Stories 4–6

## User Story

**As a** user of Agent Config  
**I want** errors to appear inline near the cause with recovery actions (Retry, Copy details) and no raw stack traces  
**So that** I can recover from failures without feeling overwhelmed and without layout or motion issues.

## Acceptance Criteria

- [x] Given an error occurs (e.g. run failed, load failed), when it is displayed, then it appears inline near the cause (e.g. below form or in results area); message is factual and helpful; no raw stack trace by default.
- [x] Given an error is shown, when applicable, then recovery actions are available: e.g. Retry, Copy details (details may expand to show technical info).
- [x] Given the app uses motion, when the user has `prefers-reduced-motion: reduce`, then transitions are disabled or duration is minimal (e.g. 0ms or very short).
- [x] Given loading or async states, when content updates, then there is no layout shift (reserve space or use skeletons); buttons show loading state without shifting width.

## Implementation Tasks

- [x] 7.1 Audit current error display (e.g. app-error, results-error, chat/API errors); refactor to inline placement and token-based styling. Add "Copy details" and optional expandable technical details where appropriate.
- [x] 7.2 Add Retry (or equivalent) for recoverable errors (e.g. run failed, fetch failed); wire to existing handlers.
- [x] 7.3 Add global CSS or Tailwind handling for `prefers-reduced-motion: reduce` (e.g. reduce transition duration or set to none) for all motion used in the app.
- [x] 7.4 Verify loading states across chat, run, and list: no layout shift; disabled states and spinners applied consistently.
- [x] 7.5 Verify acceptance criteria; test error and reduced-motion scenarios.

## Notes

- Calm error handling is a cross-cutting requirement; this story consolidates and verifies it. Some work may already be done in Stories 3–6 (e.g. inline validation in form).
- Toast (from Story 3) can be used for global success/failure (e.g. "Saved", "Failed to sync") with optional "Undo" where applicable.

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Error and recovery flows tested
- [x] Reduced-motion and layout-shift verified
