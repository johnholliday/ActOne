-- Fix RLS policies that drizzle-kit push creates without USING/WITH CHECK expressions.
-- These match the policy definitions in packages/shared/src/db/schema.ts exactly.

-- projects: direct user ownership
DROP POLICY IF EXISTS "users_own_projects" ON public.projects;
CREATE POLICY "users_own_projects" ON public.projects
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- source_files: owned via projects
DROP POLICY IF EXISTS "users_access_project_files" ON public.source_files;
CREATE POLICY "users_access_project_files" ON public.source_files
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())));

-- snapshots: owned via projects
DROP POLICY IF EXISTS "users_access_project_snapshots" ON public.snapshots;
CREATE POLICY "users_access_project_snapshots" ON public.snapshots
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())));

-- snapshot_files: owned via snapshots -> projects
DROP POLICY IF EXISTS "users_access_snapshot_files" ON public.snapshot_files;
CREATE POLICY "users_access_snapshot_files" ON public.snapshot_files
  FOR ALL TO authenticated
  USING (snapshot_id IN (SELECT s.id FROM snapshots s JOIN projects p ON s.project_id = p.id WHERE p.user_id = (SELECT auth.uid())))
  WITH CHECK (snapshot_id IN (SELECT s.id FROM snapshots s JOIN projects p ON s.project_id = p.id WHERE p.user_id = (SELECT auth.uid())));

-- assets: owned via projects
DROP POLICY IF EXISTS "users_access_project_assets" ON public.assets;
CREATE POLICY "users_access_project_assets" ON public.assets
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())));

-- analytics_snapshots: owned via projects
DROP POLICY IF EXISTS "users_access_project_analytics" ON public.analytics_snapshots;
CREATE POLICY "users_access_project_analytics" ON public.analytics_snapshots
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())));

-- draft_versions: owned via projects
DROP POLICY IF EXISTS "users_access_project_drafts" ON public.draft_versions;
CREATE POLICY "users_access_project_drafts" ON public.draft_versions
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())));
