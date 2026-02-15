import {
  workflowDefinitionSchema,
  type WorkflowDefinition,
} from "./workflow-schema.js";
import { uiSpecSchema, type UiSpec } from "./ui-spec-schema.js";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

/**
 * Validates a workflow definition. Returns success with typed data or failure with clear error messages.
 */
export function validateWorkflow(
  value: unknown
): ValidationResult<WorkflowDefinition> {
  const result = workflowDefinitionSchema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.flatten();
  const messages = [
    ...(errors.formErrors ?? []),
    ...Object.entries(errors.fieldErrors).flatMap(([field, errs]) =>
      (errs ?? []).map((e) => `${field}: ${e}`)
    ),
  ];
  return { success: false, errors: messages };
}

/**
 * Validates a UI spec. Returns success with typed data or failure with clear error messages.
 */
export function validateUiSpec(value: unknown): ValidationResult<UiSpec> {
  const result = uiSpecSchema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.flatten();
  const messages = [
    ...(errors.formErrors ?? []),
    ...Object.entries(errors.fieldErrors).flatMap(([field, errs]) =>
      (errs ?? []).map((e) => `${field}: ${e}`)
    ),
  ];
  return { success: false, errors: messages };
}

/**
 * Format validation errors for user display (single string).
 */
export function formatValidationErrors(errors: string[]): string {
  return errors.join("; ");
}
