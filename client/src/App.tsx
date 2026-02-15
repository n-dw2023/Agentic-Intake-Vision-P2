import { useState, useCallback, useEffect, useRef } from "react";
import {
  listWorkflows,
  listStudyProjects,
  deleteStudyProject,
  getWorkflow,
  listVersions,
  runWorkflow,
  updateWorkflowName,
  deleteWorkflow,
  type WorkflowDefinition,
  type UiSpec,
  type StudyProjectListItem,
} from "./api";
import { DynamicForm, isFormValid, type FormValues } from "./DynamicForm";
import { ResultsArea } from "./ResultsArea";
import { getDocumentText } from "./workflowRun";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/CommandPalette";
import { InlineError } from "@/components/InlineError";
import { CreateStudyProjectFlow } from "@/components/CreateStudyProjectFlow";
import { DemoWalkthroughFlow } from "@/components/DemoWalkthroughFlow";
import { ChecklistPanel } from "@/components/ChecklistPanel";
import { DocumentWorkspace } from "@/components/DocumentWorkspace";
import { IntakeWorkspace } from "@/components/IntakeWorkspace";
import { AgentPromptsPage } from "@/components/AgentPromptsPage";
import { useAuth } from "@/context/AuthContext";

const initialFormValues: FormValues = {};

const THEME_STORAGE_KEY = "agent-config-theme";
type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

type WorkflowListItem = { id: string; name: string; createdAt: string; updatedAt: string };
type VersionItem = { id: string; createdAt: string };

