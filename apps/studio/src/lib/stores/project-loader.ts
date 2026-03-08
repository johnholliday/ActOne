/**
 * Project loading logic extracted from project.svelte.ts.
 *
 * Pure async function that queries Supabase and returns
 * structured project data without Svelte rune dependencies.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectMeta, SourceFileEntry } from './project.svelte.js';

export type LoadProjectResult =
  | { success: true; project: ProjectMeta; files: SourceFileEntry[] }
  | { success: false };

function mapProjectRow(projectRow: Record<string, unknown>): ProjectMeta {
  // Extension data comes as a nested object from PostgREST embedding
  const ext = (projectRow.actone_project_ext ?? {}) as Record<string, unknown>;

  return {
    id: projectRow.id as string,
    title: projectRow.name as string,
    authorName: (ext.author_name as string | null) ?? null,
    genre: (ext.genre as string | null) ?? null,
    compositionMode: (ext.composition_mode as ProjectMeta['compositionMode']) ?? 'merge',
    lifecycleStage: (projectRow.lifecycle_phase as ProjectMeta['lifecycleStage']) ?? 'draft',
    publishingMode: (ext.publishing_mode as ProjectMeta['publishingMode']) ?? 'text',
    grammarVersion: projectRow.grammar_version as string | null,
    grammarFingerprint: projectRow.grammar_fingerprint as string | null,
  };
}

function mapFileRows(fileRows: Record<string, unknown>[]): SourceFileEntry[] {
  return fileRows.map((f) => ({
    id: f.id as string,
    filePath: f.file_path as string,
    isEntry: f.is_entry as boolean,
    content: f.content as string | undefined,
  }));
}

export async function loadProjectFromSupabase(
  supabase: SupabaseClient,
): Promise<LoadProjectResult> {
  const { data: projectRow, error: projectError } = await supabase
    .from('projects')
    .select('*, actone_project_ext(*)')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (projectError || !projectRow) {
    return { success: false };
  }

  const { data: fileRows, error: filesError } = await supabase
    .from('project_files')
    .select('id, file_path, is_entry, content')
    .eq('project_id', projectRow.id)
    .order('file_path', { ascending: true });

  if (filesError) {
    return { success: false };
  }

  return {
    success: true,
    project: mapProjectRow(projectRow),
    files: mapFileRows(fileRows ?? []),
  };
}

export async function loadProjectByIdFromSupabase(
  supabase: SupabaseClient,
  projectId: string,
): Promise<LoadProjectResult> {
  const { data: projectRow, error: projectError } = await supabase
    .from('projects')
    .select('*, actone_project_ext(*)')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    return { success: false };
  }

  const { data: fileRows, error: filesError } = await supabase
    .from('project_files')
    .select('id, file_path, is_entry, content')
    .eq('project_id', projectRow.id)
    .order('file_path', { ascending: true });

  if (filesError) {
    return { success: false };
  }

  return {
    success: true,
    project: mapProjectRow(projectRow),
    files: mapFileRows(fileRows ?? []),
  };
}
