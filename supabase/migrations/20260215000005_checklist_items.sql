-- Study Project V2: checklist_items and revealed parents (Story 3)
-- See .code-captain/specs/2026-02-15-study-project-v2/sub-specs/database-schema.md

-- Persist which parent items are expanded (reveal sub-items)
alter table public.study_projects
  add column if not exists revealed_checklist_parent_ids text[] not null default '{}';

-- Checklist item rows: one per (project, item_id) when item is started or revealed
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.study_projects (id) on delete cascade,
  item_id text not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'needs_review', 'ready_to_submit', 'complete', 'blocked')),
  artifact_id uuid null,
  intake_payload_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, item_id)
);

create index if not exists idx_checklist_items_project_id
  on public.checklist_items (project_id);

-- RLS: access via project ownership
alter table public.checklist_items enable row level security;

create policy "Users can manage checklist_items for own projects"
  on public.checklist_items for all
  using (
    exists (
      select 1 from public.study_projects sp
      where sp.id = checklist_items.project_id and sp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.study_projects sp
      where sp.id = checklist_items.project_id and sp.user_id = auth.uid()
    )
  );
