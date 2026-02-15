# Technical Spec: UI/UX Refresh

> Traceability: All user stories (1–7). Reference: [spec.md](../spec.md), [spec-lite.md](../spec-lite.md).

## Architecture

- **Client only.** No backend API changes except any minimal support for command-palette workflow search (existing `GET /api/workflows` is sufficient).
- **Incremental migration:** Existing client/src structure (App.tsx, ChatPanel, DynamicForm, ResultsArea, etc.) is preserved. Styling moves from [client/src/index.css](client/src/index.css) to Tailwind + CSS variables; components are refactored to use shadcn primitives area-by-area (header → chat → list → form → results).
- **State:** App remains the single source of truth for workflow id, version id, workflow list, proposal, theme. Command palette receives state via React context or props from App so context-sensitive commands stay in sync.

## Stack Additions

| Layer | Choice | Notes |
|-------|--------|--------|
| Styles | Tailwind CSS | Use Vite plugin or PostCSS. Config extends with design tokens. |
| Components | Radix UI + shadcn/ui | Copy-paste only needed primitives. |
| Command palette | cmdk | npm package `cmdk`; trigger `/` and `⌘K`. |
| Font | system-ui or Inter | Optional: add Inter via link or package. |

## Design Tokens (Tailwind theme)

**Story 1 implementation:** Tokens are defined in [client/src/index.css](client/src/index.css) using Tailwind v4’s `@theme` block (no `tailwind.config.js`). The same file defines `:root` variables for the three surface tiers (`--surface-app`, `--surface-content`, `--surface-elevated`) and text/border (`--text-primary`, `--text-secondary`, `--border`) used by the light theme. Base typography and `prefers-reduced-motion` are in `@layer base`. Tailwind is wired via `@tailwindcss/vite` in [client/vite.config.ts](client/vite.config.ts).

Define in `tailwind.config.js` (or equivalent) and/or CSS custom properties for theming.

**Colors (light):**
- App background: neutral-50 or equivalent.
- Content surface: white / neutral-0.
- Elevated (menus, dialogs): white + shadow.
- Text: neutral-900 (primary), neutral-600 (secondary).
- Border: neutral-200.
- Accent: single hue (e.g. blue-600 for primary actions, focus ring).

**Colors (dark):**
- App background: neutral-950.
- Content surface: neutral-900.
- Elevated: neutral-800 + shadow.
- Text: neutral-100 (primary), neutral-400 (secondary).
- Border: neutral-700.
- Accent: same hue, lighter (e.g. blue-400).

**Typography:**
- Font family: `ui-sans, system-ui, sans-serif` or Inter.
- Body: 15–16px (e.g. `text-base`), line-height 1.5–1.65.
- Secondary: 13–14px (e.g. `text-sm`).
- Titles: 18–22px (e.g. `text-lg` / `text-xl`), restrained.

**Spacing:** 8px grid. Use Tailwind spacing scale (e.g. 2, 4, 6, 8 → 8px, 16px, 24px, 32px if scale is 4px-based; or custom scale 8, 16, 24, 32).

**Radius:** 12–16px for interactive surfaces (buttons, inputs, menus, dialogs). Use Tailwind `rounded-xl` or custom `rounded-[12px]` / `rounded-[16px]`.

**Motion:** 150–250ms duration; ease-out or similar. In CSS/Tailwind, use `transition-*` and respect `prefers-reduced-motion` (media query or class on root that sets `transition: none` or very short duration).

## shadcn/ui Components to Adopt

| Component | Use in app |
|-----------|------------|
| Button | Send, Accept/Reject, Run, Save name, Delete, New workflow, theme toggle, command palette trigger. |
| Input | Chat message, workflow name, dynamic form text fields. |
| Select | Version selector, dynamic form select fields. |
| Dialog | Optional: confirm delete, settings. |
| DropdownMenu | Optional: row “More” actions, kebab menus. |
| Toast (or Sonner) | Global “Saved”, “Failed to sync”, optional “Undo”. |

**Order of adoption (refactor):** Header (buttons, links) → ChatPanel (Input, Button) → Workflow list (list items, hover actions, Button) → Workflow view (name Input, version Select, Buttons) → DynamicForm (Input, Select) → ResultsArea (panels, no new primitives beyond layout). Add Toast and Dialog where needed.

**Story 3 implementation:** Primitives live in `client/src/components/ui/`: Button (default + primary variants, `loading` prop with spinner, min-height 40px to avoid layout shift), Input (optional `error` message below, focus ring), Select (Radix Select with token-styled trigger/content/item), Dialog (Radix Dialog, overlay + content with radius and shadow), DropdownMenu (Radix DropdownMenu), Toast (Radix Toast with provider/viewport/root/title/description/action). Styling uses token classes in `client/src/index.css` (`.ui-button`, `.ui-input`, etc.) so light/dark themes apply. Dependencies: `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`, `@radix-ui/react-select`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-toast`. `cn()` in `client/src/lib/utils.ts`. Dialog and dropdown animations respect `prefers-reduced-motion`.

## Command Palette (cmdk)

- **Trigger:** Keydown `/` or `⌘K` (Mac) / `Ctrl+K` (Windows/Linux). Prevent default when palette opens.
- **Close:** Esc, outside click. Focus return: restore focus to previously focused element or body.
- **State:** Palette receives: `workflows: { id, name }[]`, `currentWorkflowId: string | null`, `hasProposal: boolean`, `canRun: boolean`, `theme`, `onNewWorkflow`, `onMyWorkflows`, `onToggleTheme`, `onOpenWorkflow(id)`, `onRun`, `onToggleAgentPrompts`, etc. Prefer a single context (e.g. `AppCommandContext`) provided by App so palette and App stay in sync.
- **Commands (minimum):**
  - New workflow
  - My workflows (show list view)
  - Open workflow… (search by name, then open selected)
  - Toggle light/dark
  - Run workflow (when workflow open and canRun)
  - View agent prompts (when workflow open; toggle)
- **Styling:** Elevated surface, rounded (12–16px), soft shadow, token-based text and background. List item hover/focus and Enter to execute.

## Accessibility

- **Focus:** All interactive elements focusable; visible focus ring (e.g. 2px offset, accent color). Never `outline: none` without a custom ring.
- **Keyboard:** Tab order logical; Enter/Space activate; Esc closes modals/palette; arrow keys in lists and palette.
- **Contrast:** All text and UI elements meet WCAG AA (4.5:1 for normal text, 3:1 for large).
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` or class on root to disable or shorten transitions.

## File and Folder Impact

- **New:** `tailwind.config.js`, `postcss.config.js` (if not present), `client/src/components/ui/` (shadcn components), `client/src/components/CommandPalette.tsx` (or similar), `client/src/context/ThemeContext.tsx` or equivalent, optional `AppCommandContext.tsx`.
- **Modified:** `client/src/index.css` (reduce to Tailwind imports + any base resets/variables), `client/src/App.tsx` (theme provider, command palette, possibly context), `client/src/ChatPanel.tsx`, `client/src/DynamicForm.tsx`, `client/src/ResultsArea.tsx`, and any new wrapper components for list/item.
- **Dependencies:** tailwindcss, radix-ui packages (as required by shadcn), cmdk, and any shadcn peer deps (class-variance-authority, clsx, tailwind-merge if used by shadcn).

## Testing and Verification

- Manual: Light/dark toggle, command palette (all commands), chat send, workflow list open/delete, form submit and run, error and retry.
- Build: `npm run build` in client must pass.
- No regression: Existing behavior (generate, refine, accept, run, list, get version) unchanged; only UI and interaction polish.
