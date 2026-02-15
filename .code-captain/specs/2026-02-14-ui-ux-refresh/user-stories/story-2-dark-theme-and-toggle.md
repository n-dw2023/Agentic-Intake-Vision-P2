# Story 2: Dark theme and theme toggle

> **Status:** Done  
> **Priority:** High  
> **Dependencies:** Story 1 (design tokens and Tailwind)

## User Story

**As a** user of Agent Config  
**I want** a dark theme and a way to toggle between light and dark  
**So that** I can use the app comfortably in low-light environments and match my system or preference.

## Acceptance Criteria

- [x] Given the app is in light mode, when I switch to dark mode, then all surfaces, text, and borders use dark-theme tokens with WCAG AA contrast.
- [x] Given the app is in dark mode, when I switch to light mode, then the UI reverts to the light theme.
- [x] Given the user has not set a preference, when the app loads, then theme may follow system preference (optional) or default to light.
- [x] Given theme is toggled, when I navigate or refresh, then the selected theme persists (e.g. localStorage) so that my choice is remembered.

## Implementation Tasks

- [x] 2.1 Define dark-theme tokens in Tailwind/CSS (background, surface, text, border, accent) and wire to a theme class or data attribute (e.g. `data-theme="dark"`).
- [x] 2.2 Add a theme provider or root-level state (e.g. React state + useEffect) that applies the theme class to the document root and reads/writes persistence (localStorage).
- [x] 2.3 Implement a theme toggle control (e.g. in header or settings) that switches between light and dark and updates persisted preference.
- [x] 2.4 Verify contrast and surface hierarchy in both themes; fix any contrast failures to meet WCAG AA.
- [x] 2.5 Verify acceptance criteria; test toggle and persistence across refresh.

## Notes

- Command palette will later include "Toggle light/dark"; the toggle control can be the same action. This story delivers the underlying theme switching and persistence.

## Definition of Done

- [x] All tasks completed
- [x] All acceptance criteria met
- [x] Both themes pass contrast checks (manual or tool)
- [x] Toggle and persistence tested
