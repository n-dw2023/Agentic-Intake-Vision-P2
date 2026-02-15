import type { UiSpec } from "./api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FormValues = Record<string, string | File | null>;

export type FormErrors = Record<string, string>;

type Props = {
  uiSpec: UiSpec;
  values: FormValues;
  onChange: (values: FormValues) => void;
  disabled?: boolean;
  errors?: FormErrors;
};

const ALLOWED_FIELD_TYPES = ["file", "text", "select"] as const;

export function DynamicForm({ uiSpec, values, onChange, disabled, errors = {} }: Props) {
  const fields = uiSpec?.form?.fields ?? [];
  if (fields.length === 0) return null;

  const handleChange = (fieldId: string, value: string | File | null) => {
    onChange({ ...values, [fieldId]: value });
  };

  return (
    <div className="dynamic-form">
      {fields.map((field) => {
        const type = ALLOWED_FIELD_TYPES.includes(field.type as (typeof ALLOWED_FIELD_TYPES)[number])
          ? field.type
          : "text";
        const value = values[field.id];
        const id = `field-${field.id}`;
        const fieldError = errors[field.id];

        return (
          <div key={field.id} className="form-field">
            <label htmlFor={id}>
              {field.label}
              {field.required && <span className="form-required"> *</span>}
            </label>
            {type === "file" && (
              <>
                <input
                  id={id}
                  type="file"
                  className="form-field-file"
                  accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleChange(field.id, file);
                  }}
                  disabled={disabled}
                  aria-required={field.required}
                  aria-invalid={!!fieldError}
                  aria-describedby={fieldError ? `${id}-error` : undefined}
                />
                {fieldError && (
                  <span id={`${id}-error`} className="ui-input-error" role="alert">
                    {fieldError}
                  </span>
                )}
              </>
            )}
            {type === "text" && (
              <Input
                id={id}
                type="text"
                value={typeof value === "string" ? value : ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                disabled={disabled}
                error={fieldError}
                aria-required={field.required}
              />
            )}
            {type === "select" && (
              <>
                <Select
                  value={typeof value === "string" ? value : ""}
                  onValueChange={(v) => handleChange(field.id, v)}
                  disabled={disabled}
                >
                  <SelectTrigger id={id} aria-required={field.required} aria-invalid={!!fieldError}>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      Select…
                    </SelectItem>
                    {(field.options ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError && (
                  <span id={`${id}-error`} className="ui-input-error" role="alert">
                    {fieldError}
                  </span>
                )}
              </>
            )}
            {type === "file" && value instanceof File && (
              <span className="form-file-name">{value.name}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Return whether required form fields are satisfied (for Run button). */
export function isFormValid(uiSpec: UiSpec, values: FormValues): boolean {
  const fields = uiSpec?.form?.fields ?? [];
  for (const field of fields) {
    if (!field.required) continue;
    const v = values[field.id];
    if (field.type === "file") {
      if (!(v instanceof File)) return false;
    } else {
      if (v == null || String(v).trim() === "") return false;
    }
  }
  return true;
}
