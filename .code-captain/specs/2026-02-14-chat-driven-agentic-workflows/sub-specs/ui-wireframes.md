# UI / Wireframes: Chat-Driven Agentic Workflows

> Traceability: Story 3 (chat), Story 5 (dynamic interpreter).

## Layout (Cursor-like)

- **Side panel (left or right):** Chat. List of messages (user + assistant). Input at bottom. Send button. No need to persist chat history in v1; session-only is acceptable.
- **Main area:** 
  - Top: Workflow name and optional "Version" selector or "Latest".
  - Middle: Dynamic form driven by UI spec (file upload + any additional fields). Prominent "Run" button.
  - Below: Results area — one block per result section (from UI spec), filled after a successful run. Loading state while run is in progress.
- **Optional:** Small "New workflow" or "Describe a new problem" entry point that focuses chat and clears main area until a new workflow is generated.

## Chat Flow

1. User types a description (e.g. "I want to upload one document and get an executive summary, a technical brief, and a press release") and sends.
2. Assistant responds with a short confirmation and generates workflow + UI spec; when ready, main area updates to show the new workflow form and result sections.
3. User can run the workflow (upload doc, click Run) and see results.
4. User can send another message (e.g. "Add an agent for a one-pager") → assistant proposes updated workflow/spec; user sees "Accept" / "Reject" or equivalent; on accept, main area updates and a new version is saved.

## Dynamic Form (interpreter)

- **File upload:** One primary input for "document" (type: file). Accept types and max size per product decision (e.g. PDF, DOCX, TXT; max 10 MB). Show file name after selection.
- **Other fields:** If UI spec includes `text`, `select`, etc., render them with labels and required indicator. Map field ids to run request payload.
- **Run button:** Disabled until required fields (e.g. file) are present. On click: upload file and payload to run endpoint; show loading; on success, pass results to results renderer; on error, show message.

## Results Area

- **Before run:** Placeholder per section (e.g. section label and "Run to generate" or empty).
- **After run:** For each section, show the corresponding agent output (by outputLabel/agentId). Prefer plain text or safe HTML (if you allow limited markdown, render in a safe way). No raw HTML from the model in v1 to avoid XSS.

## Accessibility and Responsiveness

- Use semantic form elements and labels; ensure keyboard navigation and screen reader support.
- Side panel should be collapsible or responsive (e.g. stack below main on small screens) so the form and results remain usable.

## No Custom Code

- All layout and behavior above are implemented once in the app. The UI spec only drives: which form fields exist, their labels/types, and which result section maps to which agent output. No custom components or code generated per workflow.
