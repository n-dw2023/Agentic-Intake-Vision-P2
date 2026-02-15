/**
 * Generation agent prompts: per-checklist-item system prompts for document drafting.
 * Single source of truth: GET /api/prompts (Agent Prompts page) and getPromptForItem() (draft
 * generation) both use loadAgentPrompts(), so the prompts you edit on the Agent Prompts page
 * are exactly what is used when generating Lab Manual, Consent Form, etc. from the checklist.
 *
 * Stored in data/agent-prompts.json when edited; defaults below.
 *
 * Checklist item ID → Agent prompt:
 *   generate_consent_form  → Consent Form Drafter
 *   patient_care_schedule  → Patient Care Scheduler
 *   lab_manual             → Lab Manual Drafter
 *   radiology_manual       → Imaging Manual Drafter
 *   pharmacy_manual        → Pharmacy Manual Drafter
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

export type AgentPromptEntry = {
  label: string;
  prompt: string;
};

/** Checklist item IDs that have dedicated agent prompts (document types). */
export const AGENT_PROMPT_KEYS = [
  "generate_consent_form",
  "lab_manual",
  "radiology_manual",
  "pharmacy_manual",
  "patient_care_schedule",
] as const;

export type AgentPromptKey = (typeof AGENT_PROMPT_KEYS)[number];

const DEFAULT_PROMPTS: Record<AgentPromptKey, AgentPromptEntry> = {
  generate_consent_form: {
    label: "Consent Form Drafter",
    prompt:
      "You are an expert in clinical ethics and consent. Using the research protocol document, draft a patient consent form that covers study purpose, procedures, risks, benefits, confidentiality, and subject rights. Write in clear, patient-friendly language.",
  },
  lab_manual: {
    label: "Lab Manual Drafter",
    prompt:
      "You are a detail-oriented technical author. Your task is to produce a lab manual, not a protocol summary. Using the research protocol document only as source material, write a dedicated lab manual that includes: step-by-step procedures, required equipment and reagents, safety guidelines, quality control measures, and any lab-specific instructions. Do not simply summarize the protocol; output a standalone lab manual with clear section headings (e.g. Procedures, Equipment, Safety, QC) and bullet points or numbered steps where appropriate.",
  },
  radiology_manual: {
    label: "Imaging Manual Drafter",
    prompt:
      "You are a specialist in clinical imaging protocols. Using the research protocol document, create a draft imaging manual detailing imaging procedures, equipment settings, safety protocols, and image handling workflows. Organize it into logical sections with concise instructions.",
  },
  pharmacy_manual: {
    label: "Pharmacy Manual Drafter",
    prompt:
      "You are a pharmacist and technical writer. Based on the research protocol document, draft a pharmacy manual that includes drug preparation instructions, storage requirements, dosing schedules, and handling of investigational products. Structure it clearly with tables or lists as needed.",
  },
  patient_care_schedule: {
    label: "Patient Care Scheduler",
    prompt:
      "You are a healthcare coordinator. From the research protocol document, generate a patient care schedule outlining visit timelines, procedures to be performed at each visit, staffing roles, and follow-up steps. Present it in a tabular calendar or timeline format.",
  },
};

function getDataPath(): string {
  return join(process.cwd(), "data", "agent-prompts.json");
}

/**
 * Load prompts: from file if it exists, otherwise defaults.
 */
export async function loadAgentPrompts(): Promise<Record<string, AgentPromptEntry>> {
  const path = getDataPath();
  try {
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw) as Record<string, AgentPromptEntry>;
    return { ...DEFAULT_PROMPTS, ...data };
  } catch {
    return { ...DEFAULT_PROMPTS };
  }
}

/**
 * Save prompts (merge with defaults; only overwrite keys present in payload).
 */
export async function saveAgentPrompts(
  updates: Record<string, Partial<AgentPromptEntry>>
): Promise<Record<string, AgentPromptEntry>> {
  const current = await loadAgentPrompts();
  const merged: Record<string, AgentPromptEntry> = { ...current };
  for (const [key, value] of Object.entries(updates)) {
    if (AGENT_PROMPT_KEYS.includes(key as AgentPromptKey)) {
      merged[key] = {
        label: value.label ?? current[key]?.label ?? key,
        prompt: value.prompt ?? current[key]?.prompt ?? "",
      };
    }
  }
  const path = getDataPath();
  await mkdir(join(process.cwd(), "data"), { recursive: true });
  await writeFile(path, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}

/**
 * Get the agent prompt for a checklist item (used when generating artifacts).
 */
export async function getPromptForItem(itemId: string): Promise<AgentPromptEntry | null> {
  const prompts = await loadAgentPrompts();
  const entry = prompts[itemId];
  return entry ?? null;
}
