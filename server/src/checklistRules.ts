/**
 * Checklist rule structure: declarative rules for dynamic checklist (Story 3).
 * Labels and structure per product: GTMR IRB (with consent form sub-item), Patient Care Schedule (CCA, Epic Build),
 * Lab Manual + Lab Processing Intake, Radiology Manual + Radiology Intake, Pharmacy Manual + Pharmacy Intake.
 */

export type ChecklistItemType = "document" | "intake";

export type ChecklistRule = {
  id: string;
  label: string;
  /** Question prompt shown to the user (emulated for every item like the first). */
  questionForUser?: string;
  /** Optional expanded description or context for the action. */
  expandedText?: string;
  type: ChecklistItemType;
  parentId: string | null;
  condition: "interventional_and_cancer" | "always";
};

export const CHECKLIST_RULES: ChecklistRule[] = [
  {
    id: "gtmr_irb",
    label: "Create Greater Than Minimal Risk IRB Application",
    questionForUser: "Do you need to create a Greater Than Minimal Risk (GTMR) IRB application?",
    expandedText: "Submit an IRB application for studies that present greater than minimal risk to participants.",
    type: "document",
    parentId: null,
    condition: "interventional_and_cancer",
  },
  {
    id: "generate_consent_form",
    label: "Generate Consent Form",
    questionForUser: "Do you need to generate a consent form for this study?",
    expandedText: "Create the informed consent document from the protocol and IRB requirements.",
    type: "document",
    parentId: "gtmr_irb",
    condition: "always",
  },
  {
    id: "florence_ebinder",
    label: "Florence eBinder",
    questionForUser: "Do you need to set up the Florence eBinder for this study?",
    expandedText: "Configure the Florence eBinder to hold study-related documents and regulatory binders.",
    type: "document",
    parentId: null,
    condition: "interventional_and_cancer",
  },
  {
    id: "patient_care_schedule",
    label: "Generating the Patient Care Schedule from the Protocol",
    questionForUser: "Do you need to generate the Patient Care Schedule from the protocol?",
    expandedText: "Produce the patient care schedule that drives CCA, Epic Build, and other downstream intake steps.",
    type: "document",
    parentId: null,
    condition: "interventional_and_cancer",
  },
  {
    id: "cca",
    label: "CCA",
    questionForUser: "Do you need to complete the CCA (Clinical Care Agreement) intake?",
    expandedText: "Map and submit CCA-specific fields for this study.",
    type: "intake",
    parentId: "patient_care_schedule",
    condition: "always",
  },
  {
    id: "epic_build_intake",
    label: "Epic Build Intake",
    questionForUser: "Do you need to complete the Epic Build intake?",
    expandedText: "Provide Epic build and configuration data required for this study.",
    type: "intake",
    parentId: "patient_care_schedule",
    condition: "always",
  },
  {
    id: "lab_manual",
    label: "Lab Manual",
    questionForUser: "Do you need to create or update the Lab Manual for this study?",
    expandedText: "Generate the lab manual document; then complete Lab Processing Intake if required.",
    type: "document",
    parentId: null,
    condition: "interventional_and_cancer",
  },
  {
    id: "lab_processing_intake",
    label: "Lab Processing Intake",
    questionForUser: "Do you need to complete the Lab Processing intake?",
    expandedText: "Map and submit lab processing fields linked to the Lab Manual.",
    type: "intake",
    parentId: "lab_manual",
    condition: "always",
  },
  {
    id: "radiology_manual",
    label: "Radiology Manual",
    questionForUser: "Do you need to create or update the Radiology Manual for this study?",
    expandedText: "Generate the radiology manual; then complete Radiology Intake if required.",
    type: "document",
    parentId: null,
    condition: "interventional_and_cancer",
  },
  {
    id: "radiology_intake",
    label: "Radiology Intake",
    questionForUser: "Do you need to complete the Radiology intake?",
    expandedText: "Map and submit radiology-specific fields linked to the Radiology Manual.",
    type: "intake",
    parentId: "radiology_manual",
    condition: "always",
  },
  {
    id: "pharmacy_manual",
    label: "Pharmacy Manual",
    questionForUser: "Do you need to create or update the Pharmacy Manual for this study?",
    expandedText: "Generate the pharmacy manual; then complete Pharmacy Intake if required.",
    type: "document",
    parentId: null,
    condition: "interventional_and_cancer",
  },
  {
    id: "pharmacy_intake",
    label: "Pharmacy Intake",
    questionForUser: "Do you need to complete the Pharmacy intake?",
    expandedText: "Map and submit pharmacy-specific fields linked to the Pharmacy Manual.",
    type: "intake",
    parentId: "pharmacy_manual",
    condition: "always",
  },
];

export type ChecklistStatus =
  | "not_started"
  | "in_progress"
  | "needs_review"
  | "ready_to_submit"
  | "complete"
  | "blocked";

export const ALLOWED_TRANSITIONS: Record<ChecklistStatus, ChecklistStatus[]> = {
  not_started: ["in_progress", "blocked"],
  in_progress: ["needs_review", "ready_to_submit", "blocked"],
  needs_review: ["ready_to_submit", "complete", "blocked"],
  ready_to_submit: ["complete", "blocked"],
  complete: [],
  blocked: ["not_started", "in_progress"],
};

export function isAllowedTransition(from: ChecklistStatus, to: ChecklistStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function evaluateRootCondition(
  condition: ChecklistRule["condition"],
  flags: { interventional: boolean; cancer_related: boolean }
): boolean {
  if (condition === "always") return true;
  if (condition === "interventional_and_cancer") return flags.interventional && flags.cancer_related;
  return false;
}

/** Item IDs that have sub-items (parents). */
export function getParentItemIds(): string[] {
  const parentIds = new Set<string>();
  for (const r of CHECKLIST_RULES) {
    if (r.parentId) parentIds.add(r.parentId);
  }
  return [...parentIds];
}
