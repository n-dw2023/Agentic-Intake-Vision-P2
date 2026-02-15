import OpenAI from "openai";
import { getEnv } from "./env.js";
import {
  validateWorkflow,
  validateUiSpec,
  formatValidationErrors,
  type WorkflowDefinition,
  type UiSpec,
} from "shared";

const WORKFLOW_UI_SPEC_EXAMPLE = {
  workflow: {
    input: { type: "document" as const },
    agents: [
      {
        id: "agent-1",
        name: "Executive Summary",
        systemPrompt:
          "You are a concise writer. Given the source document, produce a one-page executive summary.",
        outputLabel: "Executive Summary",
      },
      {
        id: "agent-2",
        name: "Technical Brief",
        systemPrompt:
          "You are a technical writer. Given the source document, produce a technical brief for engineers.",
        outputLabel: "Technical Brief",
      },
    ],
  },
  uiSpec: {
    form: {
      fields: [
        { id: "document", type: "file" as const, label: "Source document", required: true },
      ],
    },
    results: {
      sections: [
        { id: "s1", label: "Executive Summary", agentIdOrOutputLabel: "Executive Summary" },
        { id: "s2", label: "Technical Brief", agentIdOrOutputLabel: "Technical Brief" },
      ],
    },
  },
};

const SYSTEM_PROMPT = `You generate agentic workflow definitions and UI specs from a user's natural-language description.

Output a single JSON object with two keys: "workflow" and "uiSpec".

Workflow schema:
- input: { "type": "document" } (exactly this for v1)
- agents: array of { "id": string, "name": string, "systemPrompt": string, "outputLabel": string }
  - id: unique id like "agent-1", "agent-2"
  - name: short name for the agent
  - systemPrompt: instructions for the LLM when acting as this agent (what to produce, tone, length)
  - outputLabel: label used to show this agent's output in the UI (often same as name)

UI spec schema:
- form.fields: array of { "id": string, "type": "file"|"text"|"select", "label": string, "required": boolean?, "options"?: string[] }
  - For document input include at least one field with type "file" and id like "document"
- results.sections: array of { "id": string, "label": string, "agentIdOrOutputLabel": string }
  - One section per agent; agentIdOrOutputLabel must match the agent's outputLabel

Respond with ONLY the JSON object, no markdown or code fence. Ensure the JSON is valid and complete.`;

function extractJson(text: string): { workflow: unknown; uiSpec: unknown } {
  // Try to parse as raw JSON first
  const trimmed = text.trim();
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;
  const parsed = JSON.parse(toParse) as { workflow?: unknown; uiSpec?: unknown };
  if (!parsed || typeof parsed !== "object") throw new Error("Response is not a JSON object");
  if (!("workflow" in parsed) || !("uiSpec" in parsed)) {
    throw new Error("Response must contain workflow and uiSpec keys");
  }
  return { workflow: parsed.workflow, uiSpec: parsed.uiSpec };
}

const MAX_RETRIES = 2;

export async function generateWorkflowFromPrompt(
  userPrompt: string
): Promise<{ workflow: WorkflowDefinition; uiSpec: UiSpec }> {
  const apiKey = getEnv("OPENAI_API_KEY");
  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "o4-mini";
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate a workflow and UI spec for this request:\n\n${userPrompt}\n\nExample structure:\n${JSON.stringify(WORKFLOW_UI_SPEC_EXAMPLE, null, 2)}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response from OpenAI");

      const { workflow, uiSpec } = extractJson(content);

      const workflowResult = validateWorkflow(workflow);
      if (!workflowResult.success) {
        throw new Error(`Invalid workflow: ${formatValidationErrors(workflowResult.errors)}`);
      }

      const uiSpecResult = validateUiSpec(uiSpec);
      if (!uiSpecResult.success) {
        throw new Error(`Invalid uiSpec: ${formatValidationErrors(uiSpecResult.errors)}`);
      }

      return { workflow: workflowResult.data, uiSpec: uiSpecResult.data };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === MAX_RETRIES) break;
    }
  }

  throw lastError ?? new Error("Generation failed after retries");
}
