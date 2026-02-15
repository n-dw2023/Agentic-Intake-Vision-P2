/**
 * Document Workspace: draft preview, sources/evidence, regenerate, approval gate (Story 4).
 */

import { useState, useCallback, useEffect } from "react";
import {
  getArtifact,
  generateArtifact,
  regenerateChecklistItem,
  updateChecklistItemStatus,
  type Artifact,
  type ChecklistStatus,
} from "../api";
import { Button } from "@/components/ui/button";

const REGENERATE_REASONS = [
  { value: "tone_format_change", label: "Tone/format change" },
  { value: "fix_incorrect_content", label: "Fix incorrect content" },
  { value: "include_missing_section", label: "Include missing section" },
] as const;

type Props = {
  projectId: string;
  itemId: string;
  itemLabel: string;
  onClose: () => void;
  onStatusUpdated?: () => void;
};

export function DocumentWorkspace({
  projectId,
  itemId,
  itemLabel,
  onClose,
  onStatusUpdated,
}: Props) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [regenerateReason, setRegenerateReason] = useState<string>("");
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [approvalChecked, setApprovalChecked] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"draft" | "sources">("draft");

  const fetchArtifact = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const a = await getArtifact(projectId, itemId);
      setArtifact(a);
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status !== 404) {
        setError(e.message ?? "Failed to load draft");
      }
      setArtifact(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, itemId]);

  useEffect(() => {
    fetchArtifact();
  }, [fetchArtifact]);

  const handleGenerate = useCallback(async () => {
    setGenerateLoading(true);
    setError(null);
    try {
      await generateArtifact(projectId, itemId);
      await fetchArtifact();
      onStatusUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setGenerateLoading(false);
    }
  }, [projectId, itemId, fetchArtifact, onStatusUpdated]);

  const handleRegenerate = useCallback(
    async (reason: string) => {
      if (!reason.trim()) return;
      setRegenerateLoading(true);
      setError(null);
      try {
        await regenerateChecklistItem(projectId, itemId, reason.trim());
        await fetchArtifact();
        setRegenerateReason("");
        onStatusUpdated?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Regenerate failed");
      } finally {
        setRegenerateLoading(false);
      }
    },
    [projectId, itemId, fetchArtifact, onStatusUpdated]
  );

  const handleMarkComplete = useCallback(async () => {
    if (!approvalChecked) return;
    setApproveLoading(true);
    setError(null);
    try {
      await updateChecklistItemStatus(projectId, itemId, "complete" as ChecklistStatus);
      onStatusUpdated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update status failed");
    } finally {
      setApproveLoading(false);
    }
  }, [projectId, itemId, approvalChecked, onStatusUpdated, onClose]);

  if (loading) {
    return (
      <div className="document-workspace">
        <div className="document-workspace-header">
          <h2 className="document-workspace-title">{itemLabel}</h2>
          <Button type="button" variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="document-workspace-muted">Loading draft…</p>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="document-workspace">
        <div className="document-workspace-header">
          <h2 className="document-workspace-title">{itemLabel}</h2>
          <Button type="button" variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="document-workspace-muted">No draft yet. Generate a draft to preview and review.</p>
        {error && (
          <div className="document-workspace-error" role="alert">
            {error}
          </div>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={handleGenerate}
          disabled={generateLoading}
          loading={generateLoading}
          className="document-workspace-generate-btn"
        >
          Generate draft
        </Button>
      </div>
    );
  }

  return (
    <div className="document-workspace">
      <div className="document-workspace-header">
        <h2 className="document-workspace-title">{itemLabel}</h2>
        <Button type="button" variant="default" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="document-workspace-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "draft"}
          className={`document-workspace-tab ${activeTab === "draft" ? "document-workspace-tab--active" : ""}`}
          onClick={() => setActiveTab("draft")}
        >
          Draft
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "sources"}
          className={`document-workspace-tab ${activeTab === "sources" ? "document-workspace-tab--active" : ""}`}
          onClick={() => setActiveTab("sources")}
        >
          Sources / Evidence
        </button>
      </div>

      {activeTab === "draft" && (
        <div className="document-workspace-draft" role="tabpanel">
          <p className="document-workspace-version">Version {artifact.version}</p>
          <div
            className="document-workspace-draft-content"
            dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(artifact.content) }}
          />
        </div>
      )}

      {activeTab === "sources" && (
        <div className="document-workspace-sources" role="tabpanel">
          <p className="document-workspace-muted">
            Citations from the protocol used to generate each section will appear here. Section-level citation extraction can be added in a future update.
          </p>
        </div>
      )}

      <div className="document-workspace-regenerate">
        <h3 className="document-workspace-section-heading">Regenerate</h3>
        <p className="document-workspace-muted">Pick a reason and regenerate to create a new version (previous version is retained).</p>
        <select
          className="document-workspace-reason-select"
          value={regenerateReason}
          onChange={(e) => setRegenerateReason(e.target.value)}
          aria-label="Regenerate reason"
        >
          <option value="">Select reason…</option>
          {REGENERATE_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="default"
          onClick={() => handleRegenerate(regenerateReason)}
          disabled={!regenerateReason.trim() || regenerateLoading}
          loading={regenerateLoading}
        >
          Regenerate
        </Button>
      </div>

      <div className="document-workspace-approval">
        <h3 className="document-workspace-section-heading">Approval gate</h3>
        <label className="document-workspace-approval-checkbox">
          <input
            type="checkbox"
            checked={approvalChecked}
            onChange={(e) => setApprovalChecked(e.target.checked)}
            aria-label="I have reviewed and confirm accuracy"
          />
          <span>I have reviewed and confirm accuracy</span>
        </label>
        <div className="document-workspace-approval-actions">
          <Button
            type="button"
            variant="primary"
            onClick={handleMarkComplete}
            disabled={!approvalChecked || approveLoading}
            loading={approveLoading}
          >
            Mark complete
          </Button>
        </div>
      </div>

      {error && (
        <div className="document-workspace-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

/** Minimal markdown-like rendering for draft content (safe HTML). */
function simpleMarkdownToHtml(text: string): string {
  return text
    .split(/\n/)
    .map((line) => {
      if (/^### /.test(line)) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      if (/^## /.test(line)) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (/^# /.test(line)) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.trim() === "---") return "<hr />";
      if (line.trim() === "") return "";
      const escaped = escapeHtml(line);
      const withBold = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      return `<p>${withBold}</p>`;
    })
    .join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
