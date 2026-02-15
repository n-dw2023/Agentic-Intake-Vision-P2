/**
 * Extraction Summary Card: display extracted study attributes with confidence, citations, edit, and confirm.
 * Story 1: Protocol ingestion and extraction.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProtocolEvidenceBlock } from "./ProtocolEvidenceBlock";
import type { ExtractionResult, Citation } from "../api";

const FIELD_LABELS: Record<string, string> = {
  title: "Study Title",
  sponsor: "Sponsor",
  interventional: "Interventional trial?",
  cancer_related: "Cancer-related?",
  participating_orgs: "Participating organizations",
};

const REQUIRED_FIELDS = ["title", "sponsor", "interventional", "cancer_related", "participating_orgs"];

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const level = confidence.toLowerCase();
  const className =
    level === "high"
      ? "extraction-confidence extraction-confidence--high"
      : level === "medium"
        ? "extraction-confidence extraction-confidence--medium"
        : "extraction-confidence extraction-confidence--low";
  const label = level === "high" ? "High" : level === "medium" ? "Medium" : "Low";
  return <span className={className}>{label}</span>;
}

function CitationItem({
  citation,
  onJumpToEvidence,
}: {
  citation: Citation;
  onJumpToEvidence?: (citation: Citation) => void;
}) {
  return (
    <ProtocolEvidenceBlock
      snippet={citation.snippet}
      page={citation.page}
      onClick={onJumpToEvidence ? () => onJumpToEvidence(citation) : undefined}
      interactive={!!onJumpToEvidence}
    />
  );
}

type Props = {
  extractionResults: ExtractionResult[];
  protocolAssetId: string;
  onConfirm: (results: ExtractionResult[]) => void;
  onJumpToEvidence?: (citation: Citation) => void;
  confirmLoading?: boolean;
  error?: string | null;
};

export function ExtractionSummaryCard({
  extractionResults,
  protocolAssetId: _protocolAssetId,
  onConfirm,
  onJumpToEvidence,
  confirmLoading = false,
  error = null,
}: Props) {
  const [edited, setEdited] = useState<Record<string, ExtractionResult>>({});
  const [editField, setEditField] = useState<string | null>(null);

  const getResult = (fieldName: string): ExtractionResult => {
    const e = edited[fieldName];
    if (e) return e;
    const r = extractionResults.find((r) => r.field_name === fieldName);
    if (r) return r;
    return {
      field_name: fieldName,
      value: fieldName === "participating_orgs" ? [] : fieldName === "title" || fieldName === "sponsor" ? "" : false,
      confidence: "low",
      citations: [],
      provenance: "inferred",
    };
  };

  const handleEdit = (fieldName: string, value: string | boolean | string[]) => {
    const current = getResult(fieldName);
    setEdited((prev) => ({
      ...prev,
      [fieldName]: {
        ...current,
        value,
        provenance: "user-provided",
      },
    }));
    setEditField(null);
  };

  const resultsToSubmit = REQUIRED_FIELDS.map((fieldName) => getResult(fieldName));

  return (
    <div className="extraction-summary-card" role="region" aria-labelledby="extraction-summary-heading">
      <h3 id="extraction-summary-heading" className="extraction-summary-heading">
        Extraction Summary
      </h3>
      {error && (
        <div className="extraction-summary-error" role="alert">
          {error}
        </div>
      )}
      <dl className="extraction-summary-list">
        {resultsToSubmit.map((r) => (
          <div key={r.field_name} className="extraction-summary-row">
            <dt className="extraction-summary-label">{FIELD_LABELS[r.field_name] ?? r.field_name}</dt>
            <dd className="extraction-summary-value">
              {editField === r.field_name ? (
                r.field_name === "participating_orgs" ? (
                  <textarea
                    className="extraction-summary-input"
                    value={Array.isArray(r.value) ? r.value.join("\n") : ""}
                    onChange={(e) =>
                      handleEdit(
                        r.field_name,
                        e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    onBlur={() => setEditField(null)}
                    rows={3}
                    aria-label={`Edit ${FIELD_LABELS[r.field_name]}`}
                  />
                ) : r.field_name === "interventional" || r.field_name === "cancer_related" ? (
                  <label className="extraction-summary-checkbox">
                    <input
                      type="checkbox"
                      checked={r.value === true}
                      onChange={(e) => handleEdit(r.field_name, e.target.checked)}
                      onBlur={() => setEditField(null)}
                    />
                    Yes
                  </label>
                ) : (
                  <input
                    type="text"
                    className="extraction-summary-input"
                    value={typeof r.value === "string" ? r.value : ""}
                    onChange={(e) => handleEdit(r.field_name, e.target.value)}
                    onBlur={() => setEditField(null)}
                    aria-label={`Edit ${FIELD_LABELS[r.field_name]}`}
                  />
                )
              ) : (
                <>
                  {r.field_name === "participating_orgs" ? (
                    Array.isArray(r.value) && r.value.length > 0 ? (
                      <ul>
                        {r.value.map((org, i) => (
                          <li key={i}>{org}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="extraction-summary-empty">—</span>
                    )
                  ) : r.field_name === "interventional" || r.field_name === "cancer_related" ? (
                    r.value === true ? "Yes" : "No"
                  ) : (
                    (r.value as string) || <span className="extraction-summary-empty">—</span>
                  )}
                  <button
                    type="button"
                    className="extraction-summary-edit-btn"
                    onClick={() => setEditField(r.field_name)}
                    aria-label={`Edit ${FIELD_LABELS[r.field_name]}`}
                  >
                    Edit
                  </button>
                </>
              )}
              <ConfidenceBadge confidence={r.confidence} />
              {r.citations && r.citations.length > 0 && (
                <div className="extraction-summary-citations">
                  {r.citations.map((c, i) => (
                    <CitationItem
                      key={i}
                      citation={c}
                      onJumpToEvidence={onJumpToEvidence}
                    />
                  ))}
                </div>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="extraction-summary-actions">
        <Button
          type="button"
          variant="primary"
          onClick={() => onConfirm(resultsToSubmit)}
          disabled={confirmLoading}
          loading={confirmLoading}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
