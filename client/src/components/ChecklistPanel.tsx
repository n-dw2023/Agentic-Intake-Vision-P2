/**
 * Checklist Panel: render checklist items with status pills and actions (Story 3).
 */

import { useState, useCallback, useEffect } from "react";
import {
  getChecklist,
  getStudyProject,
  startChecklistItem,
  updateChecklistItemStatus,
  updateChecklistItemNotNeeded,
  regenerateChecklistItem,
  type ChecklistItem,
  type ChecklistStatus,
  type StudyProject,
} from "../api";
import { Button } from "@/components/ui/button";
import { StudyProjectSummaryHeader } from "./StudyProjectSummaryHeader";

/** Flatten tree to all item IDs (for default collapsed state). */
function getAllItemIds(list: ChecklistItem[]): string[] {
  return list.flatMap((i) => [i.itemId, ...(i.children?.length ? getAllItemIds(i.children) : [])]);
}

const STATUS_LABELS: Record<ChecklistStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  needs_review: "Needs review",
  ready_to_submit: "Ready to submit",
  complete: "Complete",
  blocked: "Blocked",
};

type Props = {
  projectId: string;
  projectTitle?: string;
  onClose: () => void;
  onOpenItem?: (itemId: string, type: "document" | "intake", itemLabel?: string) => void;
};

