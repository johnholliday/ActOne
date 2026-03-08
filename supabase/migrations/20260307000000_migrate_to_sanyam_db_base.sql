-- Migration: Align ActOne with sanyam-db 0.9.0 base tables
--
-- This migration:
-- 1. Renames projects columns to match sanyam-db base table (title→name, modified_at→updated_at, lifecycle_stage→lifecycle_phase)
-- 2. Creates actone_project_ext 1:1 extension table with domain-specific columns
-- 3. Renames source_files→project_files and updates columns
-- 4. Drops old enums that are no longer used by the schema

BEGIN;

-- ── Step 1: Rename projects columns to match sanyam-db ────────────

ALTER TABLE projects RENAME COLUMN title TO name;
ALTER TABLE projects RENAME COLUMN modified_at TO updated_at;

-- Convert lifecycle_stage enum to text, then rename
-- Must drop default first since it references the enum type
ALTER TABLE projects ALTER COLUMN lifecycle_stage DROP DEFAULT;
ALTER TABLE projects ALTER COLUMN lifecycle_stage TYPE text USING lifecycle_stage::text;
ALTER TABLE projects ALTER COLUMN lifecycle_stage SET DEFAULT 'draft';
ALTER TABLE projects RENAME COLUMN lifecycle_stage TO lifecycle_phase;

-- Add sanyam-db base columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;

-- ── Step 2: Create actone_project_ext extension table ─────────────

CREATE TABLE IF NOT EXISTS actone_project_ext (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    author_name TEXT,
    genre TEXT,
    composition_mode TEXT NOT NULL DEFAULT 'merge',
    publishing_mode TEXT NOT NULL DEFAULT 'text'
);

-- Populate extension table from existing projects columns
INSERT INTO actone_project_ext (project_id, author_name, genre, composition_mode, publishing_mode)
SELECT
    id,
    author_name,
    genre,
    composition_mode::text,
    publishing_mode::text
FROM projects;

-- Drop migrated columns from projects (drop defaults first to release enum type dependencies)
ALTER TABLE projects ALTER COLUMN composition_mode DROP DEFAULT;
ALTER TABLE projects ALTER COLUMN publishing_mode DROP DEFAULT;
ALTER TABLE projects DROP COLUMN author_name;
ALTER TABLE projects DROP COLUMN genre;
ALTER TABLE projects DROP COLUMN composition_mode;
ALTER TABLE projects DROP COLUMN publishing_mode;
ALTER TABLE projects DROP COLUMN version;

-- Drop old enum types (no longer referenced by any column)
DROP TYPE IF EXISTS composition_mode;
DROP TYPE IF EXISTS publishing_mode;

-- Convert snapshots.stage from enum to text (drop default first to remove enum dependency)
ALTER TABLE snapshots ALTER COLUMN stage DROP DEFAULT;
ALTER TABLE snapshots ALTER COLUMN stage TYPE text USING stage::text;
DROP TYPE IF EXISTS lifecycle_stage;

-- ── Step 3: RLS policies for actone_project_ext ───────────────────

ALTER TABLE actone_project_ext ENABLE ROW LEVEL SECURITY;

CREATE POLICY actone_project_ext_select ON actone_project_ext FOR SELECT TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY actone_project_ext_insert ON actone_project_ext FOR INSERT TO authenticated
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY actone_project_ext_update ON actone_project_ext FOR UPDATE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY actone_project_ext_delete ON actone_project_ext FOR DELETE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));

-- ── Step 4: Rename source_files → project_files ───────────────────

ALTER TABLE source_files RENAME TO project_files;
ALTER TABLE project_files RENAME COLUMN modified_at TO updated_at;
ALTER TABLE project_files ADD COLUMN IF NOT EXISTS content_hash text;

-- Update indexes
ALTER INDEX IF EXISTS source_files_project_id_idx RENAME TO project_files_project_id_idx;
CREATE UNIQUE INDEX IF NOT EXISTS project_files_project_path_idx ON project_files (project_id, file_path);

-- Update RLS policies for renamed table
DROP POLICY IF EXISTS users_access_source_files ON project_files;

CREATE POLICY project_files_select ON project_files FOR SELECT TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY project_files_insert ON project_files FOR INSERT TO authenticated
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY project_files_update ON project_files FOR UPDATE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY project_files_delete ON project_files FOR DELETE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));

-- ── Step 5: Update projects RLS policies to match sanyam-db ───────

-- Drop old-style single "all" policy and replace with per-operation policies
DROP POLICY IF EXISTS users_own_projects ON projects;

CREATE POLICY projects_select ON projects FOR SELECT TO authenticated
    USING (user_id = (select auth.uid()));
CREATE POLICY projects_insert ON projects FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY projects_update ON projects FOR UPDATE TO authenticated
    USING (user_id = (select auth.uid()));
CREATE POLICY projects_delete ON projects FOR DELETE TO authenticated
    USING (user_id = (select auth.uid()));

-- ── Step 6: Update domain table RLS policies to per-operation ─────

-- Snapshots
DROP POLICY IF EXISTS users_access_project_snapshots ON snapshots;
CREATE POLICY snapshots_select ON snapshots FOR SELECT TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY snapshots_insert ON snapshots FOR INSERT TO authenticated
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY snapshots_update ON snapshots FOR UPDATE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY snapshots_delete ON snapshots FOR DELETE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));

-- Snapshot files
DROP POLICY IF EXISTS users_access_snapshot_files ON snapshot_files;
CREATE POLICY snapshot_files_select ON snapshot_files FOR SELECT TO authenticated
    USING (snapshot_id IN (SELECT id FROM snapshots WHERE project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid()))));
CREATE POLICY snapshot_files_insert ON snapshot_files FOR INSERT TO authenticated
    WITH CHECK (snapshot_id IN (SELECT id FROM snapshots WHERE project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid()))));
CREATE POLICY snapshot_files_update ON snapshot_files FOR UPDATE TO authenticated
    USING (snapshot_id IN (SELECT id FROM snapshots WHERE project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid()))));
CREATE POLICY snapshot_files_delete ON snapshot_files FOR DELETE TO authenticated
    USING (snapshot_id IN (SELECT id FROM snapshots WHERE project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid()))));

-- Assets
DROP POLICY IF EXISTS users_access_project_assets ON assets;
CREATE POLICY assets_select ON assets FOR SELECT TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY assets_insert ON assets FOR INSERT TO authenticated
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY assets_update ON assets FOR UPDATE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY assets_delete ON assets FOR DELETE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));

-- Analytics snapshots
DROP POLICY IF EXISTS users_access_project_analytics ON analytics_snapshots;
CREATE POLICY analytics_snapshots_select ON analytics_snapshots FOR SELECT TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY analytics_snapshots_insert ON analytics_snapshots FOR INSERT TO authenticated
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY analytics_snapshots_update ON analytics_snapshots FOR UPDATE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY analytics_snapshots_delete ON analytics_snapshots FOR DELETE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));

-- Draft versions
DROP POLICY IF EXISTS users_access_project_drafts ON draft_versions;
CREATE POLICY draft_versions_select ON draft_versions FOR SELECT TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY draft_versions_insert ON draft_versions FOR INSERT TO authenticated
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY draft_versions_update ON draft_versions FOR UPDATE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));
CREATE POLICY draft_versions_delete ON draft_versions FOR DELETE TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = (select auth.uid())));

COMMIT;
