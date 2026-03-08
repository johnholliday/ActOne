import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { session, user, supabase } }) => {
  if (!session) {
    return { session, user, projects: [] };
  }

  // T004: Load the user's projects with ActOne extension data (ordered by most recently updated)
  const { data: projects } = await supabase
    .from('projects')
    .select(
      'id, name, lifecycle_phase, grammar_version, grammar_fingerprint, metadata, updated_at, actone_project_ext(author_name, genre, composition_mode, publishing_mode)',
    )
    .order('updated_at', { ascending: false })
    .limit(50);

  return { session, user, projects: projects ?? [] };
};
