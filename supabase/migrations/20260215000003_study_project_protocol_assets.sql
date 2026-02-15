-- Study Project V2: protocol_assets and extraction_results (Story 1)
-- See .code-captain/specs/2026-02-15-study-project-v2/sub-specs/database-schema.md

create table if not exists public.protocol_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_type text not null,
  normalized_text text not null,
  metadata jsonb default '{}',
  blob_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_protocol_assets_user_id
  on public.protocol_assets (user_id);

create table if not exists public.extraction_results (
  id uuid primary key default gen_random_uuid(),
  protocol_asset_id uuid not null references public.protocol_assets (id) on delete cascade,
  study_project_id uuid,
  field_name text not null,
  value jsonb not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  citations jsonb not null default '[]',
  provenance text not null default 'extracted' check (provenance in ('extracted', 'inferred', 'user-provided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_extraction_results_protocol_asset_id
  on public.extraction_results (protocol_asset_id);
create index if not exists idx_extraction_results_study_project_id
  on public.extraction_results (study_project_id);

alter table public.protocol_assets enable row level security;
create policy "Users can manage own protocol_assets"
  on public.protocol_assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.extraction_results enable row level security;
create policy "Users can manage extraction_results via protocol_assets"
  on public.extraction_results for all
  using (
    exists (
      select 1 from public.protocol_assets pa
      where pa.id = extraction_results.protocol_asset_id and pa.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.protocol_assets pa
      where pa.id = extraction_results.protocol_asset_id and pa.user_id = auth.uid()
    )
  );
