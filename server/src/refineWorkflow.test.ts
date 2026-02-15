import { describe, it, expect, vi, beforeEach } from "vitest";
import { refineWorkflow } from "./refineWorkflow.js";

const validResponse = {
  workflow: {
    input: { type: "document" as const },
    agents: [
      {
        id: "agent-1",
        name: "Summary",
        systemPrompt: "Summarize.",
        outputLabel: "Summary",
      },
      {
        id: "agent-2",
        name: "One-pager",
        systemPrompt: "Write a one-pager.",
        outputLabel: "One-pager",
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
        { id: "s2", label: "One-pager", agentIdOrOutputLabel: "One-pager" },
      ],
    },
  },
};

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(validResponse) } }],
        }),
      },
    },
  })),
}));

describe("refineWorkflow", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns validated workflow and uiSpec when OpenAI returns valid JSON", async () => {
    const current = {
      workflow: {
        input: { type: "document" as const },
        agents: [
          { id: "agent-1", name: "Summary", systemPrompt: "Sum.", outputLabel: "Summary" },
        ],
      },
      uiSpec: {
        form: { fields: [{ id: "document", type: "file" as const, label: "Doc", required: true }] },
        results: { sections: [{ id: "s1", label: "Summary", agentIdOrOutputLabel: "Summary" }] },
      },
    };
    const result = await refineWorkflow(
      current.workflow,
      current.uiSpec,
      "Add an agent for a one-pager"
    );
    expect(result.workflow.agents).toHaveLength(2);
    expect(result.workflow.agents[1].name).toBe("One-pager");
    expect(result.uiSpec.results.sections).toHaveLength(2);
  });
});
