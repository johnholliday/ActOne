import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  const { session } = await safeGetSession();

  if (!session) {
    return { session, projects: [] };
  }

  // T004: Load the user's projects (ordered by most recently modified)
  const { data: projects } = await supabase
    .from('projects')
    .select(
      'id, title, author_name, genre, composition_mode, lifecycle_stage, publishing_mode, grammar_version, grammar_fingerprint, modified_at',
    )
    .order('modified_at', { ascending: false })
    .limit(50);

  return { session, projects: projects ?? [] };
};
