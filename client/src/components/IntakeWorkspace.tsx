/**
 * Intake workspace: field map table, evidence, submit gate (Story 5).
 */

import { useState, useCallback, useEffect } from "react";
import {
  getIntakeFieldMap,
  updateIntakeField,
  submitIntake,
  type IntakeFieldMap,
  type IntakeFieldMapEntry,
} from "../api";
import { Button } from "@/components/ui/button";

type Props = {
  projectId: string;
  itemId: string;
  itemLabel: string;
  onClose: () => void;
  onStatusUpdated?: () => void;
};

export function IntakeWorkspace({
  projectId,
  itemId,
  itemLabel,
  onClose,
  onStatusUpdated,
}: Props) {
  const [fieldMap, setFieldMap] = useState<IntakeFieldMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchFieldMap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const map = await getIntakeFieldMap(projectId, itemId);
      setFieldMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load field map");
      setFieldMap(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, itemId]);

  useEffect(() => {
    fetchFieldMap();
  }, [fetchFieldMap]);

  const handleStartEdit = useCallback((entry: IntakeFieldMapEntry) => {
    setEditingKey(entry.key);
    const v = entry.proposedValue;
    setEditValue(Array.isArray(v) ? v.join("\n") : typeof v === "boolean" ? (v ? "true" : "false") : String(v ?? ""));
  }, []);

  const handleSaveEdit = useCallback(
    async (key: string) => {
      if (!fieldMap) return;
      const entry = fieldMap.fields.find((f) => f.key === key);
      if (!entry) return;
      setSaveLoading(key);
      setError(null);
      try {
        let value: string | boolean | string[];
        if (entry.key === "study_title" || entry.key === "sponsor" || entry.key === "lab_name" || entry.key === "modality" || entry.key === "pharmacy_contact" || entry.key === "build_notes" || entry.key === "processing_notes" || entry.key === "protocol_notes" || entry.key === "dispensing_notes" || entry.key === "agreement_notes") {
          value = editValue.trim();
        } else {
          value = editValue.trim();
        }
        await updateIntakeField(projectId, itemId, key, value);
        setEditingKey(null);
        await fetchFieldMap();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setSaveLoading(null);
      }
    },
    [projectId, itemId, fieldMap, editValue, fetchFieldMap]
  );

  const handleSubmit = useCallback(async () => {
    if (!confirmChecked) return;
    setSubmitLoading(true);
    setError(null);
    try {
      await submitIntake(projectId, itemId, true);
      onStatusUpdated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitLoading(false);
    }
  }, [projectId, itemId, confirmChecked, onStatusUpdated, onClose]);

  const canSubmit =
    fieldMap &&
    !fieldMap.fields.some((f) => f.required && f.validationState === "missing") &&
    confirmChecked;

  if (loading) {
    return (
      <div className="intake-workspace">
        <div className="intake-workspace-header">
          <h2 className="intake-workspace-title">{itemLabel}</h2>
          <Button type="button" variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="intake-workspace-muted">Loading field map…</p>
      </div>
    );
  }

  if (!fieldMap) {
    return (
      <div className="intake-workspace">
        <div className="intake-workspace-header">
          <h2 className="intake-workspace-title">{itemLabel}</h2>
          <Button type="button" variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
        {error && (
          <div className="intake-workspace-error" role="alert">
            {error}
          </div>
        )}
        <p className="intake-workspace-muted">This item does not have an intake field map.</p>
      </div>
    );
  }

  return (
    <div className="intake-workspace">
      <div className="intake-workspace-header">
        <h2 className="intake-workspace-title">{itemLabel}</h2>
        <Button type="button" variant="default" onClick={onClose}>
          Close
        </Button>
      </div>

      <section className="intake-workspace-section" aria-labelledby="intake-field-map-heading">
        <h3 id="intake-field-map-heading" className="intake-workspace-section-heading">
          Field map
        </h3>
        <div className="intake-workspace-table-wrap">
          <table className="intake-workspace-table" role="table">
            <thead>
              <tr>
                <th scope="col">Required field</th>
                <th scope="col">Proposed value</th>
                <th scope="col">Source</th>
                <th scope="col">Confidence</th>
                <th scope="col">Validation</th>
              </tr>
            </thead>
            <tbody>
              {fieldMap.fields.map((entry) => (
                <tr key={entry.key} className={entry.validationState === "missing" ? "intake-workspace-row--missing" : ""}>
                  <td>
                    {entry.label}
                    {entry.required && <span className="intake-workspace-required" aria-label="Required"> *</span>}
                  </td>
                  <td>
                    {editingKey === entry.key ? (
                      <div className="intake-workspace-edit">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(entry.key)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) handleSaveEdit(entry.key);
                            if (e.key === "Escape") setEditingKey(null);
                          }}
                          disabled={saveLoading === entry.key}
                          aria-label={`Edit ${entry.label}`}
                          className="intake-workspace-edit-textarea"
                          rows={4}
                        />
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => handleSaveEdit(entry.key)}
                          disabled={saveLoading === entry.key}
                          loading={saveLoading === entry.key}
                          className="intake-workspace-save-btn"
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <span className="intake-workspace-value">
                        {Array.isArray(entry.proposedValue)
                          ? entry.proposedValue.join(", ") || "—"
                          : typeof entry.proposedValue === "boolean"
                            ? entry.proposedValue ? "Yes" : "No"
                            : (entry.proposedValue as string) || "—"}
                      </span>
                    )}
                    {editingKey !== entry.key && (
                      <button
                        type="button"
                        className="intake-workspace-edit-btn"
                        onClick={() => handleStartEdit(entry)}
                        aria-label={`Edit ${entry.label}`}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                  <td className="intake-workspace-source">{entry.source === "user-provided" ? "User-provided" : "Extraction"}</td>
                  <td>{entry.confidence ?? "—"}</td>
                  <td>
                    <span className={`intake-workspace-validation intake-workspace-validation--${entry.validationState}`}>
                      {entry.validationState === "missing" && "Missing"}
                      {entry.validationState === "ok" && "OK"}
                      {entry.validationState === "needs_attention" && "Needs attention"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {fieldMap.questions.length > 0 && (
        <section className="intake-workspace-section" aria-labelledby="intake-questions-heading">
          <h3 id="intake-questions-heading" className="intake-workspace-section-heading">
            Exceptions / questions
          </h3>
          <ul className="intake-workspace-questions">
            {fieldMap.questions.map((q) => (
              <li key={q.id}>{q.text}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="intake-workspace-submit">
        <h3 className="intake-workspace-section-heading">Submit</h3>
        <p className="intake-workspace-muted">
          All required fields must be filled. Confirm below to submit and mark this intake complete.
        </p>
        <label className="intake-workspace-confirm-label">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            aria-label="I confirm all required fields are accurate"
          />
          <span>I confirm all required fields are accurate and complete</span>
        </label>
        <div className="intake-workspace-submit-actions">
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || submitLoading}
            loading={submitLoading}
          >
            Submit
          </Button>
        </div>
      </div>

      {error && (
        <div className="intake-workspace-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
