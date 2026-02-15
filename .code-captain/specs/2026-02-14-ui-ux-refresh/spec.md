# UI/UX Refresh Specification

> Created: 2026-02-14  
> Status: Planning  
> Contract Locked: Yes

## Contract Summary

**Deliverable:** Refresh the Agent Config UI so it matches the modern UI/UX rules: portable design tokens (typography, color, spacing, motion), light + dark themes, Tailwind + Radix/shadcn for components, and a full command palette (⌘K / /). Interactions follow the "instant feedback," progressive disclosure, hover-revealed actions, and keyboard-first rules. The existing agentic run flow is unchanged except for clearer loading/result feedback and calmer, inline error handling.

**Must Include:**
- Design system implemented with tokens: typography hierarchy (15–16px body, 13–14px secondary, 18–22px titles), neutral-first palette + one accent, 8px grid, 12–16px radius for interactive surfaces, soft shadows used sparingly; **light and dark** themes.
- **Tailwind** for layout and utility; **Radix primitives + shadcn/ui** for buttons, inputs, selects, menus, dialogs, and consistent focus/accessibility.
- **Command palette (cmdk):** trigger by `/` or `⌘K`; commands: New workflow, My workflows, Search/open workflow by name, Toggle light/dark; when a workflow is open: Run workflow, View agent prompts; plus other context-sensitive actions as appropriate.
- Interaction standards: feedback within ~100ms (optimistic or inline states), progressive disclosure, hover-revealed utility actions on list/table rows, Esc to close transient UI, clear focus rings, **prefers-reduced-motion** respected (150–250ms, subtle easing).
- Calm error handling: inline near cause, recovery actions (e.g. Retry, Copy details), no raw stack traces by default.
- **Accessibility:** keyboard support for all interactive elements, WCAG AA contrast, no layout shift during loading.

**Hardest Constraint:** Migrating the existing plain-CSS UI (chat, workflow list, dynamic form, results) to Tailwind + shadcn without breaking the dynamic form/results interpreter or chat flow, and wiring the command palette to app state (current workflow, workflow list) for context-sensitive commands.

**Success Criteria:**
- UI feels calm, minimal, confident; typographically led; content is the hero.
- Every main action has clear, fast feedback; utility actions discoverable on hover and keyboard.
- Full keyboard navigation and visible focus; light and dark both usable and on-brand.
- Command palette covers the agreed actions and feels consistent with the rest of the app.

**Scope Boundaries:**
- **In scope:** Design tokens (CSS variables + Tailwind config); light + dark themes; Tailwind + Radix/shadcn adoption for header, chat panel, workflow list, workflow view (name/version/actions), dynamic form, results area, dialogs/menus; cmdk command palette with full command set; button/input/list/panel/toast behavior per rules; error handling and loading states; focus, contrast, and reduced-motion.
- **Out of scope for this spec:** "Stop" during run, Activity/audit trail, mid-flight steerable refinement; Framer Motion (use CSS transitions only); list virtualization (defer until 100+ items); backend changes except any minimal support for palette (e.g. workflow list for search).

**Technical Concerns:**
- shadcn is copy-paste; the spec calls out which primitives to adopt (Button, Input, Select, Dialog, DropdownMenu, Toast) and an order of refactor (header → chat → list → form → results) to avoid big-bang risk.
- Command palette must read app state (current workflow id, workflow list, "has proposal") to enable Run, View agent prompts, and search; ensure a single source of truth (e.g. context or props) so palette stays in sync.

**Recommendations:**
- Phasing: (1) Tokens + Tailwind + light theme; (2) Dark theme; (3) Replace components area-by-area; (4) Add cmdk and wire commands in order: New workflow, My workflows, Toggle theme → then Search/open workflow → then Run and View agent prompts when a workflow is open.
- Reuse existing client/src structure (App, ChatPanel, DynamicForm, ResultsArea, etc.) and swap styling and primitives; keep the same data flow and API so the 2026-02-14 spec and wireframes remain valid.

---

## Detailed Requirements

### Design System (Tokens)

