/**
 * Test helpers for Hono API endpoint testing.
 *
 * Creates a Hono test app with sanyam-projects route handlers and auth middleware,
 * using a mock database for testing.
 */

import { Hono } from 'hono';
import { createProjectRoutes } from '@docugenix/sanyam-projects';
import { draftRoutes } from '$lib/api/draft.js';
import { mockDb } from '../../fixtures/mocks/db.js';

// ── Default test user / session ───────────────────────────────────────

export const defaultUser = {
  id: 'user-001',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
};

export const defaultSession = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: defaultUser,
};

// ── Hono test app factory ─────────────────────────────────────────────

/**
 * Creates a Hono test app with sanyam-projects route handlers.
 * Pass a user object for authenticated requests, or `null` for unauthenticated.
 */
export function createTestApp(user?: typeof defaultUser | null) {
  const app = new Hono();

  app.use('*', async (c, next) => {
    if (user) {
      c.set('user', user);
      c.set('session', { ...defaultSession, user });
      // Set user ID header for sanyam-projects routes
      c.req.raw.headers.set('x-user-id', user.id);
    }
    await next();
  });

  const projectRoutes = createProjectRoutes({
    db: mockDb,
    fileExtension: 'actone',
    generateEntryFilePath: (title: string) =>
      `${title.toLowerCase().replace(/\s+/g, '-')}.actone`,
    generateEntrySkeleton: (title: string) => `story "${title}" {}\n`,
    aggregateStats: () => ({
      wordCount: 100,
      sceneCount: 5,
      characterCount: 3,
    }),
    maxFilesPerProject: 10,
  });

  app.route('/project', projectRoutes);
  app.route('/draft', draftRoutes);

  return app;
}

// ── Request helpers ───────────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
  params?: Record<string, string>;
}

/**
 * Send a request to the test app and return the Response.
 */
export async function appRequest(
  app: ReturnType<typeof createTestApp>,
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const { method = 'GET', body, searchParams } = options;

  const url = new URL(`http://localhost${path}`);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'content-type': 'application/json' };
  }

  return app.request(url.pathname + url.search, init);
}

/**
 * Extracts JSON body from a Response.
 */
export async function getJsonBody<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
