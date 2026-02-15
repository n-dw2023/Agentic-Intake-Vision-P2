import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeWorkflow } from "./runWorkflow.js";

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
          .mockResolvedValueOnce({
            choices: [{ message: { content: "Executive summary content here." } }],
          })
          .mockResolvedValueOnce({
            choices: [{ message: { content: "Technical brief content here." } }],
          }),
      },
    },
  })),
}));

describe("executeWorkflow", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("runs all agents in parallel and returns results in order", async () => {
    const workflow = {
      input: { type: "document" as const },
      agents: [
        { id: "agent-1", name: "Summary", systemPrompt: "Summarize.", outputLabel: "Executive Summary" },
        { id: "agent-2", name: "Brief", systemPrompt: "Write a brief.", outputLabel: "Technical Brief" },
      ],
    };
    const results = await executeWorkflow(workflow, "Source document text.");
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ agentId: "agent-1", outputLabel: "Executive Summary", content: "Executive summary content here." });
    expect(results[1]).toEqual({ agentId: "agent-2", outputLabel: "Technical Brief", content: "Technical brief content here." });
  });

  it("throws when document is empty", async () => {
    const workflow = {
      input: { type: "document" as const },
      agents: [{ id: "a1", name: "A", systemPrompt: "P", outputLabel: "O" }],
    };
    await expect(executeWorkflow(workflow, "   ")).rejects.toThrow(/document/i);
  });
});
