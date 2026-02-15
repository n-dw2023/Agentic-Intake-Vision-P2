# Agent Config

Chat-driven agentic workflows: describe a problem in natural language, get an initial workflow and UI spec, run and refine via chat. Built per [.code-captain/specs/2026-02-14-chat-driven-agentic-workflows/](.code-captain/specs/2026-02-14-chat-driven-agentic-workflows/).

## Structure

- **shared** — Workflow and UI spec schemas (Zod), validation, shared types. Used by client and server.
- **client** — Vite + React + TypeScript front-end.
- **server** — Node.js API: health; **GET /api/workflows** (list), **GET /api/workflows/:id** (get latest), **GET /api/workflows/:id/versions**, **GET /api/workflows/:id/versions/:versionId**; **POST** generate, refine, accept, run.
- **supabase/migrations** — Postgres migrations for workflows, workflow_versions, run_history.

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn with workspaces)

## Setup

```bash
npm install
```

Build the shared package (required before running client or server):

```bash
npm run build -w shared
```

## Run

- **Dev (client and server):** `npm run dev`
- **Client only:** `npm run dev:client` — front-end at http://localhost:5173 (proxies /api to server).
- **Server only:** `npm run dev:server` — API at http://localhost:3000.

## Testing the UI locally

1. **Env:** Ensure `.env` (or `.env.local`) has `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`. Sign in with a Supabase Auth user (e.g. one created via `npm run create-user` or the Dashboard) so workflows are scoped to that user.
2. **Ports:** The API must run on port 3000 (client proxies `/api` there). If 3000 is in use, stop the other process or set `PORT=3001` and update `client/vite.config.ts` proxy target to `http://localhost:3001`.
3. From the repo root run:
   ```bash
   npm run dev
   ```
4. Open the URL Vite prints (e.g. http://localhost:5173 or http://localhost:5174 if 5173 is busy).
5. In the chat panel, describe a workflow (e.g. “One document in, output an executive summary and a technical brief”) and send. After the first response, send a refinement (e.g. “Add an agent for a one-pager”), then use **Accept** to save the new version.

## Test

```bash
npm run test
```

Runs validation tests in `shared`.

## Database (Supabase)

1. **Env:** Copy `.env.example` to `.env` or `.env.local` and set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase dashboard (Settings → API).
2. **Link (one-time):** From the project root run:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
   Use the project ref from your dashboard URL (`.../project/<project-ref>`). Enter your database password when prompted.
3. **Migrations:** Apply migrations with:
   ```bash
   npm run db:migrate
   ```
   This runs `supabase db push` and creates `workflows`, `workflow_versions`, and `run_history` with RLS. Re-run after adding new files under `supabase/migrations/` to apply only new migrations.

## Environment

- **Server:** `PORT` (default 3000). **Generate endpoint** needs `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. **Auth:** All `/api/*` (except `/api/health`) require Supabase JWT; set `SUPABASE_JWT_SECRET` (Dashboard → API → JWT Secret). The client sends `Authorization: Bearer <token>` and `x-user-id` from the signed-in user; no app-level password. See [.code-captain/docs/auth-supabase.md](.code-captain/docs/auth-supabase.md).
- **Never commit** `.env` or `.env.local` — use [.code-captain/docs/github-and-secrets.md](.code-captain/docs/github-and-secrets.md) for GitHub setup and protecting API keys and secrets.
