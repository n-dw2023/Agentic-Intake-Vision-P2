# UI/UX Refresh – Spec Lite (AI Context)

> 2026-02-14 | Contract locked

**Goal:** Refresh Agent Config UI to a calm, minimal, typographically led design with tokens, light/dark themes, Tailwind + Radix/shadcn, and full command palette (⌘K). No change to agentic run flow except loading/error polish.

**Stack:** Tailwind, Radix primitives, shadcn/ui (Button, Input, Select, Dialog, DropdownMenu, Toast), cmdk for command palette.

**Phasing:** (1) Tokens + Tailwind + light theme (2) Dark theme (3) Component refresh area-by-area: header → chat → list → form → results (4) cmdk: New workflow, My workflows, Toggle theme → Search/open workflow → Run, View agent prompts when open.

**Rules:** 8px grid; body 15–16px; neutral + one accent; feedback ~100ms; hover-revealed row actions; Esc closes transients; WCAG AA; prefers-reduced-motion; errors inline with Retry/Copy details.

**Out of scope:** Stop run, Activity trail, mid-flight steer, Framer Motion, list virtualization, backend changes.

**Key files:** client/src/App.tsx, ChatPanel.tsx, DynamicForm.tsx, ResultsArea.tsx, index.css → migrate to Tailwind + shadcn; add CommandPalette (cmdk) and theme provider.
