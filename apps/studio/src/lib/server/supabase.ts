import { createAdminClient } from '@docugenix/sanyam-auth/server';

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
export const supabaseAdmin = createAdminClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);
