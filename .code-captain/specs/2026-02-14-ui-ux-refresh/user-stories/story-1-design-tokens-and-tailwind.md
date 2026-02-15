# Story 1: Design tokens and Tailwind (light theme)

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** None

## User Story

**As a** developer and end user of Agent Config  
**I want** a design system built on tokens and Tailwind with a light theme  
**So that** the UI is consistent, maintainable, and ready for dark theme and component adoption.

## Acceptance Criteria

- [x] Given the app loads, when I view any screen, then typography uses a defined hierarchy (body 15–16px, secondary 13–14px, titles 18–22px) and system sans (or Inter).
- [x] Given the design system, when I inspect spacing and radius, then layout follows an 8px grid and interactive surfaces use 12–16px radius.
- [x] Given the light theme, when I view surfaces, then I see a neutral-first palette with one accent and three surface tiers (app background, content surface, elevated).
- [x] Given Tailwind is installed, when I build or run the client, then Tailwind processes utility classes and no build errors occur.
- [x] Given motion is used, when `prefers-reduced-motion: reduce` is set, then transitions are disabled or minimal per the spec.

## Implementation Tasks

- [x] 1.1 Add Tailwind CSS to the client (vite + PostCSS or Tailwind Vite plugin); ensure existing layout still renders.
- [x] 1.2 Define design tokens in Tailwind config: colors (neutral palette + one accent), font sizes and line heights, spacing scale (8px grid), border radius scale.
- [x] 1.3 Add CSS variables (or Tailwind theme) for the three surface tiers and text/border colors for light theme.
- [x] 1.4 Apply base typography (font family, body size, line height) to the app root; verify hierarchy in header, chat, and main content.
- [x] 1.5 Document token usage in sub-specs/technical-spec.md (or confirm technical-spec already references this story).
- [x] 1.6 Verify acceptance criteria; run client build and manual check for light theme and reduced-motion.

## Notes

- Preserve existing client behavior; this story is additive (Tailwind + tokens). Migration of existing index.css to Tailwind utilities can be incremental in later stories.
- If Inter is desired, add via font link or npm; otherwise system-ui stack is sufficient per spec.

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Client builds successfully
- [x] Documentation updated (technical-spec)
