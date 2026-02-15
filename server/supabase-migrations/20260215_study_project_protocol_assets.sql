-- Study Project V2: protocol_assets and extraction_results (Story 1)
-- Run this in Supabase SQL editor or via supabase db push if using Supabase CLI.

-- protocol_assets: store ingested protocol (PDF/DOCX/text) with normalized text for extraction
CREATE TABLE IF NOT EXISTS protocol_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  blob_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protocol_assets_user_id ON protocol_assets(user_id);

-- extraction_results: per-field extraction with citations and provenance
CREATE TABLE IF NOT EXISTS extraction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_asset_id UUID NOT NULL REFERENCES protocol_assets(id) ON DELETE CASCADE,
  study_project_id UUID,
  field_name TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  citations JSONB NOT NULL DEFAULT '[]',
  provenance TEXT NOT NULL DEFAULT 'extracted' CHECK (provenance IN ('extracted', 'inferred', 'user-provided')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extraction_results_protocol_asset_id ON extraction_results(protocol_asset_id);
CREATE INDEX IF NOT EXISTS idx_extraction_results_study_project_id ON extraction_results(study_project_id);

-- RLS: user can only access own protocol_assets
ALTER TABLE protocol_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY protocol_assets_user_policy ON protocol_assets
  FOR ALL USING (auth.uid() = user_id);

-- extraction_results: access via protocol_asset or study_project ownership (study_projects not created yet; add policy when table exists)
ALTER TABLE extraction_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY extraction_results_via_protocol ON extraction_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM protocol_assets pa WHERE pa.id = extraction_results.protocol_asset_id AND pa.user_id = auth.uid())
  );
