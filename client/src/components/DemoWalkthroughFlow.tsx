/**
 * Demo walkthrough: step-by-step flow (sample protocol → extraction → study project → checklist)
 * without LLMs. Use from the homepage "Try demo" button. Separate from the real Create Study Project flow.
 */

import { useState, useCallback } from "react";
import { loadDemoProtocol, loadDemoProject, type ExtractionResult, type StudyProject } from "../api";
import { ExtractionSummaryCard } from "./ExtractionSummaryCard";
import { ProjectCreatedCard } from "./ProjectCreatedCard";
import { Button } from "@/components/ui/button";

/** Sample protocol text shown in the demo (matches server demo content for consistency). */
const DEMO_PROTOCOL_PREVIEW = `Demo Protocol for Study Project
This is sample protocol text used for demonstration. The study is interventional and cancer-related.
Sponsor: Demo Sponsor Inc.
Participating sites: Site A, Site B, Site C.`;

type Step = "protocol" | "extracting" | "summary" | "confirmed" | "creating" | "projectCreated";

type Props = {
  onClose: () => void;
  onViewChecklist?: (projectId: string) => void;
};

export function DemoWalkthroughFlow({ onClose, onViewChecklist }: Props) {
  const [step, setStep] = useState<Step>("protocol");
  const [extractionResults, setExtractionResults] = useState<ExtractionResult[] | null>(null);
  const [createdProject, setCreatedProject] = useState<StudyProject | null>(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = useCallback(async () => {
    setError(null);
    setExtractLoading(true);
    setStep("extracting");
    try {
      const res = await loadDemoProtocol();
      setExtractionResults(res.extractionResults);
      setStep("summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed");
      setStep("protocol");
    } finally {
      setExtractLoading(false);
    }
  }, []);

  const handleConfirm = useCallback((_results: ExtractionResult[]) => {
    setStep("confirmed");
  }, []);

  const handleCreateProject = useCallback(async () => {
    setError(null);
    setCreateLoading(true);
    setStep("creating");
    try {
      const project = await loadDemoProject();
      setCreatedProject(project);
      setStep("projectCreated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create demo project failed");
      setStep("confirmed");
    } finally {
      setCreateLoading(false);
    }
  }, []);

  return (
    <div className="create-study-project-flow demo-walkthrough-flow">
      <div className="create-study-project-header">
        <h2>Try demo</h2>
        <Button type="button" variant="default" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="demo-walkthrough-intro">
        This demo walks you through: draft protocol text → extracted study attributes → study project ID → checklist.
        No LLM or file upload—sample data only.
      </p>

      {step === "protocol" && (
        <div className="protocol-upload-section">
          <h3 className="demo-step-heading">1. Sample protocol text</h3>
          <p className="protocol-upload-intro">
            Below is example protocol text. We’ll “extract” study attributes from it (pre-filled for demo).
          </p>
          <pre className="demo-protocol-preview" aria-label="Sample protocol text">
            {DEMO_PROTOCOL_PREVIEW}
          </pre>
          <div className="protocol-upload-actions">
            <Button
              type="button"
              variant="primary"
              onClick={handleExtract}
              disabled={extractLoading}
              loading={extractLoading}
            >
              Extract study attributes
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
          <p>Preparing extraction results…</p>
        </div>
      )}

      {step === "summary" && extractionResults && (
        <>
          <h3 className="demo-step-heading">2. Extracted study attributes</h3>
          <ExtractionSummaryCard
            extractionResults={extractionResults}
            protocolAssetId="demo"
            onConfirm={handleConfirm}
            confirmLoading={false}
            error={error}
          />
        </>
      )}

      {step === "confirmed" && (
        <div className="protocol-confirmed">
          <h3 className="demo-step-heading">3. Create study project</h3>
          <p>Extraction confirmed. Create the study project to get a project ID and open the checklist.</p>
          <Button
            type="button"
            variant="primary"
            onClick={handleCreateProject}
            disabled={createLoading}
            loading={createLoading}
          >
            Create study project
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
        <>
          <h3 className="demo-step-heading">4. Study project created</h3>
          <ProjectCreatedCard
            project={createdProject}
            onDone={onClose}
            onViewChecklist={onViewChecklist}
          />
        </>
      )}
    </div>
  );
}
