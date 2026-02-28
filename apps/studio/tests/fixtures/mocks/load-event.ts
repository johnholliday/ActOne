/**
 * Factory functions for SvelteKit server load event objects.
 *
 * These create minimal objects that satisfy the parameter types
 * expected by +layout.server.ts and +page.server.ts load functions.
 *
 * Usage:
 *   const event = createLayoutLoadEvent({ supabaseConfig: { projects: { data: [...] } } });
 *   const result = await load(event);
 */

import { mockSupabaseClient, configureTable, configureAuth, resetMockSupabaseClient } from './supabase-client.js';

// ── Types ─────────────────────────────────────────────────────────────

interface Session {
  user: { id: string; email?: string; [key: string]: unknown };
  [key: string]: unknown;
}

interface TableResult {
  data: unknown[] | Record<string, unknown> | null;
  error: { message: string } | null;
}

interface LayoutLoadEventOverrides {
  session?: Session | null;
  supabaseConfig?: Record<string, TableResult>;
}

interface PageLoadEventOverrides {
  parentData?: { session: Session | null; projects: unknown[] };
  searchParams?: Record<string, string>;
  supabaseConfig?: Record<string, TableResult>;
}

// ── Layout Server Load Event ──────────────────────────────────────────

export function createLayoutLoadEvent(overrides: LayoutLoadEventOverrides = {}) {
  const session = overrides.session === undefined
    ? { user: { id: 'test-user-1', email: 'test@example.com' } }
    : overrides.session;

  // Configure the Supabase client mock tables
  resetMockSupabaseClient();
  if (overrides.supabaseConfig) {
    for (const [table, result] of Object.entries(overrides.supabaseConfig)) {
      configureTable(table, result);
    }
  }
  if (session) {
    configureAuth({ session: session as Session });
  }

  return {
    locals: {
      safeGetSession: async () => ({ session }),
      supabase: mockSupabaseClient,
    },
    cookies: {
      get: () => undefined,
      set: () => undefined,
      delete: () => undefined,
      getAll: () => [],
      serialize: () => '',
    },
    url: new URL('http://localhost:5173'),
    request: new Request('http://localhost:5173'),
    params: {},
    route: { id: '/' },
    isDataRequest: false,
    isSubRequest: false,
    depends: () => {},
    untrack: (fn: () => unknown) => fn(),
    fetch: globalThis.fetch,
  } as unknown;
}

// ── Page Server Load Event ────────────────────────────────────────────

export function createPageLoadEvent(overrides: PageLoadEventOverrides = {}) {
  const parentData = overrides.parentData ?? {
    session: { user: { id: 'test-user-1', email: 'test@example.com' } },
    projects: [],
  };

  const searchParams = new URLSearchParams(overrides.searchParams ?? {});

  // Configure the Supabase client mock tables
  resetMockSupabaseClient();
  if (overrides.supabaseConfig) {
    for (const [table, result] of Object.entries(overrides.supabaseConfig)) {
      configureTable(table, result);
    }
  }

  return {
    parent: async () => parentData,
    url: new URL(`http://localhost:5173?${searchParams.toString()}`),
    locals: {
      supabase: mockSupabaseClient,
    },
    cookies: {
      get: () => undefined,
      set: () => undefined,
      delete: () => undefined,
      getAll: () => [],
      serialize: () => '',
    },
    request: new Request('http://localhost:5173'),
    params: {},
    route: { id: '/gallery' },
    isDataRequest: false,
    isSubRequest: false,
    depends: () => {},
    untrack: (fn: () => unknown) => fn(),
    fetch: globalThis.fetch,
  } as unknown;
}
