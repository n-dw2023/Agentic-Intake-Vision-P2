/**
 * Intake workspace: required fields per intake type (Story 5).
 * Maps checklist item_id to required fields; extraction field_name can populate proposed values where keys align.
 */

export type IntakeItemId =
  | "epic_build_intake"
  | "lab_processing_intake"
  | "radiology_intake"
  | "pharmacy_intake"
  | "cca";

export type IntakeFieldDef = {
  key: string;
  label: string;
  required: boolean;
  /** Extraction field_name that may supply initial value (e.g. title → study_title). */
  extractionMap?: "title" | "sponsor" | "interventional" | "cancer_related" | "participating_orgs";
};

const INTAKE_FIELDS: Record<IntakeItemId, IntakeFieldDef[]> = {
  epic_build_intake: [
    { key: "study_title", label: "Study title", required: true, extractionMap: "title" },
    { key: "sponsor", label: "Sponsor", required: true, extractionMap: "sponsor" },
    { key: "build_notes", label: "Epic build notes", required: false },
  ],
  lab_processing_intake: [
    { key: "study_title", label: "Study title", required: true, extractionMap: "title" },
    { key: "lab_name", label: "Lab name", required: true },
    { key: "processing_notes", label: "Processing notes", required: false },
  ],
  radiology_intake: [
    { key: "study_title", label: "Study title", required: true, extractionMap: "title" },
    { key: "modality", label: "Modality", required: true },
    { key: "protocol_notes", label: "Protocol notes", required: false },
  ],
  pharmacy_intake: [
    { key: "study_title", label: "Study title", required: true, extractionMap: "title" },
    { key: "pharmacy_contact", label: "Pharmacy contact", required: true },
    { key: "dispensing_notes", label: "Dispensing notes", required: false },
  ],
  cca: [
    { key: "study_title", label: "Study title", required: true, extractionMap: "title" },
    { key: "sponsor", label: "Sponsor", required: true, extractionMap: "sponsor" },
    { key: "agreement_notes", label: "Agreement notes", required: false },
  ],
};

export function getIntakeItemIds(): IntakeItemId[] {
  return Object.keys(INTAKE_FIELDS) as IntakeItemId[];
}

export function isIntakeItemId(id: string): id is IntakeItemId {
  return id in INTAKE_FIELDS;
}

export function getRequiredFieldsForIntake(itemId: string): IntakeFieldDef[] {
  if (!isIntakeItemId(itemId)) return [];
  return INTAKE_FIELDS[itemId];
}

export function getAllFieldsForIntake(itemId: string): IntakeFieldDef[] {
  if (!isIntakeItemId(itemId)) return [];
  return INTAKE_FIELDS[itemId];
}
