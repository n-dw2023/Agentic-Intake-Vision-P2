/**
 * LLM-based extraction of study attributes from protocol text (Story 1).
 * Returns structured ExtractionResult[] with citations.
 */

import OpenAI from "openai";
import { getEnv } from "./env.js";
import type { ExtractionResult } from "shared";

const SYSTEM_PROMPT = `You extract key study attributes from a clinical trial protocol document.

Output a JSON object with a single key "extractionResults" whose value is an array of objects. Each object has:
- field_name: one of "title", "sponsor", "interventional", "cancer_related", "participating_orgs"
- value: for title and sponsor a string; for interventional and cancer_related a boolean; for participating_orgs an array of strings (organization names)
- confidence: "low" | "medium" | "high"
- citations: array of { "snippet": string, "startOffset"?: number, "endOffset"?: number, "page"?: number }
  - snippet: exact or near-verbatim quote from the protocol that supports this value
  - startOffset, endOffset: character offsets in the protocol text where the snippet appears (0-based). Include when you can locate the snippet.
  - page: 1-based page number if the document has pages and you know it
- provenance: "extracted" (always use this for LLM output)

Extract all five fields. For interventional and cancer_related, infer from language (e.g. "randomized", "placebo", "cancer", "oncology"). For participating_orgs list institutions, sponsors, or sites mentioned. Use high confidence when the protocol states something clearly; low when inferred or ambiguous.

Respond with ONLY the JSON object, no markdown or code fence.`;

function extractJsonFromResponse(text: string): ExtractionResult[] {
  const trimmed = text.trim();
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;
  const parsed = JSON.parse(toParse) as { extractionResults?: unknown };
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.extractionResults)) {
    throw new Error("Response must contain extractionResults array");
  }
  return parsed.extractionResults as ExtractionResult[];
}

export async function extractFromProtocol(
  normalizedText: string,
  _contentType: string
): Promise<ExtractionResult[]> {
  const apiKey = getEnv("OPENAI_API_KEY");
  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const truncated = normalizedText.length > 120000 ? normalizedText.slice(0, 120000) + "\n\n[Document truncated...]" : normalizedText;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract study attributes from this protocol text:\n\n${truncated}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty extraction response");
  return extractJsonFromResponse(content);
}
