# Story 3: Component refresh (shadcn primitives)

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 1 (Tailwind and tokens)

## User Story

**As a** developer and user of Agent Config  
**I want** core UI components (buttons, inputs, selects, etc.) to use Radix + shadcn  
**So that** interactions are accessible, consistent, and aligned with the design rules (focus ring, hover, loading states).

## Acceptance Criteria

- [x] Given any button, when I focus or hover, then I see a clear focus ring and subtle hover/active states; loading state shows a spinner and preserves width.
- [x] Given any text input or select, when I interact, then tap targets are large, padding is clean, and validation messages appear inline below the field.
- [x] Given a dropdown or menu, when I open it, then it is keyboard navigable, rounded, with soft shadow, and dismisses on outside click and Esc.
- [x] Given the app uses shadcn, when I build, then only the adopted components (Button, Input, Select, Dialog, DropdownMenu, Toast) are present; no unnecessary bloat.

## Implementation Tasks

- [x] 3.1 Set up shadcn/ui in the client (init or manual add of Radix primitives + shadcn components). Configure to use existing Tailwind and design tokens.
- [x] 3.2 Add Button variant(s): default (neutral), primary (accent). Ensure loading state (spinner + disabled) and no layout shift.
- [x] 3.3 Add Input and Select (or equivalent) with large tap targets, focus ring, and support for inline error message below field.
- [x] 3.4 Add Dialog and DropdownMenu (or Menu) primitives; style with 12–16px radius and soft shadow; verify Esc and outside click dismiss.
- [x] 3.5 Add Toast (or Sonner) for global notifications; ensure auto-dismiss and optional action (e.g. "Undo").
- [x] 3.6 Verify acceptance criteria; run a11y checks (keyboard, focus visibility) on at least one flow.

## Notes

- Components are adopted incrementally; this story establishes the primitives. Stories 4 and 6 will replace existing chat/list/form/results usage with these components.
- Respect prefers-reduced-motion in any component-level motion (e.g. dialog open/close).

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Adopted components documented in technical-spec.md
- [x] Keyboard and focus tested
