/**
 * Mock Supabase user-scoped client (locals.supabase).
 *
 * Server load functions receive a per-request Supabase client
 * via `locals.supabase`. This mock supports chainable queries
 * identical to the real Supabase PostgREST builder.
 *
 * Usage:
 *   import { mockSupabaseClient, configureTable, resetMockSupabaseClient } from './supabase-client.js';
 *   configureTable('assets', { data: [{ id: '1' }], error: null });
 */

import { vi } from 'vitest';

// ── Per-table result store ────────────────────────────────────────────

interface TableResult {
  data: unknown[] | Record<string, unknown> | null;
  error: { message: string } | null;
}

const _tableResults = new Map<string, TableResult>();

export function configureTable(table: string, result: TableResult): void {
  _tableResults.set(table, result);
}

export function resetMockSupabaseClient(): void {
  _tableResults.clear();
  _authConfig = {};
}

// ── Auth mock config ──────────────────────────────────────────────────

interface AuthConfig {
  session?: { user: { id: string; email?: string; [key: string]: unknown }; [key: string]: unknown } | null;
  updateUserResult?: { error: { message: string } | null };
}

let _authConfig: AuthConfig = {};

export function configureAuth(config: AuthConfig): void {
  _authConfig = config;
}

// ── Chainable query builder ───────────────────────────────────────────

function createChainableQuery(table: string): Record<string, unknown> {
  const chain: Record<string, unknown> = {};

  const methods = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'is',
    'in',
    'contains',
    'containedBy',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'not',
    'or',
    'match',
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal — resolves to the configured table result
  chain.then = (
    resolve: (v: unknown) => void,
    reject: (e: unknown) => void,
  ) => {
    try {
      const result = _tableResults.get(table) ?? { data: [], error: null };
      resolve(result);
    } catch (err) {
      reject(err);
    }
  };

  // Allow await
  chain[Symbol.toStringTag] = 'Promise';

  return chain;
}

// ── Mock client instance ──────────────────────────────────────────────

export const mockSupabaseClient = {
  from: vi.fn((table: string) => createChainableQuery(table)),
  auth: {
    getSession: vi.fn(async () => {
      const session = _authConfig.session ?? null;
      return { data: { session }, error: null };
    }),
    getUser: vi.fn(async () => {
      const session = _authConfig.session ?? null;
      return {
        data: { user: session?.user ?? null },
        error: session ? null : { message: 'Not authenticated' },
      };
    }),
    updateUser: vi.fn(async (_attrs: unknown) => {
      const result = _authConfig.updateUserResult ?? { error: null };
      return { data: { user: _authConfig.session?.user ?? null }, error: result.error };
    }),
  },
  rpc: vi.fn(async () => ({ data: null, error: null })),
};

export type MockSupabaseClient = typeof mockSupabaseClient;
