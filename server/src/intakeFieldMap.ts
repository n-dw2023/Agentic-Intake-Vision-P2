/**
 * Build field map for intake workspace: merge required fields, extraction, and saved payload (Story 5).
 */

import type { ExtractionResultRow } from "./supabase.js";
import {
  getAllFieldsForIntake,
  type IntakeFieldDef,
} from "./intakeSchema.js";

export type FieldMapEntry = {
  key: string;
  label: string;
  required: boolean;
  proposedValue: string | boolean | string[];
  source: "extraction" | "user-provided";
  citationSnippet?: string;
  confidence?: "low" | "medium" | "high";
  validationState: "ok" | "missing" | "needs_attention";
};

export type IntakeFieldMap = {
  itemId: string;
  fields: FieldMapEntry[];
  questions: { id: string; text: string; answer?: string }[];
};

function emptyValue(field: IntakeFieldDef): string | boolean | string[] {
  if (field.key === "study_title" || field.key === "sponsor" || field.key === "lab_name" || field.key === "modality" || field.key === "pharmacy_contact" || field.key === "build_notes" || field.key === "processing_notes" || field.key === "protocol_notes" || field.key === "dispensing_notes" || field.key === "agreement_notes") {
    return "";
  }
  return "";
}

function isEmpty(v: string | boolean | string[]): boolean {
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return v.length === 0;
  return String(v).trim() === "";
}

export function buildFieldMap(
  itemId: string,
  extractionRows: ExtractionResultRow[],
  savedPayload: Record<string, unknown> | null
): IntakeFieldMap {
  const fieldDefs = getAllFieldsForIntake(itemId);
  if (fieldDefs.length === 0) {
    return { itemId, fields: [], questions: [] };
  }

  const extractionByField = new Map<string, ExtractionResultRow>();
  for (const r of extractionRows) {
    extractionByField.set(r.field_name, r);
  }

  const fields: FieldMapEntry[] = fieldDefs.map((def) => {
    const saved = savedPayload && def.key in savedPayload ? savedPayload[def.key] : undefined;
    const fromExtraction = def.extractionMap ? extractionByField.get(def.extractionMap) : undefined;

    let proposedValue: string | boolean | string[] = emptyValue(def);
    let source: "extraction" | "user-provided" = "extraction";
    let citationSnippet: string | undefined;
    let confidence: "low" | "medium" | "high" | undefined;

    if (saved !== undefined && saved !== null && (typeof saved === "string" || typeof saved === "boolean" || Array.isArray(saved))) {
      proposedValue = saved as string | boolean | string[];
      source = "user-provided";
    } else if (fromExtraction?.value !== undefined && fromExtraction.value !== null) {
      const v = fromExtraction.value;
      proposedValue = Array.isArray(v) ? v as string[] : typeof v === "boolean" ? v : String(v);
      source = fromExtraction.provenance === "user-provided" ? "user-provided" : "extraction";
      confidence = fromExtraction.confidence as "low" | "medium" | "high";
      const citations = fromExtraction.citations as Array<{ snippet?: string }> | undefined;
      if (citations?.[0]?.snippet) citationSnippet = citations[0].snippet;
    }

    let validationState: "ok" | "missing" | "needs_attention" = "ok";
    if (def.required && isEmpty(proposedValue)) validationState = "missing";
    else if (confidence === "low" && !isEmpty(proposedValue)) validationState = "needs_attention";

    return {
      key: def.key,
      label: def.label,
      required: def.required,
      proposedValue,
      source,
      citationSnippet,
      confidence,
      validationState,
    };
  });

  return {
    itemId,
    fields,
    questions: [], // MVP: no agent questions
  };
}
