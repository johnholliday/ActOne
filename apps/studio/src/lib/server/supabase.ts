import { createClient } from '@supabase/supabase-js';

import {
  SUPABASE_SERVICE_ROLE_KEY,
} from '$env/static/private';
import {
  PUBLIC_SUPABASE_URL,
} from '$env/static/public';

/**
 * Server-side Supabase client with service role.
 * Use this for admin operations that bypass RLS.
 */
export const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
