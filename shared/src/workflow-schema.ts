import { z } from "zod";

/**
 * Workflow schema (v1): one input (document) → N agents in parallel → N outputs.
 * See .code-captain/specs/2026-02-14-chat-driven-agentic-workflows/sub-specs/technical-spec.md
 */

export const workflowInputSchema = z.object({
  type: z.literal("document"),
});

export const workflowAgentSchema = z.object({
  id: z.string().min(1, "Agent id is required"),
  name: z.string().min(1, "Agent name is required"),
  systemPrompt: z.string().min(1, "Agent systemPrompt is required"),
  outputLabel: z.string().min(1, "Agent outputLabel is required"),
});

export const workflowDefinitionSchema = z.object({
  input: workflowInputSchema,
  agents: z
    .array(workflowAgentSchema)
    .min(1, "At least one agent is required"),
});

export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowAgent = z.infer<typeof workflowAgentSchema>;
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
