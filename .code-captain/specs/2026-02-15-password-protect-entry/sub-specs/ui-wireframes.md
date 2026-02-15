# UI Wireframes: Entry Gate

**Spec:** [Password-Protect Entry](../spec.md)

## Gate Screen (Full Viewport)

- **Layout:** Full-screen overlay that covers the entire viewport. No app chrome (header, nav, study projects) visible.
- **Content:**
  - Title or app name (e.g. "Agent Config" or "Enter password to continue").
  - Single **password** input (type="password"), placeholder optional (e.g. "Password").
  - **Submit** button (e.g. "Continue" or "Log in").
  - **Error area:** Below the button or under the input; only visible when login returns 401. Text e.g. "Incorrect password." Use existing app error styling (red or muted text).
- **Behavior:** On submit, disable button and show loading state if desired; call `POST /api/auth/login` with `{ password }`. On success → hide gate and show app. On 401 → show error, re-enable submit, keep gate visible.
- **Accessibility:** Label for password field, focus on password input when gate is shown, submit on Enter.

## Optional: Logout

- **Placement:** In the main app (e.g. header or user menu). Single "Log out" link or button.
- **Behavior:** Call `POST /api/auth/logout`, then clear client auth state and show the gate again.

No detailed pixel mockup required; the above is sufficient for implementation. Use existing design system (Tailwind/Stitches) for inputs and buttons.
