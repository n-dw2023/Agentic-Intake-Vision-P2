import OpenAI from "openai";
import { getEnv } from "./env.js";
import {
  validateWorkflow,
  validateUiSpec,
  formatValidationErrors,
  type WorkflowDefinition,
  type UiSpec,
} from "shared";

const SYSTEM_REFINE_PROMPT = `You refine an existing agentic workflow and UI spec based on the user's message.

You will receive the current workflow (agents with id, name, systemPrompt, outputLabel) and UI spec (form.fields, results.sections).
Output a single JSON object with two keys: "workflow" and "uiSpec" — the complete updated definitions (full replacement, not a diff).

Rules:
- workflow.input must remain { "type": "document" }.
- Each agent needs id, name, systemPrompt, outputLabel.
- UI spec form.fields must include at least one "file" field for the document.
- results.sections must have one section per agent; agentIdOrOutputLabel must match an agent's outputLabel.
- Respond with ONLY the JSON object, no markdown or code fence.`;

const MAX_RETRIES = 2;

function extractJson(text: string): { workflow: unknown; uiSpec: unknown } {
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

export async function refineWorkflow(
  currentWorkflow: WorkflowDefinition,
  currentUiSpec: UiSpec,
  userMessage: string
): Promise<{ workflow: WorkflowDefinition; uiSpec: UiSpec }> {
  const apiKey = getEnv("OPENAI_API_KEY");
  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "o4-mini";
  let lastError: Error | null = null;

  const userContent = `Current workflow:\n${JSON.stringify(currentWorkflow, null, 2)}\n\nCurrent UI spec:\n${JSON.stringify(currentUiSpec, null, 2)}\n\nUser request: ${userMessage}\n\nOutput the complete updated workflow and uiSpec as a single JSON object with keys "workflow" and "uiSpec".`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_REFINE_PROMPT },
          { role: "user", content: userContent },
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

  throw lastError ?? new Error("Refinement failed after retries");
}
