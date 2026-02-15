-- Story 5: intake_payloads for intake workspace submit
-- One row per (project_id, item_id); payload stores field map as JSONB.

create table if not exists public.intake_payloads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.study_projects (id) on delete cascade,
  item_id text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, item_id)
);

create index if not exists idx_intake_payloads_project_id
  on public.intake_payloads (project_id);

alter table public.intake_payloads enable row level security;

create policy "Users can manage intake_payloads for own projects"
  on public.intake_payloads for all
  using (
    exists (
      select 1 from public.study_projects sp
      where sp.id = intake_payloads.project_id and sp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.study_projects sp
      where sp.id = intake_payloads.project_id and sp.user_id = auth.uid()
    )
  );
