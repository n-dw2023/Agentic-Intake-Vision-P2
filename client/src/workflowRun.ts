import type { UiSpec } from "./api";
import type { FormValues } from "./DynamicForm";

/**
 * Get document text for the run request from form values.
 * Uses the first "file" field (read as text) or first "text" field.
 * Returns null if no document can be obtained.
 */
export async function getDocumentText(
  uiSpec: UiSpec,
  values: FormValues
): Promise<string | null> {
  const fields = uiSpec?.form?.fields ?? [];
  const fileField = fields.find((f) => f.type === "file");
  if (fileField) {
    const v = values[fileField.id];
    if (v instanceof File) {
      return readFileAsText(v);
    }
    return null;
  }
  const textField = fields.find((f) => f.type === "text");
  if (textField) {
    const v = values[textField.id];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file, "UTF-8");
  });
}
