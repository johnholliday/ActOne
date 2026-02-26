/**
 * Shared vi.mock() setup for studio integration tests.
 *
 * Import this file at the top of integration test files to mock
 * all server singletons. Then import the mock instances for
 * per-test configuration.
 *
 * Usage:
 *   // At top of test file (before other imports):
 *   import './fixtures/mocks/setup.js';
 *   // Then import mocks for configuration:
 *   import { mockDb, configureMockDb } from './fixtures/mocks/db.js';
 *   import { mockSupabaseAdmin } from './fixtures/mocks/supabase.js';
 */

import { vi } from 'vitest';
import { mockDb } from './db.js';
import { mockSupabaseAdmin } from './supabase.js';
import {
  mockTextBackend,
  mockImageBackend,
} from './ai-backends.js';

// ── Mock server modules ───────────────────────────────────────────────

// Mock the Drizzle db singleton
vi.mock('$lib/server/db', () => ({
  db: mockDb,
  withRLS: vi.fn(async (_jwt: string, fn: (tx: unknown) => Promise<unknown>) => {
    return fn(mockDb);
  }),
}));

// Mock the Supabase admin client
vi.mock('$lib/server/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

// Mock image backend registry
vi.mock('$lib/server/image-backends', () => ({
  imageBackendRegistry: {
    get: vi.fn((id: string) =>
      id === mockImageBackend.id ? mockImageBackend : undefined,
    ),
    listAll: vi.fn(async () => [
      {
        id: mockImageBackend.id,
        name: mockImageBackend.name,
        type: 'image' as const,
        available: true,
        capabilities: { maxResolution: 1024, referenceImages: false },
      },
    ]),
    getIds: vi.fn(() => [mockImageBackend.id]),
  },
}));

// Mock text backend registry
vi.mock('$lib/ai/backends/backend-registry', () => ({
  backendRegistry: {
    get: vi.fn((id: string) =>
      id === mockTextBackend.id ? mockTextBackend : undefined,
    ),
    getActive: vi.fn(() => mockTextBackend),
    setActive: vi.fn(),
    getActiveId: vi.fn(() => mockTextBackend.id),
    listAll: vi.fn(async () => [
      {
        id: mockTextBackend.id,
        name: mockTextBackend.name,
        type: 'text' as const,
        available: true,
        capabilities: {
          maxContextTokens: 100_000,
          streaming: true,
          concurrentRequests: 5,
        },
      },
    ]),
    getIds: vi.fn(() => [mockTextBackend.id]),
  },
}));

// Mock SvelteKit environment variables
vi.mock('$env/dynamic/private', () => ({
  env: {
    DATABASE_URL: 'postgresql://mock:mock@localhost:5432/mockdb',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
    OPENAI_API_KEY: 'mock-openai-key',
    ANTHROPIC_API_KEY: 'mock-anthropic-key',
  },
}));

vi.mock('$env/static/private', () => ({
  DATABASE_URL: 'postgresql://mock:mock@localhost:5432/mockdb',
  SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
}));

vi.mock('$env/static/public', () => ({
  PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
  PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
}));

// ── Re-export mocks for convenient access ─────────────────────────────

export { mockDb } from './db.js';
export { configureMockDb, resetMockDb } from './db.js';
export { mockSupabaseAdmin } from './supabase.js';
export { configureMockSupabase, resetMockSupabase } from './supabase.js';
export {
  mockTextBackend,
  mockImageBackend,
  configureMockTextBackend,
  configureMockImageBackend,
  resetMockAiBackends,
} from './ai-backends.js';
