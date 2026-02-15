import { describe, it, expect } from "vitest";
import { isFormValid } from "./DynamicForm";
import type { UiSpec } from "./api";

const minimalUiSpec: UiSpec = {
  form: {
    fields: [
      { id: "document", type: "file", label: "Document", required: true },
    ],
  },
  results: { sections: [{ id: "s1", label: "Out", agentIdOrOutputLabel: "Out" }] },
};

describe("isFormValid", () => {
  it("returns false when required file field is missing", () => {
    expect(isFormValid(minimalUiSpec, {})).toBe(false);
    expect(isFormValid(minimalUiSpec, { document: "" })).toBe(false);
  });

  it("returns true when required file field has a File", () => {
    const file = new File(["x"], "x.txt", { type: "text/plain" });
    expect(isFormValid(minimalUiSpec, { document: file })).toBe(true);
  });

  it("returns false when required text field is empty", () => {
    const spec: UiSpec = {
      form: {
        fields: [{ id: "name", type: "text", label: "Name", required: true }],
      },
      results: { sections: [] },
    };
    expect(isFormValid(spec, {})).toBe(false);
    expect(isFormValid(spec, { name: "  " })).toBe(false);
  });

  it("returns true when required text field has value", () => {
    const spec: UiSpec = {
      form: {
        fields: [{ id: "name", type: "text", label: "Name", required: true }],
      },
      results: { sections: [] },
    };
    expect(isFormValid(spec, { name: "a" })).toBe(true);
  });
});
