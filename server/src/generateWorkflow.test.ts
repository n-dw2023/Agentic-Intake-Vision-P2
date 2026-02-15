import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateWorkflowFromPrompt } from "./generateWorkflow.js";

const validResponse = {
  workflow: {
    input: { type: "document" as const },
    agents: [
      {
        id: "agent-1",
        name: "Summary",
        systemPrompt: "Summarize the document.",
        outputLabel: "Summary",
      },
    ],
  },
  uiSpec: {
    form: {
      fields: [
        { id: "document", type: "file" as const, label: "Document", required: true },
      ],
    },
    results: {
      sections: [
        { id: "s1", label: "Summary", agentIdOrOutputLabel: "Summary" },
      ],
    },
  },
};

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            { message: { content: JSON.stringify(validResponse) } },
          ],
        }),
      },
    },
  })),
}));

describe("generateWorkflowFromPrompt", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns validated workflow and uiSpec when OpenAI returns valid JSON", async () => {
    const result = await generateWorkflowFromPrompt(
      "One document to executive summary and technical brief"
    );
    expect(result.workflow).toEqual(validResponse.workflow);
    expect(result.uiSpec).toEqual(validResponse.uiSpec);
    expect(result.workflow.agents).toHaveLength(1);
    expect(result.uiSpec.form.fields[0].type).toBe("file");
  });
});
