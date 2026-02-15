import { useEffect } from "react";
import { Command } from "cmdk";

export type WorkflowItem = { id: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflows: WorkflowItem[];
  workflowOpen: boolean;
  canRun: boolean;
  onNewWorkflow: () => void;
  onMyWorkflows: () => void;
  onToggleTheme: () => void;
  onOpenWorkflow: (id: string) => void;
  onRun: () => void;
  onToggleAgentPrompts: () => void;
  onCreateStudyProject: () => void;
  onTryDemo: () => void;
  onOpenAgentPromptsPage?: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  workflows,
  workflowOpen,
  canRun,
  onNewWorkflow,
  onMyWorkflows,
  onToggleTheme,
  onOpenWorkflow,
  onRun,
  onToggleAgentPrompts,
  onCreateStudyProject,
  onTryDemo,
  onOpenAgentPromptsPage,
}: Props) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (e.key === "/") {
        if (inInput) return;
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const runAndClose = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      className="command-palette"
    >
      <Command.Input placeholder="Search commands or workflows…" className="command-palette-input" />
      <Command.List className="command-palette-list">
        <Command.Empty className="command-palette-empty">No results found.</Command.Empty>
        <Command.Group heading="Actions" className="command-palette-group">
          <Command.Item
            value="new workflow"
            onSelect={() => runAndClose(onNewWorkflow)}
            className="command-palette-item"
          >
            New workflow
          </Command.Item>
          <Command.Item
            value="my workflows"
            onSelect={() => runAndClose(onMyWorkflows)}
            className="command-palette-item"
          >
            My workflows
          </Command.Item>
          <Command.Item
            value="create study project"
            keywords={["study", "project", "protocol"]}
            onSelect={() => runAndClose(onCreateStudyProject)}
            className="command-palette-item"
          >
            Create Study Project
          </Command.Item>
          <Command.Item
            value="try demo"
            keywords={["demo", "sample", "walkthrough"]}
            onSelect={() => runAndClose(onTryDemo)}
            className="command-palette-item"
          >
            Try demo
          </Command.Item>
          {onOpenAgentPromptsPage && (
            <Command.Item
              value="agent prompts"
              keywords={["prompts", "generation", "draft", "lab", "consent"]}
              onSelect={() => runAndClose(onOpenAgentPromptsPage)}
              className="command-palette-item"
            >
              Agent prompts
            </Command.Item>
          )}
          <Command.Item
            value="toggle light dark theme"
            keywords={["theme", "dark", "light"]}
            onSelect={() => runAndClose(onToggleTheme)}
            className="command-palette-item"
          >
            Toggle light/dark
          </Command.Item>
        </Command.Group>
        {workflowOpen && (
          <Command.Group heading="Workflow" className="command-palette-group">
            {canRun && (
              <Command.Item
                value="run workflow"
                onSelect={() => runAndClose(onRun)}
                className="command-palette-item"
              >
                Run workflow
              </Command.Item>
            )}
            <Command.Item
              value="view agent prompts"
              keywords={["prompts", "agents"]}
              onSelect={() => runAndClose(onToggleAgentPrompts)}
              className="command-palette-item"
            >
              View agent prompts
            </Command.Item>
          </Command.Group>
        )}
        {workflows.length > 0 && (
          <Command.Group heading="Open workflow" className="command-palette-group">
            {workflows.map((w) => (
              <Command.Item
                key={w.id}
                value={`${w.name} ${w.id}`}
                keywords={[w.name, w.id]}
                onSelect={() => runAndClose(() => onOpenWorkflow(w.id))}
                className="command-palette-item"
              >
                {w.name}
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
