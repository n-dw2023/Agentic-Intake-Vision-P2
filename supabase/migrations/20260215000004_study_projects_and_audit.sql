-- Study Project V2: study_projects, ID sequence, link extraction_results, audit_log (Story 2)
-- See .code-captain/specs/2026-02-15-study-project-v2/sub-specs/database-schema.md

-- Sequence per year for YYYY-###### IDs
create table if not exists public.study_project_sequences (
  year integer primary key,
  next_value integer not null default 1
);

-- Atomic ID generation: returns next YYYY-###### for current year
create or replace function public.generate_study_project_id()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y int;
  n int;
  new_id text;
begin
  y := date_part('year', current_date)::int;
  insert into public.study_project_sequences (year, next_value)
  values (y, 1)
  on conflict (year) do update set next_value = study_project_sequences.next_value + 1
  returning year, next_value into y, n;
  new_id := y::text || '-' || lpad(n::text, 6, '0');
  return new_id;
end;
$$;

-- Study projects: id is text YYYY-###### (e.g. 2026-000001)
create table if not exists public.study_projects (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  sponsor text not null,
  interventional boolean not null,
  cancer_related boolean not null,
  participating_orgs jsonb not null default '[]',
  protocol_asset_id uuid not null references public.protocol_assets (id) on delete restrict,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_study_projects_user_id
  on public.study_projects (user_id);
create index if not exists idx_study_projects_protocol_asset_id
  on public.study_projects (protocol_asset_id);

-- Link extraction_results to study project (change from uuid to text FK)
alter table public.extraction_results
  drop column if exists study_project_id;
alter table public.extraction_results
  add column study_project_id text references public.study_projects (id) on delete set null;

create index if not exists idx_extraction_results_study_project_id
  on public.extraction_results (study_project_id);

-- Audit log for audit-lite (Story 6)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  project_id text references public.study_projects (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_project_id
  on public.audit_log (project_id);
create index if not exists idx_audit_log_user_id
  on public.audit_log (user_id);
create index if not exists idx_audit_log_created_at
  on public.audit_log (created_at desc);

-- RLS
alter table public.study_projects enable row level security;
create policy "Users can manage own study_projects"
  on public.study_projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.audit_log enable row level security;
create policy "Users can view own audit_log"
  on public.audit_log for select
  using (auth.uid() = user_id);
create policy "Users can insert own audit_log"
  on public.audit_log for insert
  with check (auth.uid() = user_id);
