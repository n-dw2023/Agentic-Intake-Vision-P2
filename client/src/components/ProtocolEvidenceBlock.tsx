/**
 * Shared protocol evidence / citation display. Matches Proposed value styling
 * for consistency across Extraction Summary and Intake Workspace.
 */

import { useState } from "react";

const SNIPPET_PREVIEW_LENGTH = 320;

/** Collapse fragmented words (e.g. "A si n gl e- d os e" -> "A single-dose") from extraction artifacts. */
function collapseFragmentedWords(s: string): string {
  const tokens = s.trim().split(/\s+/);
  if (tokens.length === 0) return s;
  const out: string[] = [];
  let run: string[] = [];
  for (const t of tokens) {
    if (t.length === 1) {
      run.push(t);
    } else {
      if (run.length) {
        out.push(run.join(""));
        run = [];
      }
      out.push(t);
    }
  }
  if (run.length) out.push(run.join(""));
  return out.join(" ");
}

/** Normalize snippet: collapse whitespace and fix fragmented words so it matches Proposed value display. */
function normalizeSnippet(s: string, label?: string): string {
  let t = s.replace(/\s+/g, " ").trim();
  if (label && t.toLowerCase().startsWith(label.toLowerCase())) {
    t = t.slice(label.length).replace(/^\s*[:\-–—]\s*/i, "").trim();
  }
  return collapseFragmentedWords(t);
}

type Props = {
  snippet: string;
  /** Optional label (e.g. field name) shown before the value. */
  label?: string;
  /** Optional page number from the protocol. */
  page?: number;
  /** Optional click handler (e.g. jump to evidence in protocol). */
  onClick?: () => void;
  /** If true, render as interactive button for accessibility. */
  interactive?: boolean;
};

export function ProtocolEvidenceBlock({
  snippet,
  label,
  page,
  onClick,
  interactive = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const normalized = normalizeSnippet(snippet, label);
  const isLong = normalized.length > SNIPPET_PREVIEW_LENGTH;
  const displayText = expanded || !isLong
    ? normalized
    : normalized.slice(0, SNIPPET_PREVIEW_LENGTH) + "…";

  const content = (
    <>
      {(label || page != null) && (
        <span className="protocol-evidence-meta">
          {label && <span className="protocol-evidence-label">{label}</span>}
          {label && page != null && <span className="protocol-evidence-meta-sep"> · </span>}
          {page != null && (
            <span className="protocol-evidence-page" aria-label={`Page ${page}`}>
              Page {page}
            </span>
          )}
        </span>
      )}
      {(label || page != null) && " "}
      <span className="protocol-evidence-value">{displayText}</span>
      {isLong && !expanded && (
        <>
          {" "}
          <button
            type="button"
            className="protocol-evidence-show-more"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            aria-expanded={false}
          >
            Show more
          </button>
        </>
      )}
      {isLong && expanded && (
        <>
          {" "}
          <button
            type="button"
            className="protocol-evidence-show-more"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            aria-expanded={true}
          >
            Show less
          </button>
        </>
      )}
    </>
  );

  const className = [
    "protocol-evidence-block",
    interactive ? "protocol-evidence-block--interactive" : "",
  ].filter(Boolean).join(" ");

  if (interactive && onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        title="Jump to evidence in protocol"
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
