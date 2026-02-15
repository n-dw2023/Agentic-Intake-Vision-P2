# Story 5: Command palette (cmdk)

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 4 (app layout and state stable)

## User Story

**As a** user of Agent Config  
**I want** to open a command palette with `/` or `⌘K` and run actions like New workflow, My workflows, Search workflow, Toggle theme, Run, and View agent prompts  
**So that** I can work quickly from the keyboard and discover context-sensitive actions.

## Acceptance Criteria

- [x] Given I press `/` or `⌘K`, when the palette is closed, then it opens with a search/list of commands; when it is open, then Esc closes it.
- [x] Given the palette is open, when I type, then the list filters by command name; I can navigate with arrow keys and activate with Enter.
- [x] Given global commands, when the palette is open, then I see at least: New workflow, My workflows, Toggle light/dark. Executing them performs the same action as the existing UI.
- [x] Given workflow search, when I choose "Search/open workflow by name" or equivalent, then I can filter workflows by name and open one (or the list shows workflow names and Enter opens the selected workflow).
- [x] Given a workflow is open, when the palette is open, then I see context-sensitive commands: Run workflow, View agent prompts (and any other agreed actions). Executing them matches existing behavior.
- [x] Given the palette, when I click outside, then it dismisses; focus returns to the previous element or a sensible default.

## Implementation Tasks

- [x] 5.1 Add cmdk (or equivalent command palette) dependency; implement a CommandPalette component that opens on `/` and `⌘K` and closes on Esc and outside click.
- [x] 5.2 Wire global commands: New workflow, My workflows, Toggle light/dark. Connect to existing app state/handlers (e.g. handleNewWorkflow, setShowList(true), theme toggle).
- [x] 5.3 Add workflow search: fetch or use cached workflow list; show workflow names in the palette; on select, call loadWorkflow(id). Support filtering by name.
- [x] 5.4 Add context-sensitive commands when a workflow is open: Run workflow (trigger handleRun when form valid), View agent prompts (toggle showAgentPrompts). Ensure palette receives current workflow id and state (e.g. via context or props from App).
- [x] 5.5 Style the palette with design tokens (elevated surface, radius, shadow); ensure keyboard navigation and focus ring.
- [x] 5.6 Verify acceptance criteria; test all commands and keyboard flow.

## Notes

- Single source of truth: Command palette must read workflow list, current workflow id, and proposal state from App (or a shared context). Avoid duplicating state.
- Optional: "My workflows" can either open the list view or show workflow names in the palette for quick open; spec says both My workflows and Search/open workflow by name, so implement both entry points if desired (e.g. "My workflows" shows list view; "Open workflow…" shows search in palette).

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] All commands tested (global and context-sensitive)
- [x] Keyboard and Esc/outside click tested
