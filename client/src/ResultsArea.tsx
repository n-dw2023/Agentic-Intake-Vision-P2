import { useState } from "react";
import type { UiSpec } from "./api";
import type { RunResult } from "./api";
import { InlineError } from "@/components/InlineError";

const COLLAPSED_LENGTH = 800;

type Props = {
  uiSpec: UiSpec;
  results: RunResult[] | null;
  loading?: boolean;
  error: string | null;
  /** Optional technical details (e.g. stack) for Copy details / expandable. */
  errorDetails?: string | null;
  /** When provided and error is set, shows Retry button. */
  onRetry?: () => void;
};

/** Map run results by outputLabel (and agentId) for lookup. */
function mapResults(results: RunResult[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of results) {
    m.set(r.outputLabel, r.content);
    m.set(r.agentId, r.content);
  }
  return m;
}

/** Render content as plain text only (no HTML) to avoid XSS. Optional Show more/less for long content. */
function SafeContent({
  text,
  sectionId,
  expandedSections,
  onToggle,
}: {
  text: string;
  sectionId: string;
  expandedSections: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isLong = text.length > COLLAPSED_LENGTH;
  const expanded = expandedSections.has(sectionId);
  const displayText = isLong && !expanded ? text.slice(0, COLLAPSED_LENGTH) : text;
  const hasMore = isLong && !expanded && text.length > COLLAPSED_LENGTH;

  return (
    <div className="results-content-wrap">
      <pre className="results-content">{displayText}{hasMore ? "…" : ""}</pre>
      {isLong && (
        <button
          type="button"
          className="results-show-more"
          onClick={() => onToggle(sectionId)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export function ResultsArea({ uiSpec, results, loading, error, errorDetails, onRetry }: Props) {
  const sections = uiSpec?.results?.sections ?? [];
  const byLabel = results ? mapResults(results) : null;
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const handleToggle = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (sections.length === 0) return null;

  return (
    <div className="results-area">
      <h3 className="results-heading">Results</h3>
      {error && (
        <InlineError
          message={error}
          details={errorDetails ?? undefined}
          onRetry={onRetry}
          className="results-error"
        />
      )}
      {loading && (
        <div className="results-loading-wrapper" aria-busy="true">
          <div className="results-loading">
            Running workflow…
          </div>
        </div>
      )}
      {!loading && (
        <div className="results-sections">
          {sections.map((section: { id: string; label: string; agentIdOrOutputLabel: string }) => {
            const content = byLabel?.get(section.agentIdOrOutputLabel) ?? null;
            return (
              <section
                key={section.id}
                className="results-section"
                aria-labelledby={`section-label-${section.id}`}
              >
                <h4 id={`section-label-${section.id}`} className="results-section-label">
                  {section.label}
                </h4>
                {content !== null ? (
                  <SafeContent
                    text={content}
                    sectionId={section.id}
                    expandedSections={expandedSections}
                    onToggle={handleToggle}
                  />
                ) : (
                  <p className="results-placeholder">Run to generate</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
