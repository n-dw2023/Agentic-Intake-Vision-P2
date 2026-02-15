/**
 * Agent Prompts: view and edit generation-agent prompts (Lab Manual, Consent Form, etc.).
 */

import { useState, useCallback, useEffect } from "react";
import { getAgentPrompts, updateAgentPrompts, type AgentPromptEntry } from "../api";
import { Button } from "@/components/ui/button";

const PROMPT_ORDER = [
  "generate_consent_form",
  "lab_manual",
  "radiology_manual",
  "pharmacy_manual",
  "patient_care_schedule",
] as const;

type Props = {
  onClose: () => void;
};

export function AgentPromptsPage({ onClose }: Props) {
  const [prompts, setPrompts] = useState<Record<string, AgentPromptEntry>>({});
  const [edits, setEdits] = useState<Record<string, AgentPromptEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAgentPrompts()
      .then((r) => {
        setPrompts(r.prompts);
        setEdits(r.prompts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load prompts"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = useCallback((key: string, field: "label" | "prompt", value: string) => {
    setEdits((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { label: "", prompt: "" }), [field]: value },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const updates: Record<string, Partial<AgentPromptEntry>> = {};
      for (const key of PROMPT_ORDER) {
        const e = edits[key];
        const p = prompts[key];
        if (e && (e.label !== p?.label || e.prompt !== p?.prompt)) {
          updates[key] = { label: e.label, prompt: e.prompt };
        }
      }
      if (Object.keys(updates).length === 0) {
        setSaving(false);
        return;
      }
      const res = await updateAgentPrompts(updates);
      setPrompts(res.prompts);
      setEdits(res.prompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [edits, prompts]);

  if (loading) {
    return (
      <div className="agent-prompts-page">
        <div className="agent-prompts-header">
          <h2>Generation agent prompts</h2>
          <Button type="button" variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="agent-prompts-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="agent-prompts-page">
      <div className="agent-prompts-header">
        <h2>Generation agent prompts</h2>
        <Button type="button" variant="default" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="agent-prompts-intro">
        These prompts define how each document type is drafted from the research protocol. Each checklist item uses one agent (e.g. &quot;Generate Patient Care Schedule&quot; uses the Patient Care Scheduler prompt). Edit and save to change behavior for future artifact generation.
      </p>
      {error && (
        <div className="agent-prompts-error" role="alert">
          {error}
        </div>
      )}
      <div className="agent-prompts-list">
        {PROMPT_ORDER.map((key) => {
          const entry = edits[key] ?? prompts[key];
          if (!entry) return null;
          return (
            <section key={key} className="agent-prompts-card">
              <label className="agent-prompts-card-label">
                <span className="agent-prompts-card-label-text">Agent name</span>
                <input
                  type="text"
                  className="agent-prompts-card-input"
                  value={entry.label}
                  onChange={(e) => handleChange(key, "label", e.target.value)}
                  aria-label={`Label for ${key}`}
                />
              </label>
              <label className="agent-prompts-card-label">
                <span className="agent-prompts-card-label-text">Prompt (system instruction)</span>
                <textarea
                  className="agent-prompts-card-textarea"
                  value={entry.prompt}
                  onChange={(e) => handleChange(key, "prompt", e.target.value)}
                  rows={6}
                  aria-label={`Prompt for ${key}`}
                />
              </label>
            </section>
          );
        })}
      </div>
      <div className="agent-prompts-actions">
        <Button type="button" variant="primary" onClick={handleSave} disabled={saving} loading={saving}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
