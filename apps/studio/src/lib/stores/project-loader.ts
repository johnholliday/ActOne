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

export async function loadProjectFromSupabase(
  supabase: SupabaseClient,
): Promise<LoadProjectResult> {
  const { data: projectRow, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .order('modified_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (projectError || !projectRow) {
    return { success: false };
  }

  const { data: fileRows, error: filesError } = await supabase
    .from('source_files')
    .select('id, file_path, is_entry, content')
    .eq('project_id', projectRow.id)
    .order('file_path', { ascending: true });

  if (filesError) {
    return { success: false };
  }

  const project: ProjectMeta = {
    id: projectRow.id,
    title: projectRow.title,
    authorName: projectRow.author_name,
    genre: projectRow.genre,
    compositionMode: projectRow.composition_mode,
    lifecycleStage: projectRow.lifecycle_stage,
    publishingMode: projectRow.publishing_mode,
    grammarVersion: projectRow.grammar_version,
    grammarFingerprint: projectRow.grammar_fingerprint,
  };

  const files: SourceFileEntry[] = (fileRows ?? []).map(
    (f: Record<string, unknown>) => ({
      id: f.id as string,
      filePath: f.file_path as string,
      isEntry: f.is_entry as boolean,
      content: f.content as string | undefined,
    }),
  );

  return { success: true, project, files };
}

export async function loadProjectByIdFromSupabase(
  supabase: SupabaseClient,
  projectId: string,
): Promise<LoadProjectResult> {
  const { data: projectRow, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    return { success: false };
  }

  const { data: fileRows, error: filesError } = await supabase
    .from('source_files')
    .select('id, file_path, is_entry, content')
    .eq('project_id', projectRow.id)
    .order('file_path', { ascending: true });

  if (filesError) {
    return { success: false };
  }

  const project: ProjectMeta = {
    id: projectRow.id,
    title: projectRow.title,
    authorName: projectRow.author_name,
    genre: projectRow.genre,
    compositionMode: projectRow.composition_mode,
    lifecycleStage: projectRow.lifecycle_stage,
    publishingMode: projectRow.publishing_mode,
    grammarVersion: projectRow.grammar_version,
    grammarFingerprint: projectRow.grammar_fingerprint,
  };

  const files: SourceFileEntry[] = (fileRows ?? []).map(
    (f: Record<string, unknown>) => ({
      id: f.id as string,
      filePath: f.file_path as string,
      isEntry: f.is_entry as boolean,
      content: f.content as string | undefined,
    }),
  );

  return { success: true, project, files };
}
