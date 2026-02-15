import OpenAI from "openai";
import { getEnv } from "./env.js";
import type { WorkflowDefinition } from "shared";

const MAX_DOCUMENT_LENGTH = 500_000; // ~500k chars
const MAX_RETRIES = 4; // initial try + 3 retries
const INITIAL_BACKOFF_MS = 2000;

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const msg = String((err as { message?: string }).message ?? "").toLowerCase();
    const status = (err as { status?: number }).status;
    if (status === 429) return true;
    if (msg.includes("rate") && (msg.includes("limit") || msg.includes("429"))) return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type RunResult = {
  agentId: string;
  outputLabel: string;
  content: string;
};

export async function executeWorkflow(
  workflow: WorkflowDefinition,
  documentText: string
): Promise<RunResult[]> {
  if (!documentText.trim()) {
    throw new Error("Document content is required");
  }
  if (documentText.length > MAX_DOCUMENT_LENGTH) {
    throw new Error(`Document too long (max ${MAX_DOCUMENT_LENGTH} characters)`);
  }

  const apiKey = getEnv("OPENAI_API_KEY");
  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "o4-mini";

  const userContent = `Use the following source document as the sole input. Produce the output requested by your role.\n\n---\n\n${documentText}`;

  const callWithRetry = async (agent: WorkflowDefinition["agents"][number]): Promise<RunResult> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: agent.systemPrompt },
            { role: "user", content: userContent },
          ],
        });
        const content = completion.choices[0]?.message?.content?.trim() ?? "";
        return {
          agentId: agent.id,
          outputLabel: agent.outputLabel,
          content,
        };
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES - 1 && isRateLimitError(err)) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await sleep(backoff);
        } else {
          throw err;
        }
      }
    }
    throw lastError;
  };

  const results: RunResult[] = [];
  for (const agent of workflow.agents) {
    results.push(await callWithRetry(agent));
  }
  return results;
}
