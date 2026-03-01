-- Initial schema: enums, tables, indexes, and RLS enablement.
-- Mirrors packages/shared/src/db/schema.ts exactly.

-- ── Enums ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE composition_mode AS ENUM ('merge', 'overlay', 'sequential');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lifecycle_stage AS ENUM ('concept', 'draft', 'revision', 'final', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE publishing_mode AS ENUM ('text', 'graphic-novel');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM ('portrait', 'cover', 'scene', 'style-board', 'chapter-header', 'panel');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE draft_status AS ENUM ('pending', 'accepted', 'rejected', 'editing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Projects ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  author_name text,
  genre text,
  created_at timestamptz NOT NULL DEFAULT now(),
  modified_at timestamptz NOT NULL DEFAULT now(),
  version text DEFAULT '1.0.0',
  grammar_version text DEFAULT '2.0.0',
  grammar_fingerprint text,
  composition_mode composition_mode NOT NULL DEFAULT 'merge',
  lifecycle_stage lifecycle_stage NOT NULL DEFAULT 'concept',
  publishing_mode publishing_mode NOT NULL DEFAULT 'text'
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ── Source Files ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.source_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  content text NOT NULL DEFAULT '',
  is_entry boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  modified_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS source_files_project_path_idx ON public.source_files (project_id, file_path);

ALTER TABLE public.source_files ENABLE ROW LEVEL SECURITY;

-- ── Snapshots ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag text NOT NULL,
  stage lifecycle_stage NOT NULL,
  word_count integer DEFAULT 0,
  scene_count integer DEFAULT 0,
  character_count integer DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snapshots_project_id_idx ON public.snapshots (project_id);

ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

-- ── Snapshot Files ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.snapshot_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.snapshots(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  content text NOT NULL
);

ALTER TABLE public.snapshot_files ENABLE ROW LEVEL SECURITY;

-- ── Assets ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type asset_type NOT NULL,
  name text NOT NULL,
  status asset_status NOT NULL DEFAULT 'pending',
  prompt text,
  backend text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assets_project_id_idx ON public.assets (project_id);
CREATE INDEX IF NOT EXISTS assets_type_idx ON public.assets (type);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- ── Analytics Snapshots ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  word_count integer DEFAULT 0,
  scene_count integer DEFAULT 0,
  character_count integer DEFAULT 0,
  metrics jsonb DEFAULT '{}',
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_project_id_idx ON public.analytics_snapshots (project_id);

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- ── Draft Versions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.draft_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_name text NOT NULL,
  paragraph_index integer NOT NULL,
  content text NOT NULL,
  status draft_status NOT NULL DEFAULT 'pending',
  backend text,
  model text,
  temperature real,
  token_count integer,
  cost_usd real,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drafts_project_scene_idx ON public.draft_versions (project_id, scene_name);

ALTER TABLE public.draft_versions ENABLE ROW LEVEL SECURITY;
