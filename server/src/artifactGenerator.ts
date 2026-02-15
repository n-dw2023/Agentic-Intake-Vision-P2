/**
 * Artifact draft generation (Story 4). Uses agent prompts; calls OpenAI with protocol + prompt when configured.
 */

import OpenAI from "openai";
import { getEnvOptional } from "./env.js";

export type GenerateContext = {
  projectTitle: string;
  projectSponsor: string;
  itemLabel: string;
  protocolSnippet: string;
  /** Agent instruction for this document type (e.g. Lab Manual Drafter, Consent Form Drafter). */
  agentPrompt?: string;
};

/** Max protocol characters sent to the LLM (avoid token limits). */
const MAX_PROTOCOL_CHARS = 100_000;

/**
 * Generate draft using OpenAI: system = agent prompt, user = protocol + study context.
 * Returns markdown draft or throws on API error.
 */
export async function generateDraftWithOpenAI(context: GenerateContext & { regenerateReason?: string }): Promise<string> {
  const apiKey = getEnvOptional("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const { projectTitle, projectSponsor, itemLabel, protocolSnippet, agentPrompt, regenerateReason } = context;
  const protocol = protocolSnippet.trim();
  const truncated =
    protocol.length > MAX_PROTOCOL_CHARS
      ? protocol.slice(0, MAX_PROTOCOL_CHARS) + "\n\n[Protocol truncated for length...]"
      : protocol;

  // agentPrompt is always set when called from the generate route (throws earlier if missing)
  const systemContent = agentPrompt!.trim();

  let userContent = `Study: ${projectTitle}\nSponsor: ${projectSponsor}\n\nDraft a document for: **${itemLabel}**.\n\nResearch protocol document:\n\n${truncated}`;
  if (regenerateReason?.trim()) {
    userContent += `\n\nRegenerate with this focus: ${regenerateReason.trim()}`;
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) throw new Error("Empty draft response from OpenAI");

  return content.trim();
}

/**
 * Produce a draft document using OpenAI with the protocol and agent prompt.
 * Throws if OPENAI_API_KEY is not set, agent prompt is missing, or the API call fails (no template fallback).
 */
export async function generateDraftDocument(
  context: GenerateContext,
  options?: { regenerateReason?: string }
): Promise<string> {
  const apiKey = getEnvOptional("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error(
      "Draft generation requires OPENAI_API_KEY. Set it in your server environment (e.g. .env) and try again."
    );
  }
  if (!context.agentPrompt?.trim()) {
    throw new Error(
      "No agent prompt is configured for this checklist item. Add or assign a prompt in Agent Prompts and try again."
    );
  }
  return await generateDraftWithOpenAI({
    ...context,
    regenerateReason: options?.regenerateReason,
  });
}
