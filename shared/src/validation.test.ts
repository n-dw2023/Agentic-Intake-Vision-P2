import { describe, it, expect } from "vitest";
import { validateWorkflow, validateUiSpec, formatValidationErrors } from "./validation.js";

describe("validateWorkflow", () => {
  it("accepts a valid workflow definition", () => {
    const valid = {
      input: { type: "document" as const },
      agents: [
        {
          id: "agent-1",
          name: "Executive Summary",
          systemPrompt: "Write an executive summary.",
          outputLabel: "Executive Summary",
        },
      ],
    };
    const result = validateWorkflow(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.agents).toHaveLength(1);
      expect(result.data.agents[0].outputLabel).toBe("Executive Summary");
    }
  });

  it("rejects invalid input type", () => {
    const invalid = {
      input: { type: "other" },
      agents: [
        {
          id: "agent-1",
          name: "A",
          systemPrompt: "P",
          outputLabel: "O",
        },
      ],
    };
    const result = validateWorkflow(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(formatValidationErrors(result.errors)).toContain("document");
    }
  });

  it("rejects empty agents array", () => {
    const invalid = {
      input: { type: "document" },
      agents: [],
    };
    const result = validateWorkflow(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => /agent|at least one/i.test(e))).toBe(true);
    }
  });

  it("rejects missing required agent fields", () => {
    const invalid = {
      input: { type: "document" },
      agents: [{ id: "a", name: "N" }], // missing systemPrompt, outputLabel
    };
    const result = validateWorkflow(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("rejects non-object input", () => {
    const result = validateWorkflow({ input: "document", agents: [] });
    expect(result.success).toBe(false);
  });
});

describe("validateUiSpec", () => {
  it("accepts a valid UI spec", () => {
    const valid = {
      form: {
        fields: [
          { id: "doc", type: "file" as const, label: "Document", required: true },
        ],
      },
      results: {
        sections: [
          { id: "s1", label: "Executive Summary", agentIdOrOutputLabel: "Executive Summary" },
        ],
      },
    };
    const result = validateUiSpec(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.form.fields[0].type).toBe("file");
      expect(result.data.results.sections).toHaveLength(1);
    }
  });

  it("rejects unknown field type", () => {
    const invalid = {
      form: {
        fields: [
          { id: "x", type: "unknown", label: "X", required: false },
        ],
      },
      results: { sections: [] },
    };
    const result = validateUiSpec(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty section id", () => {
    const invalid = {
      form: { fields: [] },
      results: {
        sections: [{ id: "", label: "S", agentIdOrOutputLabel: "out" }],
      },
    };
    const result = validateUiSpec(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects non-object root", () => {
    const result = validateUiSpec(null);
    expect(result.success).toBe(false);
  });
});

describe("formatValidationErrors", () => {
  it("joins errors with semicolons", () => {
    const out = formatValidationErrors(["error one", "error two"]);
    expect(out).toBe("error one; error two");
  });
});
