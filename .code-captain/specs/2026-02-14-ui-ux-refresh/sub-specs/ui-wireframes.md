# UI / Wireframes: UI/UX Refresh

> Traceability: Stories 4 (chat + list), 5 (command palette), 6 (form + results).  
> Layout and flows remain as in the existing [chat-driven workflows wireframes](../../2026-02-14-chat-driven-agentic-workflows/sub-specs/ui-wireframes.md).

## Layout (unchanged)

- **Header:** App title; "My workflows" link when a workflow is open; optional theme toggle; optional command palette trigger (e.g. ⌘K hint).
- **Main + side:** Main area (workflow list or workflow view with form + results); side panel = chat (right or left). Side panel collapsible or stacking on small viewports per original wireframes.
- **Workflow list:** List of workflows with name and created date/time; hover-revealed actions (open, delete); "New workflow" button.
- **Workflow view:** Workflow name (editable) + Save name + Delete; version selector; "View agent prompts" toggle; dynamic form; Run button; results area.

## Refresh-Specific UI Rules

- **Surfaces:** Use three tiers (app bg, content surface, elevated). No heavy borders; prefer spacing and low-contrast dividers.
- **Lists:** Subtle row hover; utility actions (e.g. open, delete, "More") appear on hover/focus; actions on right or inline without dominating the row.
- **Command palette:** Overlay (elevated surface); search input at top; list of commands below; filter by typing; arrow keys + Enter; Esc and outside click close.
- **Errors:** Inline near the cause (e.g. below form or in results); message factual; actions: Retry, Copy details; optional expandable "Details" for technical info.
- **Loading:** Run button shows spinner and is disabled; results area shows skeleton or "Running…" without layout shift.

## No Layout Change

- This spec does not introduce new pages or structural layout changes. It applies the design system, tokens, and components to the existing Cursor-like layout described in the 2026-02-14-chat-driven-agentic-workflows spec.
