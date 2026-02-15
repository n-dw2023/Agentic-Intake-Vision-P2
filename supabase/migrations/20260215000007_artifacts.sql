-- Study Project V2: artifacts for document checklist items (Story 4)
-- See .code-captain/specs/2026-02-15-study-project-v2/sub-specs/database-schema.md

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.study_projects (id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items (id) on delete cascade,
  type text not null default 'doc',
  content text not null default '',
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_artifacts_project_id
  on public.artifacts (project_id);

create index if not exists idx_artifacts_checklist_item_id
  on public.artifacts (checklist_item_id);

-- RLS: access via project ownership
alter table public.artifacts enable row level security;

create policy "Users can manage artifacts for own projects"
  on public.artifacts for all
  using (
    exists (
      select 1 from public.study_projects sp
      where sp.id = artifacts.project_id and sp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.study_projects sp
      where sp.id = artifacts.project_id and sp.user_id = auth.uid()
    )
  );
