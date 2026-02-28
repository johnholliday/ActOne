import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  login: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return fail(400, {
        message: error.message,
        email,
      });
    }

    redirect(303, '/');
  },

  signup: async ({ request, url, locals: { supabase } }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${url.origin}/auth/confirm`,
      },
    });

    if (error) {
      return fail(400, {
        message: error.message,
        email,
      });
    }

    redirect(303, '/');
  },

  oauth: async ({ request, url, locals: { supabase } }) => {
    const formData = await request.formData();
    const provider = formData.get('provider') as 'google' | 'github';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${url.origin}/auth/callback`,
      },
    });

    if (error) {
      return fail(400, {
        message: error.message,
      });
    }

    redirect(303, data.url);
  },
};
