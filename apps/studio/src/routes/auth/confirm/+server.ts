import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as
    | 'signup'
    | 'recovery'
    | 'email'
    | null;
  const next = url.searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!error) {
      redirect(303, next);
    }
  }

  // If verification fails, redirect to auth page
  redirect(303, '/auth');
};
