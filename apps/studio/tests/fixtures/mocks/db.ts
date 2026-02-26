/**
 * Mock Drizzle db object with chainable query builders.
 *
 * Usage:
 *   import { mockDb, configureMockDb } from './db.js';
 *   // In test setup:
 *   configureMockDb({
 *     select: [{ id: '1', title: 'Test' }],
 *   });
 */

import { vi } from 'vitest';

// ── Configurable result store ─────────────────────────────────────────

interface MockDbConfig {
  select?: unknown[];
  insert?: unknown;
  update?: unknown;
  delete?: unknown;
  execute?: unknown;
  transaction?: (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
}

let _config: MockDbConfig = {};

export function configureMockDb(config: MockDbConfig): void {
  _config = config;
}

export function resetMockDb(): void {
  _config = {};
}

// ── Chainable mock builder ────────────────────────────────────────────

function createChainableQuery(defaultResult: unknown): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const methods = [
    'from',
    'where',
    'set',
    'values',
    'returning',
    'orderBy',
    'limit',
    'offset',
    'leftJoin',
    'innerJoin',
    'groupBy',
    'having',
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal — resolves to the configured data
  chain.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
    try {
      resolve(defaultResult);
    } catch (err) {
      reject(err);
    }
  };

  // Allow await
  chain[Symbol.toStringTag] = 'Promise';

  return chain;
}

// ── Mock db instance ──────────────────────────────────────────────────

export const mockDb = {
  select: vi.fn(() => createChainableQuery(_config.select ?? [])),
  insert: vi.fn(() => createChainableQuery(_config.insert ?? { id: 'mock-id' })),
  update: vi.fn(() => createChainableQuery(_config.update ?? { id: 'mock-id' })),
  delete: vi.fn(() => createChainableQuery(_config.delete ?? undefined)),
  execute: vi.fn(async () => _config.execute ?? undefined),
  transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    if (_config.transaction) {
      return _config.transaction(fn);
    }
    // Default: pass mock db as transaction context
    return fn(mockDb);
  }),
  query: new Proxy(
    {},
    {
      get(_target, prop) {
        // db.query.projects.findMany() etc.
        return {
          findMany: vi.fn(async () => _config.select ?? []),
          findFirst: vi.fn(async () => (_config.select ?? [])[0] ?? null),
        };
      },
    },
  ),
};

/** Type helper — use as `typeof db` replacement in tests */
export type MockDb = typeof mockDb;
