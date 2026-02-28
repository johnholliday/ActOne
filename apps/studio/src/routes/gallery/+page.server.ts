/**
 * T037: Gallery server load function.
 *
 * Queries the assets table for the active project's assets,
 * ordered by createdAt descending. Uses the user's authenticated
 * Supabase client so RLS policies apply.
 */
import type { PageServerLoad } from './$types';
import { mapAssetRow } from '$lib/gallery/asset-mapping.js';

export const load: PageServerLoad = async ({ parent, url, locals: { supabase } }) => {
  const { session, projects } = await parent();

  if (!session || !projects || projects.length === 0) {
    return { assets: [] };
  }

  // Accept optional projectId from URL search param; default to most recent project
  const projectId = url.searchParams.get('projectId') ?? projects[0]?.id;
  if (!projectId) {
    return { assets: [] };
  }

  const { data: assetRows, error } = await supabase
    .from('assets')
    .select('id, project_id, type, name, status, prompt, backend, metadata, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load gallery assets:', error.message);
    return { assets: [] };
  }

  return {
    assets: (assetRows ?? []).map((row: Record<string, unknown>) => mapAssetRow(row)),
  };
};