export function ChecklistPanel({ projectId, projectTitle, onClose, onOpenItem }: Props) {
  const [project, setProject] = useState<(StudyProject & { status?: string; updatedAt?: string }) | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [regenerateReason, setRegenerateReason] = useState<{ itemId: string; value: string } | null>(null);
  /** Item IDs whose card body is collapsed to header-only. Default all collapsed on first load. */
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());

  const fetchProject = useCallback(async () => {
    setProjectLoading(true);
    try {
      const p = await getStudyProject(projectId);
      setProject(p);
    } catch {
      setProject(null);
    } finally {
      setProjectLoading(false);
    }
  }, [projectId]);

  const fetchChecklist = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await getChecklist(projectId);
      setItems(res.items);
      if (!options?.silent && res.items.length > 0) {
        setCollapsedCards(new Set(getAllItemIds(res.items)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checklist");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleStart = useCallback(
    async (itemId: string) => {
      setActionLoading(`start-${itemId}`);
      try {
        await startChecklistItem(projectId, itemId);
        await fetchChecklist({ silent: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start");
      } finally {
        setActionLoading(null);
      }
    },
    [projectId, fetchChecklist]
  );

  const handleUpdateStatus = useCallback(
    async (itemId: string, status: ChecklistStatus) => {
      setActionLoading(`status-${itemId}`);
      try {
        await updateChecklistItemStatus(projectId, itemId, status);
        await fetchChecklist({ silent: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update status");
      } finally {
        setActionLoading(null);
      }
    },
    [projectId, fetchChecklist]
  );

  const handleRegenerate = useCallback(
    async (itemId: string, reason: string) => {
      if (!reason.trim()) return;
      setActionLoading(`regenerate-${itemId}`);
      try {
        await regenerateChecklistItem(projectId, itemId, reason.trim());
        setRegenerateReason(null);
        await fetchChecklist({ silent: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to regenerate");
      } finally {
        setActionLoading(null);
      }
    },
    [projectId, fetchChecklist]
  );

  const handleNotNeededToggle = useCallback(
    async (itemId: string, notNeeded: boolean) => {
      setActionLoading(`not-needed-${itemId}`);
      try {
        await updateChecklistItemNotNeeded(projectId, itemId, notNeeded);
        await fetchChecklist({ silent: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      } finally {
        setActionLoading(null);
      }
    },
    [projectId, fetchChecklist]
  );

  const toggleCardCollapsed = useCallback((itemId: string) => {
    setCollapsedCards((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="checklist-panel">
        <div className="checklist-panel-header">
          <h2 className="checklist-panel-title">Checklist</h2>
          <Button type="button" variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="checklist-panel-muted">Loading checklist…</p>
      </div>
    );
  }

  return (
    <div className="checklist-panel">
      <div className="checklist-panel-header">
        <h2 className="checklist-panel-title">Checklist{project?.title ? ` — ${project.title}` : projectTitle ? ` — ${projectTitle}` : ""}</h2>
        <Button type="button" variant="default" onClick={onClose}>
          Close
        </Button>
      </div>
      {!projectLoading && project && (
        <StudyProjectSummaryHeader project={project} />
      )}
      {error && (
        <div className="checklist-panel-error" role="alert">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <p className="checklist-panel-muted">
          No checklist items for this project. This project may not match the criteria (Interventional and Cancer-related).
        </p>
      ) : (
        <ul className="checklist-list" role="list">
          {items.map((item) => (
            <ChecklistItemRow
              key={item.itemId}
              item={item}
              projectId={projectId}
              actionLoading={actionLoading}
              regenerateReason={regenerateReason}
              collapsedCards={collapsedCards}
              onStart={handleStart}
              onUpdateStatus={handleUpdateStatus}
              onRegenerate={handleRegenerate}
              setRegenerateReason={setRegenerateReason}
              onNotNeededToggle={handleNotNeededToggle}
              onToggleCardCollapsed={toggleCardCollapsed}
              onOpenItem={onOpenItem}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ChecklistItemRow({
  item,
  projectId,
  actionLoading,
  regenerateReason,
  collapsedCards,
  onStart,
  onUpdateStatus,
  onRegenerate,
  setRegenerateReason,
  onNotNeededToggle,
  onToggleCardCollapsed,
  onOpenItem,
  depth = 0,
}: {
  item: ChecklistItem;
  projectId: string;
  actionLoading: string | null;
  regenerateReason: { itemId: string; value: string } | null;
  collapsedCards: Set<string>;
  onStart: (itemId: string) => void;
  onUpdateStatus: (itemId: string, status: ChecklistStatus) => void;
  onRegenerate: (itemId: string, reason: string) => void;
  setRegenerateReason: (v: { itemId: string; value: string } | null) => void;
  onNotNeededToggle: (itemId: string, notNeeded: boolean) => void;
  onToggleCardCollapsed: (itemId: string) => void;
  onOpenItem?: (itemId: string, type: "document" | "intake", itemLabel?: string) => void;
  depth?: number;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isCardCollapsed = collapsedCards.has(item.itemId);
  const notNeeded = item.notNeeded === true;

  return (
    <li
      className={`checklist-item ${notNeeded ? "checklist-item--not-needed" : ""}`}
      style={{ marginLeft: depth ? "var(--spacing-4)" : 0 }}
    >
      <div
        className="checklist-item-header"
        role="button"
        tabIndex={0}
        onClick={() => onToggleCardCollapsed(item.itemId)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleCardCollapsed(item.itemId);
          }
        }}
        aria-expanded={!isCardCollapsed}
        aria-label={isCardCollapsed ? `Expand ${item.label}` : `Collapse ${item.label}`}
      >
        <span className="checklist-item-chevron" aria-hidden>
          {isCardCollapsed ? "▶" : "▼"}
        </span>
        <span className={`checklist-item-label ${notNeeded ? "checklist-item-label--struck" : ""}`}>{item.label}</span>
        <span className={`checklist-status-pill checklist-status-pill--${item.status.replace(/_/g, "-")}`}>
          {STATUS_LABELS[item.status]}
        </span>
      </div>
      {!isCardCollapsed && (
        <>
          {item.questionForUser && (
            <p className={`checklist-item-question ${notNeeded ? "checklist-item-label--struck" : ""}`} aria-live="polite">
              {item.questionForUser}
            </p>
          )}
          {item.expandedText && (
            <p className={`checklist-item-expanded ${notNeeded ? "checklist-item-label--struck" : ""}`} aria-hidden>
              {item.expandedText}
            </p>
          )}
          <div className="checklist-item-actions">
        <label className="checklist-not-needed-toggle">
          <input
            type="checkbox"
            checked={notNeeded}
            onChange={(e) => {
              e.stopPropagation();
              onNotNeededToggle(item.itemId, e.target.checked);
            }}
            disabled={!!actionLoading}
            aria-label={`Mark "${item.label}" as not needed`}
          />
          <span>Not needed</span>
        </label>
        {!notNeeded && item.status === "not_started" && (
          <Button
            type="button"
            variant="primary"
            onClick={() => onStart(item.itemId)}
            disabled={!!actionLoading}
          >
            Start
          </Button>
        )}
        {!notNeeded && item.status !== "not_started" && item.type === "document" && onOpenItem && (
          <Button
            type="button"
            variant="default"
            onClick={() => onOpenItem(item.itemId, "document", item.label)}
            aria-label={`View draft for ${item.label}`}
          >
            View draft
          </Button>
        )}
        {!notNeeded && item.type === "intake" && onOpenItem && (
          <Button
            type="button"
            variant="default"
            onClick={() => onOpenItem(item.itemId, "intake", item.label)}
            aria-label={`Map data for ${item.label}`}
          >
            Map data
          </Button>
        )}
        {!notNeeded && item.status === "needs_review" && (
          <Button
            type="button"
            variant="default"
            onClick={() => onUpdateStatus(item.itemId, "ready_to_submit")}
            disabled={!!actionLoading}
          >
            Mark ready to submit
          </Button>
        )}
        {!notNeeded && item.status === "ready_to_submit" && item.type === "intake" && (
          <Button
            type="button"
            variant="primary"
            onClick={() => onUpdateStatus(item.itemId, "complete")}
            disabled={!!actionLoading}
          >
            Submit
          </Button>
        )}
        {!notNeeded && item.status !== "not_started" && item.type === "document" && (
          <>
            {regenerateReason?.itemId === item.itemId ? (
              <span className="checklist-regenerate-inline">
                <input
                  type="text"
                  className="checklist-regenerate-input"
                  placeholder="Reason (e.g. fix content)"
                  value={regenerateReason.value}
                  onChange={(e) => setRegenerateReason({ itemId: item.itemId, value: e.target.value })}
                  aria-label="Regenerate reason"
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={() => onRegenerate(item.itemId, regenerateReason.value)}
                  disabled={!!actionLoading}
                >
                  Regenerate
                </Button>
                <Button type="button" variant="default"  onClick={() => setRegenerateReason(null)}>
                  Cancel
                </Button>
              </span>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={() => setRegenerateReason({ itemId: item.itemId, value: "" })}
                disabled={!!actionLoading}
              >
                Regenerate
              </Button>
            )}
          </>
        )}
      </div>
      {hasChildren && (
        <div className="checklist-item-children" aria-label={`Sub-items for ${item.label}`}>
          {item.children!.map((child) => (
            <ChecklistItemRow
              key={child.itemId}
              item={child}
              projectId={projectId}
              actionLoading={actionLoading}
              regenerateReason={regenerateReason}
              collapsedCards={collapsedCards}
              onStart={onStart}
              onUpdateStatus={onUpdateStatus}
              onRegenerate={onRegenerate}
              setRegenerateReason={setRegenerateReason}
              onNotNeededToggle={onNotNeededToggle}
              onToggleCardCollapsed={onToggleCardCollapsed}
              onOpenItem={onOpenItem}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
        </>
      )}
    </li>
  );
}
