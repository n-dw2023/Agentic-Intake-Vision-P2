import { z } from "zod";

/**
 * UI spec schema (v1): declarative form fields and result sections.
 * No arbitrary code or HTML. Interpreter renders with a fixed set of components.
 * See .code-captain/specs/2026-02-14-chat-driven-agentic-workflows/sub-specs/technical-spec.md
 */

const fieldTypeSchema = z.enum(["file", "text", "select"]);

export const formFieldSchema = z.object({
  id: z.string().min(1, "Field id is required"),
  type: fieldTypeSchema,
  label: z.string().min(1, "Field label is required"),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(), // for type "select"
});

export const formSchema = z.object({
  fields: z.array(formFieldSchema),
});

export const resultSectionSchema = z.object({
  id: z.string().min(1, "Section id is required"),
  label: z.string().min(1, "Section label is required"),
  agentIdOrOutputLabel: z
    .string()
    .min(1, "agentIdOrOutputLabel is required"),
});

export const resultsSchema = z.object({
  sections: z.array(resultSectionSchema),
});

export const uiSpecSchema = z.object({
  form: formSchema,
  results: resultsSchema,
});

export type FormField = z.infer<typeof formFieldSchema>;
export type Form = z.infer<typeof formSchema>;
export type ResultSection = z.infer<typeof resultSectionSchema>;
export type Results = z.infer<typeof resultsSchema>;
export type UiSpec = z.infer<typeof uiSpecSchema>;
