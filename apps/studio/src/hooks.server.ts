import { type Handle, redirect, json } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { Hono } from 'hono';
import { handleAuth } from '@docugenix/sanyam-auth/sveltekit';
import { createSanyamApi, type ApiRouteContribution } from '@docugenix/sanyam-app/api';
import { createAiTextRoutes } from '@docugenix/sanyam-ai-text';
import { createAiImageRoutes } from '@docugenix/sanyam-ai-image';
import { createPublishingRoutes } from '@docugenix/sanyam-publishing';
import { FormatRegistry } from '@docugenix/sanyam-publishing/formats';
import { projectRoutes } from '$lib/api/project.js';
import { draftRoutes } from '$lib/api/draft.js';
import { analyticsRoutes } from '$lib/api/analytics.js';
import { visualDnaRoute } from '$lib/api/character.js';
import { createAiTextConfig, createAiImageConfig } from '$lib/api/provider-adapters.js';

import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from '$env/static/public';

/* ── Auth handle (Supabase SSR session resolution) ─────────────── */

const supabaseHandle: Handle = async ({ event, resolve }) => {
  const { supabase, session, user } = await handleAuth({
    config: {
      supabaseUrl: PUBLIC_SUPABASE_URL,
      supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY,
    },
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookies) =>
        cookies.forEach((c) =>
          event.cookies.set(c.name, c.value, { path: '/', ...c.options }),
        ),
    },
  });

  event.locals.supabase = supabase;
  event.locals.session = session;
  event.locals.user = user;

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};

/* ── Auth guard ────────────────────────────────────────────────── */

const authGuard: Handle = async ({ event, resolve }) => {
  if (
    !event.locals.session &&
    !event.url.pathname.startsWith('/auth') &&
    !event.url.pathname.startsWith('/api/auth')
  ) {
    if (event.url.pathname.startsWith('/api/')) {
      return json(
        { message: 'Unauthorized — please sign in again' },
        { status: 401 },
      );
    }
    redirect(303, '/auth');
  }

  return resolve(event);
};

/* ── Hono API route contributions ──────────────────────────────── */

// Publishing format registry — formats will be registered by contributions
const publishingFormats = new FormatRegistry();

const contributions: ApiRouteContribution[] = [
  { prefix: '/project', routes: projectRoutes },
  { prefix: '/draft', routes: draftRoutes },
  { prefix: '/ai-text', routes: createAiTextRoutes(createAiTextConfig()) },
  { prefix: '/ai-image', routes: createAiImageRoutes(createAiImageConfig()) },
  { prefix: '/character', routes: visualDnaRoute },
  { prefix: '/publishing', routes: createPublishingRoutes({ registry: publishingFormats }) },
  { prefix: '/analytics', routes: analyticsRoutes },
];

const honoApp = createSanyamApi(contributions, '/api');

// Bridge SvelteKit locals (passed as Hono env bindings) into the Hono
// context store so route handlers can access them via c.get('user') etc.
// We prepend this middleware by re-wrapping the app.
const wrappedApp = new Hono();
wrappedApp.use('*', async (c, next) => {
  if (c.env.user) c.set('user', c.env.user);
  if (c.env.session) c.set('session', c.env.session);
  if (c.env.supabase) c.set('supabase', c.env.supabase);
  await next();
});
wrappedApp.route('/', honoApp);

const apiHandle: Handle = async ({ event, resolve }) => {
  if (!event.url.pathname.startsWith('/api/')) {
    return resolve(event);
  }

  // Build a standard Request with Hono env bindings from SvelteKit locals
  const response = await wrappedApp.fetch(event.request, {
    session: event.locals.session,
    user: event.locals.user,
    supabase: event.locals.supabase,
  });

  return response;
};

/* ── Combined handle: auth first, guard, then API routing ──────── */

export const handle: Handle = sequence(supabaseHandle, authGuard, apiHandle);
