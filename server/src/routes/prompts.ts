/**
 * Agent prompts API: get and update generation-agent prompts (view/edit from homepage).
 */

import { Router, Request, Response } from "express";
import { loadAgentPrompts, saveAgentPrompts, AGENT_PROMPT_KEYS } from "../agentPrompts.js";

export const promptsRouter = Router();

/**
 * GET /prompts
 * Returns all agent prompts (keyed by checklist item id).
 */
promptsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const prompts = await loadAgentPrompts();
    const payload: Record<string, { label: string; prompt: string }> = {};
    for (const key of AGENT_PROMPT_KEYS) {
      const entry = prompts[key];
      if (entry) payload[key] = { label: entry.label, prompt: entry.prompt };
    }
    res.status(200).json({ prompts: payload });
  } catch (err) {
    console.error("Get prompts error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load prompts" });
  }
});

/**
 * PATCH /prompts
 * Body: { prompts: { [key]: { label?: string, prompt?: string } } }
 * Updates only provided keys; returns full prompts after merge.
 */
promptsRouter.patch("/", async (req: Request, res: Response) => {
  const updates = req.body?.prompts;
  if (!updates || typeof updates !== "object") {
    res.status(400).json({ error: "Body must include prompts (object)" });
    return;
  }
  try {
    const prompts = await saveAgentPrompts(updates);
    const payload: Record<string, { label: string; prompt: string }> = {};
    for (const key of AGENT_PROMPT_KEYS) {
      const entry = prompts[key];
      if (entry) payload[key] = { label: entry.label, prompt: entry.prompt };
    }
    res.status(200).json({ prompts: payload });
  } catch (err) {
    console.error("Update prompts error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to save prompts" });
  }
});