- **Typography:** Primary font system sans stack (or Inter if available). Hierarchy: small number of sizes, consistent rhythm. Body 15–16px; secondary 13–14px; titles 18–22px (restrained). Line height 1.5–1.65 for reading-heavy areas. Emphasis via weight and spacing; avoid excessive color.
- **Color:** Neutral-first palette with one accent. Three surface tiers: app background, content surface (panels/sections), elevated surface (menus/dialogs). Borders subtle; prefer separation via spacing and low-contrast dividers. Always support Light + Dark.
- **Spacing & shape:** 8px grid. Radius 12–16px for interactive surfaces. Shadows: soft, low-contrast, used sparingly (menus/dialogs more than cards).
- **Motion:** Duration 150–250ms; easing smooth, not bouncy. Must respect `prefers-reduced-motion`. Use motion for: hover/press feedback, menu/dialog entrance/exit, inline state changes (loading → ready).

### Components (Radix + shadcn)

- **Buttons:** Default neutral, understated; primary accent used sparingly. Subtle hover and active states. Loading state: spinner + preserve width (no layout shift).
- **Inputs:** Large tap targets, clean padding, clear focus ring. Validation: inline message below field.
- **Lists & tables:** Row hover highlights (very subtle). Row actions on hover/right side. Selection (checkbox) only when needed.
- **Cards/panels:** Containers, not decoration. Minimal borders; rely on spacing. Titles small and functional.
- **Menus/popovers:** Rounded, soft shadow, keyboard navigable, dismiss on outside click + Esc.
- **Toasts:** Only for global events (e.g. "Saved", "Failed to sync"). Auto-dismiss, pause on hover; include action when relevant ("Undo").

### Command Palette (cmdk)

- Trigger: `/` or `⌘K`.
- Commands: New workflow, My workflows, Search/open workflow by name, Toggle light/dark. When a workflow is open: Run workflow, View agent prompts. Other context-sensitive actions as appropriate.
- Palette reads app state (current workflow, workflow list, has proposal) for context-sensitive commands.

### Interaction Standards

- **Instant feedback:** Every action yields feedback within ~100ms (optimistic UI, inline spinners/skeletons, subtle working indicators). Disable only the affected control.
- **Progressive disclosure:** Default view clean; advanced controls on hover, in "More" menus, behind expandable "Details," or contextually.
- **Hover-revealed actions:** On hover/focus of items, reveal small action cluster (e.g. Copy, Edit, More). Secondary actions inside "More." Actions never steal attention from content.
- **Keyboard:** Enter = primary action; Shift+Enter = newline where relevant. Esc closes transient layers. Arrow keys navigate lists and menus. Clear focus ring always visible.
- **Layering:** Inline content → Popover/tooltip → Dropdown/menu → Dialog/drawer → Global toast. No random floating UI.

### Error Handling

- Errors inline near the cause. Recovery actions: Retry, Undo, Copy details. Factual, helpful language. No raw stack traces by default (put in "Details").

### Accessibility

- Full keyboard support for all interactive elements. Focus visible and consistent. Contrast meets WCAG AA for text. `prefers-reduced-motion` supported. No layout shift during loading/streaming.

---

## Implementation Approach

1. **Tokens + Tailwind:** Add Tailwind; define design tokens in Tailwind config and/or CSS variables (color, typography, spacing, radius, motion). Implement light theme first.
2. **Dark theme:** Add dark mode tokens and theme toggle; respect system preference where desired.
3. **Component adoption:** Introduce Radix/shadcn primitives in order: header (buttons, links) → chat panel (input, buttons) → workflow list (list items, hover actions) → workflow view (name input, version select, actions) → dynamic form (Input, Select) → results area (panels). Preserve existing component APIs and data flow.
4. **Command palette:** Add cmdk; wire global commands (New workflow, My workflows, Toggle theme); add workflow search using existing list API; add context-sensitive commands (Run, View agent prompts) when workflow is open. Single source of truth for state (e.g. React context or props from App).
5. **Polish:** Error handling (inline, recovery actions); loading states (no layout shift); focus and reduced-motion verification.
