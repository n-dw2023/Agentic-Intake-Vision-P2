/**
 * Create Study Project flow: upload/paste protocol → ingest → extract → confirm → create project → Project Created.
 * Story 1: Protocol ingestion and extraction. Story 2: Study project creation.
 */

import { useState, useCallback } from "react";
import {
  ingestProtocolFile,
  ingestProtocolText,
  extractProtocol,
  confirmExtraction,
  createStudyProject,
  type ExtractionResult,
  type StudyProject,
} from "../api";
import { ExtractionSummaryCard } from "./ExtractionSummaryCard";
import { ProjectCreatedCard } from "./ProjectCreatedCard";
import { Button } from "@/components/ui/button";

type Step = "upload" | "extracting" | "summary" | "confirmed" | "creating" | "projectCreated";

type Props = {
  onClose: () => void;
  onViewChecklist?: (projectId: string) => void;
};

function getValue(results: ExtractionResult[], fieldName: string): string | boolean | string[] {
  const r = results.find((x) => x.field_name === fieldName);
  if (!r) return fieldName === "participating_orgs" ? [] : fieldName === "title" || fieldName === "sponsor" ? "" : false;
  return r.value;
}

export function CreateStudyProjectFlow({ onClose, onViewChecklist }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [protocolAssetId, setProtocolAssetId] = useState<string | null>(null);
  const [extractionResults, setExtractionResults] = useState<ExtractionResult[] | null>(null);
  const [confirmedResults, setConfirmedResults] = useState<ExtractionResult[] | null>(null);
  const [createdProject, setCreatedProject] = useState<StudyProject | null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [, setExtractLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIngestLoading(true);
    try {
      const res = await ingestProtocolFile(file);
      setProtocolAssetId(res.protocolAssetId);
      setStep("extracting");
      setExtractLoading(true);
      const ext = await extractProtocol(res.protocolAssetId);
      setExtractionResults(ext.extractionResults);
      setStep("summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIngestLoading(false);
      setExtractLoading(false);
    }
  }, []);

  const handlePasteSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError(null);
      setIngestLoading(true);
      try {
        const res = await ingestProtocolText(text.trim());
        setProtocolAssetId(res.protocolAssetId);
        setStep("extracting");
        setExtractLoading(true);
        const ext = await extractProtocol(res.protocolAssetId);
        setExtractionResults(ext.extractionResults);
        setStep("summary");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ingest failed");
      } finally {
        setIngestLoading(false);
        setExtractLoading(false);
      }
    },
    []
  );

  const handleConfirm = useCallback(
    async (results: ExtractionResult[]) => {
      if (!protocolAssetId) return;
      setError(null);
      setConfirmLoading(true);
      try {
        await confirmExtraction(protocolAssetId, results);
        setConfirmedResults(results);
        setStep("confirmed");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Confirm failed");
      } finally {
        setConfirmLoading(false);
      }
    },
    [protocolAssetId]
  );

  const handleCreateProject = useCallback(async () => {
    if (!protocolAssetId || !confirmedResults?.length) return;
    setError(null);
    setCreateLoading(true);
    setStep("creating");
    try {
      const title = String(getValue(confirmedResults, "title") ?? "").trim() || "Untitled study";
      const sponsor = String(getValue(confirmedResults, "sponsor") ?? "").trim() || "—";
      const interventional = getValue(confirmedResults, "interventional") === true;
      const cancerRelated = getValue(confirmedResults, "cancer_related") === true;
      const participatingOrgs = (getValue(confirmedResults, "participating_orgs") as string[]) ?? [];
      const project = await createStudyProject(protocolAssetId, {
        title,
        sponsor,
        interventional,
        cancerRelated,
        participatingOrgs: Array.isArray(participatingOrgs) ? participatingOrgs : [],
      });
      setCreatedProject(project);
      setStep("projectCreated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create project failed");
      setStep("confirmed");
    } finally {
      setCreateLoading(false);
    }
  }, [protocolAssetId, confirmedResults]);

  return (
    <div className="create-study-project-flow">
      <div className="create-study-project-header">
        <h2>Create Study Project</h2>
        <Button type="button" variant="default" onClick={onClose}>
          Close
        </Button>
      </div>

      {step === "upload" && (
        <div className="protocol-upload-section">
          <p className="protocol-upload-intro">
            Upload a protocol document (PDF or DOCX) or paste text below to extract study attributes.
          </p>
          <div className="protocol-upload-actions">
            <label className="protocol-upload-button">
              <span className="protocol-upload-button-text">Choose PDF or DOCX file</span>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={ingestLoading}
                aria-label="Upload protocol (PDF or DOCX)"
                className="protocol-upload-input"
              />
            </label>
          </div>
          <div className="protocol-upload-paste">
            <label htmlFor="protocol-paste-text">Or paste protocol text</label>
            <textarea
              id="protocol-paste-text"
              className="protocol-paste-textarea"
              placeholder="Paste protocol text here…"
              rows={6}
              disabled={ingestLoading}
              aria-label="Paste protocol text"
            />
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const el = document.getElementById("protocol-paste-text") as HTMLTextAreaElement;
                if (el?.value) handlePasteSubmit(el.value);
              }}
              disabled={ingestLoading}
              loading={ingestLoading}
            >
              Submit text
            </Button>
          </div>
          {error && (
            <div className="protocol-upload-error" role="alert">
              {error}
            </div>
          )}
        </div>
      )}

      {step === "extracting" && (
        <div className="protocol-extracting" aria-busy="true">
          <p>Extracting study attributes…</p>
        </div>
      )}

      {step === "summary" && protocolAssetId && extractionResults && (
        <ExtractionSummaryCard
          extractionResults={extractionResults}
          protocolAssetId={protocolAssetId}
          onConfirm={handleConfirm}
          confirmLoading={confirmLoading}
          error={error}
        />
      )}

      {step === "confirmed" && (
        <div className="protocol-confirmed">
          <p>Extraction confirmed. Create the study project to get a project ID and link your extraction.</p>
          <Button
            type="button"
            variant="primary"
            onClick={handleCreateProject}
            disabled={createLoading}
            loading={createLoading}
          >
            Create project
          </Button>
          <Button type="button" variant="default" onClick={onClose} className="ml-2">
            Done without creating
          </Button>
          {error && (
            <div className="protocol-upload-error" role="alert" style={{ marginTop: "var(--spacing-3)" }}>
              {error}
            </div>
          )}
        </div>
      )}

      {step === "creating" && (
        <div className="protocol-extracting" aria-busy="true">
          <p>Creating study project…</p>
        </div>
      )}

      {step === "projectCreated" && createdProject && (
        <ProjectCreatedCard
          project={createdProject}
          onDone={onClose}
          onViewChecklist={onViewChecklist}
        />
      )}
    </div>
  );
}
