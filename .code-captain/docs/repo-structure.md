# Repository structure

Current layout of the Agent-Config monorepo (excluding `node_modules`, build output, and `.git`).

```
Agent-Config/
├── .code-captain/
│   ├── docs/
│   │   ├── auth-supabase.md
│   │   ├── development-conventions.md
│   │   ├── github-and-secrets.md
│   │   ├── repo-structure.md          # this file
│   │   └── vercel-deploy.md
│   └── specs/
│       ├── 2026-02-14-chat-driven-agentic-workflows/
│       │   ├── sub-specs/             # api, database, technical, ui
│       │   ├── user-stories/          # story-1..6
│       │   ├── spec.md, spec-lite.md
│       ├── 2026-02-14-ui-ux-refresh/
│       │   ├── sub-specs/, user-stories/
│       │   ├── spec.md, spec-lite.md
│       ├── 2026-02-15-password-protect-entry/
│       │   ├── sub-specs/, user-stories/
│       │   ├── spec.md, spec-lite.md
│       └── 2026-02-15-study-project-v2/
│           ├── sub-specs/, user-stories/
│           ├── spec.md, spec-lite.md
│
├── .githooks/
│   └── pre-commit
├── .vscode/
│   └── settings.json
│
├── api/                                # Vercel serverless (catch-all)
│   ├── [[...path]].ts                  # catch-all: /api and /api/* → Express (server-dist)
│   └── server-dist.d.ts                # type declaration for server-dist (optional)
│
├── client/                             # Vite + React front-end
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api.ts                     # API client (Bearer + x-user-id)
│   │   ├── index.css
│   │   ├── workflowRun.ts
│   │   ├── vite-env.d.ts
│   │   ├── components/
│   │   │   ├── ui/                    # button, dialog, input, select, toast, etc.
│   │   │   ├── EntryGate.tsx
│   │   │   ├── ChecklistPanel.tsx, CommandPalette.tsx
│   │   │   ├── CreateStudyProjectFlow.tsx, DemoWalkthroughFlow.tsx
│   │   │   ├── DocumentWorkspace.tsx, IntakeWorkspace.tsx
│   │   │   ├── AgentPromptsPage.tsx, InlineError.tsx
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── AuthContext.tsx        # Supabase sign-in / session
│   │   └── lib/
│   │       ├── supabase.ts
│   │       └── utils.ts
│   ├── tsconfig.app.json, tsconfig.json
│   ├── vite.config.ts
│   └── vitest.config.ts
│
├── server/                             # Express API (Node)
│   ├── package.json
│   ├── src/
│   │   ├── index.ts                   # Express app (routes, auth middleware)
│   │   ├── start.ts                   # local dev: app.listen(PORT)
│   │   ├── env.ts
│   │   ├── supabase.ts
│   │   ├── agentPrompts.ts
│   │   ├── artifactGenerator.ts, checklistEngine.ts, checklistRules.ts
│   │   ├── demoData.ts, extractProtocol.ts, parseProtocol.ts
│   │   ├── generateWorkflow.ts, refineWorkflow.ts, runWorkflow.ts
│   │   ├── intakeFieldMap.ts, intakeSchema.ts
│   │   ├── middleware/
│   │   │   └── requireSupabaseAuth.ts
│   │   └── routes/
│   │       ├── workflows.ts
│   │       ├── protocols.ts
│   │       ├── studyProjects.ts
│   │       └── prompts.ts
│   ├── scripts/
│   │   ├── create-user.ts
│   │   └── set-auth-password.ts
│   ├── supabase-migrations/           # ad-hoc SQL (not Supabase CLI)
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── shared/                             # Shared types/schemas (Zod)
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── workflow-schema.ts
│   │   ├── ui-spec-schema.ts
│   │   ├── extraction-schema.ts
│   │   ├── validation.ts
│   │   └── validation.test.ts
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── supabase/
│   ├── config.toml
│   ├── .temp/                          # CLI state (gitignored in practice)
│   └── migrations/                    # Postgres migrations (order by prefix)
│       ├── 20260214000001_workflows_and_versions.sql
│       ├── 20260214000002_run_history.sql
│       ├── 20260215000003_study_project_protocol_assets.sql
│       ├── 20260215000004_study_projects_and_audit.sql
│       ├── 20260215000005_checklist_items.sql
│       ├── 20260215000006_checklist_items_not_needed.sql
│       ├── 20260215000007_artifacts.sql
│       └── 20260215000008_intake_payloads.sql
│
├── .env.example
├── .gitignore
├── package.json                        # Workspace root (client, server, shared)
├── package-lock.json
├── README.md
├── tsconfig.base.json
└── vercel.json                         # Build, output dir, rewrites for /api
```

## Build output (not committed)

- **`dist/`** — Root static output (copy of `client/dist`) for Vercel.
- **`client/dist/`** — Vite build output (SPA).
- **`server/dist/`** — Compiled Express app (Node).
- **`shared/dist/`** — Compiled shared package.
- **`api/server-dist/`** — Copy of `server/dist` used by the API catch-all on Vercel (created by `build:vercel-api`).

## Env files (not committed)

- **`.env`**, **`.env.local`** — Local secrets (Supabase, OpenAI, etc.). See `.env.example` and `.code-captain/docs/github-and-secrets.md`.
