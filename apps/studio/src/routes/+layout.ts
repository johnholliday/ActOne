import { createBrowserClient, isBrowser, parse } from '@supabase/ssr';
import type { LayoutLoad } from './$types';

import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from '$env/static/public';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  /**
   * Declare a dependency so the layout data is refetched whenever
   * `invalidate('supabase:auth')` is called.
   */
  depends('supabase:auth');

  const supabase = createBrowserClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { fetch },
      cookies: {
        getAll: () => {
          if (!isBrowser()) return [];
          const parsed = parse(document.cookie);
          return Object.entries(parsed)
            .filter((entry): entry is [string, string] => entry[1] !== undefined)
            .map(([name, value]) => ({ name, value }));
        },
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            document.cookie = `${name}=${value}; path=${options.path ?? '/'}`;
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { ...data, session, user, supabase };
};
