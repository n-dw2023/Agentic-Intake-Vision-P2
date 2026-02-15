-- Chat-Driven Agentic Workflows: workflows and workflow_versions
-- See .code-captain/specs/.../sub-specs/database-schema.md

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  workflow_definition jsonb not null,
  ui_spec jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_workflow_versions_workflow_created
  on public.workflow_versions (workflow_id, created_at desc);

create index if not exists idx_workflows_user_id
  on public.workflows (user_id);

-- RLS
alter table public.workflows enable row level security;
alter table public.workflow_versions enable row level security;

create policy "Users can manage own workflows"
  on public.workflows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage versions of own workflows"
  on public.workflow_versions for all
  using (
    exists (
      select 1 from public.workflows w
      where w.id = workflow_versions.workflow_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workflows w
      where w.id = workflow_versions.workflow_id and w.user_id = auth.uid()
    )
  );
