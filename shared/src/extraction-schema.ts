/**
 * Extraction and citation schema for Study Project V2.
 * See .code-captain/specs/2026-02-15-study-project-v2/sub-specs/extraction-and-citations-spec.md
 */

import { z } from "zod";

export const citationSchema = z.object({
  snippet: z.string().min(1, "Citation snippet is required"),
  startOffset: z.number().int().min(0).optional(),
  endOffset: z.number().int().min(0).optional(),
  page: z.number().int().min(1).optional(),
});

export const extractionFieldNameSchema = z.enum([
  "title",
  "sponsor",
  "interventional",
  "cancer_related",
  "participating_orgs",
]);

export const confidenceSchema = z.enum(["low", "medium", "high"]);
export const provenanceSchema = z.enum(["extracted", "inferred", "user-provided"]);

export const extractionResultSchema = z.object({
  field_name: extractionFieldNameSchema,
  value: z.union([
    z.string(),
    z.boolean(),
    z.array(z.string()),
  ]),
  confidence: confidenceSchema,
  citations: z.array(citationSchema).default([]),
  provenance: provenanceSchema.default("extracted"),
});

export const extractionResultsSchema = z.array(extractionResultSchema).min(1);

export type Citation = z.infer<typeof citationSchema>;
export type ExtractionFieldName = z.infer<typeof extractionFieldNameSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

/** Required fields for study project creation (v1). */
export const REQUIRED_EXTRACTION_FIELDS: ExtractionFieldName[] = [
  "title",
  "sponsor",
  "interventional",
  "cancer_related",
  "participating_orgs",
];

/**
 * Validate extraction payload from LLM. Clamp offsets to [0, textLength] when text is provided.
 */
export function validateExtractionResults(
  value: unknown,
  textLength?: number
): { success: true; data: ExtractionResult[] } | { success: false; errors: string[] } {
  const parsed = extractionResultsSchema.safeParse(value);
  if (!parsed.success) {
    const errors = parsed.error.flatten();
    const messages = [
      ...(errors.formErrors ?? []),
      ...Object.entries(errors.fieldErrors).flatMap(([field, errs]) =>
        (errs ?? []).map((e) => `${field}: ${e}`)
      ),
    ];
    return { success: false, errors: messages };
  }
  let data = parsed.data;
  if (textLength != null && textLength >= 0) {
    data = data.map((r) => ({
      ...r,
      citations: r.citations.map((c) => ({
        ...c,
        startOffset: c.startOffset != null ? Math.min(Math.max(0, c.startOffset), textLength) : undefined,
        endOffset: c.endOffset != null ? Math.min(Math.max(0, c.endOffset), textLength) : undefined,
      })),
    }));
  }
  return { success: true, data };
}
