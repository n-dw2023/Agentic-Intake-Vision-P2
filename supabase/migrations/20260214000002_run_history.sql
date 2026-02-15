-- Optional run history for v1 (can be used in Story 4)
-- See .code-captain/specs/.../sub-specs/database-schema.md

create table if not exists public.run_history (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  workflow_version_id uuid not null references public.workflow_versions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('success', 'partial', 'failed')),
  results jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_run_history_workflow_id
  on public.run_history (workflow_id);

create index if not exists idx_run_history_user_id
  on public.run_history (user_id);

alter table public.run_history enable row level security;

create policy "Users can view own run history"
  on public.run_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
