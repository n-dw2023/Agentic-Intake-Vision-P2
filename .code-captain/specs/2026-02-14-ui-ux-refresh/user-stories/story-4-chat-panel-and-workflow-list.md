# Story 4: Chat panel and workflow list

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 3 (shadcn components)

## User Story

**As a** user of Agent Config  
**I want** the chat panel and workflow list to use the new design system and components  
**So that** the UI feels calm, minimal, and content-first with discoverable hover-revealed actions on the list.

## Acceptance Criteria

- [x] Given the chat panel, when I view it, then it uses the token-based typography, surfaces, and spacing; the input and send button use shadcn Button/Input.
- [x] Given the workflow list (My workflows), when I view it, then each row has subtle hover highlight and hover-revealed utility actions (e.g. open, delete) that do not dominate the content.
- [x] Given any list or panel, when I use the keyboard, then I can navigate and activate items; focus ring is visible.
- [x] Given the layout, when I resize or use a small viewport, then the side panel remains usable (e.g. collapsible or stacking per existing wireframes).

## Implementation Tasks

- [x] 4.1 Refactor ChatPanel to use shadcn Input for the message field and Button for Send; apply tokens for background, border, and text. Preserve existing props and behavior (onSend, disabled, messages, proposal, onAccept/onReject).
- [x] 4.2 Style chat messages (user/assistant) with token-based colors and spacing; keep content legible and hierarchy clear.
- [x] 4.3 Refactor workflow list items to use token-based surfaces and spacing; add hover-revealed action cluster (e.g. open, delete) that appears on row hover/focus without overwhelming the row.
- [x] 4.4 Ensure list and chat panel support keyboard navigation (arrow keys, Enter) and visible focus; Esc closes any transient UI.
- [x] 4.5 Verify responsive/collapsible behavior of the side panel if specified in wireframes; otherwise document as future improvement.
- [x] 4.6 Verify acceptance criteria; test chat send and workflow list open/delete flows.

## Notes

- Preserve all existing data flow and API (listWorkflows, loadWorkflow, handleDelete, etc.). This story is a visual and component swap, not a behavior change.
- Traceability: Story 3 (chat), Story 5 (dynamic interpreter) in original wireframes; this story aligns chat and list with the new system.

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Chat and list flows tested manually
- [x] No regressions in proposal accept/reject or workflow load/delete
