/**
 * Browser-side Supabase client for file load/save operations.
 *
 * Used by the editor for saving files back to Supabase and loading
 * file contents for new tabs.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface FileData {
  id: string;
  filePath: string;
  content: string;
  isEntry: boolean;
}

/**
 * Load a single source file's content from Supabase.
 */
export async function loadFileContent(
  supabase: SupabaseClient,
  fileId: string,
): Promise<FileData | null> {
  const { data, error } = await supabase
    .from('source_files')
    .select('id, file_path, content, is_entry')
    .eq('id', fileId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    filePath: data.file_path as string,
    content: data.content as string,
    isEntry: data.is_entry as boolean,
  };
}

/**
 * Load all source files for a project from Supabase.
 */
export async function loadProjectFiles(
  supabase: SupabaseClient,
  projectId: string,
): Promise<FileData[]> {
  const { data, error } = await supabase
    .from('source_files')
    .select('id, file_path, content, is_entry')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    filePath: row.file_path as string,
    content: row.content as string,
    isEntry: row.is_entry as boolean,
  }));
}

/**
 * Save file content back to Supabase.
 */
export async function saveFileContent(
  supabase: SupabaseClient,
  fileId: string,
  content: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('source_files')
    .update({ content, modified_at: new Date().toISOString() })
    .eq('id', fileId);

  return !error;
}

/**
 * Create a new source file in Supabase.
 */
export async function createFile(
  supabase: SupabaseClient,
  projectId: string,
  filePath: string,
  content: string,
): Promise<FileData | null> {
  const { data, error } = await supabase
    .from('source_files')
    .insert({
      project_id: projectId,
      file_path: filePath,
      content,
      is_entry: false,
    })
    .select('id, file_path, content, is_entry')
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    filePath: data.file_path as string,
    content: data.content as string,
    isEntry: data.is_entry as boolean,
  };
}

/**
 * Delete a source file from Supabase.
 */
export async function deleteFile(
  supabase: SupabaseClient,
  fileId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('source_files')
    .delete()
    .eq('id', fileId);

  return !error;
}
