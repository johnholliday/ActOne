import { sequence } from '@sveltejs/kit/hooks';
import { createSanyamAuthHooks } from '@docugenix/sanyam-auth/sveltekit';
import { createSanyamApi, type ApiRouteContribution } from '@docugenix/sanyam-app/api';
import { createAiTextRoutes } from '@docugenix/sanyam-ai-text';
import { createAiImageRoutes } from '@docugenix/sanyam-ai-image';
import { createPublishingRoutes } from '@docugenix/sanyam-publishing';
import { projectRoutes } from '$lib/api/project.js';
import { draftRoutes } from '$lib/api/draft.js';
import { analyticsRoutes } from '$lib/api/analytics.js';
import { visualDnaRoute } from '$lib/api/character.js';

import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from '$env/static/public';

/* ── Auth hooks (Supabase SSR + route guard) ─────────────────────── */

const authHandle = createSanyamAuthHooks({
  supabaseUrl: PUBLIC_SUPABASE_URL,
  supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY,
  protectedRoutes: {
    exclude: ['/auth', '/api/auth'],
    apiUnauthorizedResponse: { message: 'Unauthorized — please sign in again' },
  },
});

/* ── Hono API route contributions ────────────────────────────────── */

const contributions: ApiRouteContribution[] = [
  { prefix: '/project',    routes: projectRoutes },
  { prefix: '/draft',      routes: draftRoutes },
  { prefix: '/ai-text',    routes: createAiTextRoutes() },
  { prefix: '/ai-image',   routes: createAiImageRoutes() },
  { prefix: '/character',  routes: visualDnaRoute },
  { prefix: '/publishing', routes: createPublishingRoutes() },
  { prefix: '/analytics',  routes: analyticsRoutes },
];

const apiHandle = createSanyamApi(contributions);

/* ── Combined handle: auth first, then API routing ───────────────── */

export const handle = sequence(authHandle, apiHandle);