function App() {
  const { logout } = useAuth();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [uiSpec, setUiSpec] = useState<UiSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [failedLoadId, setFailedLoadId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [runResults, setRunResults] = useState<{ agentId: string; outputLabel: string; content: string }[] | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runErrorDetails, setRunErrorDetails] = useState<string | null>(null);
  const [showAgentPrompts, setShowAgentPrompts] = useState(false);
  const [workflowList, setWorkflowList] = useState<WorkflowListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [studyProjectList, setStudyProjectList] = useState<StudyProjectListItem[]>([]);
  const [studyProjectListLoading, setStudyProjectListLoading] = useState(true);
  const [showList, setShowList] = useState(true);
  const [showWorkflowList, setShowWorkflowList] = useState(false);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [workflowName, setWorkflowName] = useState<string>("");
  const [nameSaving, setNameSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showStudyProjectCreate, setShowStudyProjectCreate] = useState(false);
  const [showDemoWalkthrough, setShowDemoWalkthrough] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [documentWorkspace, setDocumentWorkspace] = useState<{ itemId: string; itemLabel: string } | null>(null);
  const [intakeWorkspace, setIntakeWorkspace] = useState<{ itemId: string; itemLabel: string } | null>(null);
  const [checklistKey, setChecklistKey] = useState(0);
  const [showAgentPromptsPage, setShowAgentPromptsPage] = useState(false);
  const workflowNameInputRef = useRef<HTMLInputElement>(null);

  const refreshList = useCallback(() => {
    setListLoading(true);
    listWorkflows()
      .then((r) => setWorkflowList(r.workflows))
      .catch(() => setWorkflowList([]))
      .finally(() => setListLoading(false));
  }, []);

  const refreshStudyProjectList = useCallback(() => {
    setStudyProjectListLoading(true);
    listStudyProjects()
      .then((r) => setStudyProjectList(r.projects))
      .catch(() => setStudyProjectList([]))
      .finally(() => setStudyProjectListLoading(false));
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    refreshStudyProjectList();
  }, [refreshStudyProjectList]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const loadWorkflow = useCallback(async (id: string, vid?: string) => {
    setError(null);
    setErrorDetails(null);
    setFailedLoadId(null);
    try {
      const wf = await getWorkflow(id, vid);
      setWorkflowId(wf.id);
      setVersionId(wf.versionId);
      setWorkflow(wf.workflow);
      setUiSpec(wf.uiSpec);
      setWorkflowName(wf.name ?? "Untitled workflow");
      setFormValues(initialFormValues);
      setRunResults(null);
      setRunError(null);
      setRunErrorDetails(null);
      setShowList(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflow");
      setErrorDetails(err instanceof Error ? err.stack ?? String(err) : String(err));
      setFailedLoadId(id);
    }
  }, []);

  useEffect(() => {
    if (!workflowId) return;
    setVersionsLoading(true);
    listVersions(workflowId)
      .then((r) => setVersions(r.versions))
      .catch(() => setVersions([]))
      .finally(() => setVersionsLoading(false));
  }, [workflowId]);

  const handleVersionChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const vid = e.target.value;
      if (!workflowId || !vid) return;
      await loadWorkflow(workflowId, vid);
    },
    [workflowId, loadWorkflow]
  );

  const handleRename = useCallback(
    async (newName: string) => {
      if (!workflowId || nameSaving) return;
      const trimmed = newName.trim() || "Untitled workflow";
      setNameSaving(true);
      setError(null);
      try {
        await updateWorkflowName(workflowId, trimmed);
        setWorkflowName(trimmed);
        refreshList();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to rename");
        setErrorDetails(err instanceof Error ? err.stack ?? String(err) : String(err));
      } finally {
        setNameSaving(false);
      }
    },
    [workflowId, nameSaving, refreshList]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this workflow? This cannot be undone.")) return;
      setDeletingId(id);
      setError(null);
      try {
        await deleteWorkflow(id);
        if (workflowId === id) {
          setWorkflowId(null);
          setVersionId(null);
          setWorkflow(null);
          setUiSpec(null);
          setWorkflowName("");
          setShowList(true);
        }
        refreshList();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
        setErrorDetails(err instanceof Error ? err.stack ?? String(err) : String(err));
      } finally {
        setDeletingId(null);
      }
    },
    [workflowId, refreshList]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      setDeletingProjectId(projectId);
      setError(null);
      try {
        await deleteStudyProject(projectId);
        if (selectedProjectId === projectId) setSelectedProjectId(null);
        refreshStudyProjectList();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete study project");
      } finally {
        setDeletingProjectId(null);
      }
    },
    [selectedProjectId, refreshStudyProjectList]
  );

  const handleNewWorkflow = useCallback(() => {
    setWorkflowId(null);
    setVersionId(null);
    setWorkflow(null);
    setUiSpec(null);
    setWorkflowName("");
    setFormValues(initialFormValues);
    setRunResults(null);
    setRunError(null);
    setShowList(false);
  }, []);


  const handleRun = useCallback(async () => {
    if (!workflowId || !versionId || !uiSpec) return;
    setRunError(null);
    setRunErrorDetails(null);
    setRunLoading(true);
    try {
      const documentText = await getDocumentText(uiSpec, formValues);
      if (documentText == null || documentText.trim() === "") {
        setRunError("Please provide a document (upload a file or enter text).");
        return;
      }
      const { results } = await runWorkflow(workflowId, versionId, documentText);
      setRunResults(results);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Run failed");
      setRunErrorDetails(err instanceof Error ? err.stack ?? String(err) : String(err));
      setRunResults(null);
    } finally {
      setRunLoading(false);
    }
  }, [workflowId, versionId, uiSpec, formValues]);

  const canRun = workflowId && versionId && uiSpec && isFormValid(uiSpec, formValues) && !runLoading;

  return (
    <div className="app">
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        workflows={workflowList}
        workflowOpen={!!workflowId}
        canRun={!!canRun}
        onNewWorkflow={handleNewWorkflow}
        onMyWorkflows={() => {
          refreshList();
          setShowList(true);
          setShowWorkflowList(true);
        }}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        onOpenWorkflow={loadWorkflow}
        onRun={handleRun}
        onToggleAgentPrompts={() => setShowAgentPrompts((v) => !v)}
        onCreateStudyProject={() => setShowStudyProjectCreate(true)}
        onTryDemo={() => setShowDemoWalkthrough(true)}
        onOpenAgentPromptsPage={() => setShowAgentPromptsPage(true)}
      />
      <header className="app-header">
        <h1>Agent Config</h1>
        <div className="app-header-actions">
          {workflow && !showList && (
            <button
              type="button"
              className="header-link"
              onClick={() => {
                refreshList();
                setShowList(true);
              }}
            >
              My workflows
            </button>
          )}
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            className="header-link"
            onClick={() => logout()}
          >
            Log out
          </button>
        </div>
      </header>
      <div className="app-layout">
        <main className="app-main">
          {selectedProjectId ? (
            documentWorkspace ? (
              <DocumentWorkspace
                projectId={selectedProjectId}
                itemId={documentWorkspace.itemId}
                itemLabel={documentWorkspace.itemLabel}
                onClose={() => {
                  setDocumentWorkspace(null);
                  setChecklistKey((k) => k + 1);
                }}
                onStatusUpdated={() => setChecklistKey((k) => k + 1)}
              />
            ) : intakeWorkspace ? (
              <IntakeWorkspace
                projectId={selectedProjectId}
                itemId={intakeWorkspace.itemId}
                itemLabel={intakeWorkspace.itemLabel}
                onClose={() => {
                  setIntakeWorkspace(null);
                  setChecklistKey((k) => k + 1);
                }}
                onStatusUpdated={() => setChecklistKey((k) => k + 1)}
              />
            ) : (
              <ChecklistPanel
                key={checklistKey}
                projectId={selectedProjectId}
                onClose={() => {
                  setSelectedProjectId(null);
                  refreshStudyProjectList();
                }}
                onOpenItem={(itemId, type, itemLabel) => {
                  if (type === "document" && itemLabel) setDocumentWorkspace({ itemId, itemLabel });
                  if (type === "intake" && itemLabel) setIntakeWorkspace({ itemId, itemLabel });
                }}
              />
            )
          ) : showAgentPromptsPage ? (
            <AgentPromptsPage onClose={() => setShowAgentPromptsPage(false)} />
          ) : showDemoWalkthrough ? (
            <DemoWalkthroughFlow
              onClose={() => setShowDemoWalkthrough(false)}
              onViewChecklist={(projectId) => {
                setShowDemoWalkthrough(false);
                setSelectedProjectId(projectId);
                refreshStudyProjectList();
              }}
            />
          ) : showStudyProjectCreate ? (
            <CreateStudyProjectFlow
              onClose={() => {
                setShowStudyProjectCreate(false);
                refreshStudyProjectList();
              }}
              onViewChecklist={(projectId) => {
                setShowStudyProjectCreate(false);
                setSelectedProjectId(projectId);
                refreshStudyProjectList();
              }}
            />
          ) : showList ? (
            showWorkflowList ? (
              <div className="workflow-list-view">
                <h2>My workflows</h2>
                <button
                  type="button"
                  className="header-link"
                  onClick={() => setShowWorkflowList(false)}
                  style={{ marginBottom: "var(--spacing-2)" }}
                >
                  ← My Study Projects
                </button>
                {listLoading ? (
                  <p className="list-muted">Loading…</p>
                ) : workflowList.length === 0 ? (
                  <p className="list-muted">No workflows yet.</p>
                ) : (
                  <ul className="workflow-list" role="list">
                    {workflowList.map((w) => (
                      <li key={w.id} className="workflow-list-row">
                        <button
                          type="button"
                          className="workflow-list-item"
                          onClick={() => loadWorkflow(w.id)}
                        >
                          <span className="workflow-list-name">{w.name}</span>
                          <span className="workflow-list-meta">
                            {new Date(w.createdAt).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </button>
                        <div className="workflow-list-actions">
                          <Button
                            type="button"
                            variant="default"
                            className="workflow-list-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(w.id);
                            }}
                            disabled={deletingId === w.id}
                            aria-label={`Delete ${w.name}`}
                            title="Delete workflow"
                          >
                            {deletingId === w.id ? "…" : "Delete"}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="workflow-home-buttons">
                  <Button type="button" variant="primary" onClick={handleNewWorkflow} className="workflow-new-btn">
                    New workflow
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowDemoWalkthrough(true)}
                    className="workflow-new-btn"
                    title="Walk through a sample workflow: protocol → extraction → study project → checklist (no LLM)"
                  >
                    Try demo
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowAgentPromptsPage(true)}
                    className="workflow-new-btn"
                    title="View and edit generation agent prompts (Lab Manual, Consent Form, etc.)"
                  >
                    Agent prompts
                  </Button>
                </div>
              </div>
            ) : (
              <div className="workflow-list-view study-project-list-view">
                <div className="workflow-home-buttons">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setShowStudyProjectCreate(true)}
                    className="workflow-new-btn"
                  >
                    Create Study Project
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowDemoWalkthrough(true)}
                    className="workflow-new-btn"
                    title="Walk through a sample workflow: protocol → extraction → study project → checklist (no LLM)"
                  >
                    Try demo
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowAgentPromptsPage(true)}
                    className="workflow-new-btn"
                    title="View and edit generation agent prompts (Lab Manual, Consent Form, etc.)"
                  >
                    Agent prompts
                  </Button>
                </div>
                <h2>My Study Projects</h2>
                {studyProjectListLoading ? (
                  <p className="list-muted">Loading…</p>
                ) : studyProjectList.length === 0 ? (
                  <p className="list-muted">No study projects yet. Create one to get started.</p>
                ) : (
                  <ul className="workflow-list" role="list">
                    {studyProjectList.map((p) => (
                      <li key={p.id} className="workflow-list-row">
                        <button
                          type="button"
                          className="workflow-list-item"
                          onClick={() => setSelectedProjectId(p.id)}
                        >
                          <span className="workflow-list-name">{p.title}</span>
                          <span className="workflow-list-meta">
                            {p.id} · {new Date(p.createdAt).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </button>
                        <div className="workflow-list-actions">
                          <Button
                            type="button"
                            variant="default"
                            className="workflow-list-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(p.id);
                            }}
                            disabled={deletingProjectId === p.id}
                            aria-label={`Delete ${p.title}`}
                            title="Delete study project"
                          >
                            {deletingProjectId === p.id ? "…" : "Delete"}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          ) : workflow && uiSpec ? (
            <>
              <div className="workflow-summary">
                <div className="workflow-name-row">
                  <label htmlFor="workflow-name-input" className="visually-hidden">
                    Workflow name
                  </label>
                  <input
                    ref={workflowNameInputRef}
                    id="workflow-name-input"
                    type="text"
                    className="workflow-name-input"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRename((e.target as HTMLInputElement).value);
                      }
                    }}
                    disabled={nameSaving}
                    aria-label="Workflow name"
                  />
                  <button
                    type="button"
                    className="workflow-save-name-button"
                    onClick={() => {
                      const value = workflowNameInputRef.current?.value;
                      if (value !== undefined) handleRename(value);
                    }}
                    disabled={nameSaving}
                    aria-label="Save workflow name"
                  >
                    {nameSaving ? "Saving…" : "Save name"}
                  </button>
                  <button
                    type="button"
                    className="workflow-delete-button"
                    onClick={() => workflowId && handleDelete(workflowId)}
                    disabled={deletingId === workflowId}
                    aria-label="Delete workflow"
                    title="Delete workflow"
                  >
                    {deletingId === workflowId ? "…" : "Delete"}
                  </button>
                </div>
                <h2>Workflow</h2>
                <p>{workflow.agents.length} agent(s): {workflow.agents.map((a) => a.name).join(", ")}</p>
                <div className="workflow-meta-row">
                  <span>Version {versionId?.slice(0, 8) ?? "—"}</span>
                  {versions.length > 1 && (
                    <select
                      className="version-select"
                      value={versionId ?? ""}
                      onChange={handleVersionChange}
                      disabled={versionsLoading}
                      aria-label="Select version"
                    >
                      {versions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.id.slice(0, 8)} — {new Date(v.createdAt).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <button
                  type="button"
                  className="workflow-prompts-toggle"
                  onClick={() => setShowAgentPrompts((v) => !v)}
                  aria-expanded={showAgentPrompts}
                >
                  {showAgentPrompts ? "Hide agent prompts" : "View agent prompts"}
                </button>
                {showAgentPrompts && (
                  <div className="workflow-prompts" role="region" aria-label="Agent prompts">
                    {workflow.agents.map((agent) => (
                      <div key={agent.id} className="workflow-prompt-block">
                        <div className="workflow-prompt-name">{agent.name}</div>
                        <pre className="workflow-prompt-text">{agent.systemPrompt}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="workflow-form-section">
                <h3 className="form-section-heading">Input</h3>
                <DynamicForm
                  uiSpec={uiSpec}
                  values={formValues}
                  onChange={setFormValues}
                  disabled={runLoading}
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleRun}
                  disabled={!canRun}
                  loading={runLoading}
                  className="run-button"
                >
                  Run
                </Button>
              </div>
              <ResultsArea
                uiSpec={uiSpec}
                results={runResults}
                loading={runLoading}
                error={runError}
                errorDetails={runErrorDetails}
                onRetry={handleRun}
              />
            </>
          ) : (
            <div className="workflow-empty">
              <p>Create a study project or open a workflow to get started.</p>
              <div className="workflow-home-buttons">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowStudyProjectCreate(true)}
                  className="workflow-new-btn"
                >
                  Create Study Project
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setShowDemoWalkthrough(true)}
                  className="workflow-new-btn"
                  title="Walk through a sample workflow: protocol → extraction → study project → checklist (no LLM)"
                >
                  Try demo
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setShowAgentPromptsPage(true)}
                  className="workflow-new-btn"
                  title="View and edit generation agent prompts"
                >
                  Agent prompts
                </Button>
              </div>
            </div>
          )}
          {error && (
            <div className="app-error">
              <InlineError
                message={error}
                details={errorDetails}
                onRetry={failedLoadId ? () => loadWorkflow(failedLoadId) : undefined}
                onDismiss={() => {
                  setError(null);
                  setErrorDetails(null);
                  setFailedLoadId(null);
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
