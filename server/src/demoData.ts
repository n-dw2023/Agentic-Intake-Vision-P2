/**
 * Hard-coded demo data to bypass LLM processing for demonstrations.
 * When adding features (artifacts, intake payloads, new checklist fields), update the demo
 * so it continues to show an end-to-end example workflow.
 */

export const DEMO_PROTOCOL_TEXT = `Demo Protocol for Study Project
This is sample protocol text used for demonstration. The study is interventional and cancer-related.
Sponsor: Demo Sponsor Inc.
Participating sites: Site A, Site B, Site C.`;

export const DEMO_EXTRACTION_RESULTS = [
  {
    field_name: "title",
    value: "Demo interventional cancer study",
    confidence: "high",
    citations: [{ snippet: "Demo Protocol for Study Project", page: 1 }],
    provenance: "extracted",
  },
  {
    field_name: "sponsor",
    value: "Demo Sponsor Inc.",
    confidence: "high",
    citations: [{ snippet: "Sponsor: Demo Sponsor Inc.", page: 1 }],
    provenance: "extracted",
  },
  { field_name: "interventional", value: true, confidence: "high", citations: [], provenance: "extracted" },
  { field_name: "cancer_related", value: true, confidence: "high", citations: [], provenance: "extracted" },
  {
    field_name: "participating_orgs",
    value: ["Site A", "Site B", "Site C"],
    confidence: "high",
    citations: [{ snippet: "Participating sites: Site A, Site B, Site C", page: 1 }],
    provenance: "extracted",
  },
];

/** Demo checklist item overrides: example workflow (mix of statuses, one not needed). */
export const DEMO_CHECKLIST_ITEMS: Array<{
  itemId: string;
  status?: "not_started" | "in_progress" | "needs_review" | "ready_to_submit" | "complete" | "blocked";
  not_needed?: boolean;
}> = [
  { itemId: "gtmr_irb", status: "complete" },
  { itemId: "generate_consent_form", status: "in_progress" },
  { itemId: "florence_ebinder", status: "not_started" },
  { itemId: "patient_care_schedule", status: "in_progress" },
  { itemId: "cca", status: "needs_review" },
  { itemId: "epic_build_intake", status: "not_started" },
  { itemId: "lab_manual", status: "complete" },
  { itemId: "lab_processing_intake", not_needed: true },
  { itemId: "radiology_manual", status: "not_started" },
  { itemId: "radiology_intake", status: "not_started" },
  { itemId: "pharmacy_manual", status: "not_started" },
  { itemId: "pharmacy_intake", status: "not_started" },
];
