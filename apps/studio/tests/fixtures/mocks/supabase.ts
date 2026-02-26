/**
 * Mock Supabase admin client.
 *
 * Provides mock implementations for auth, storage, and realtime
 * operations used by API endpoints.
 *
 * Usage:
 *   import { mockSupabaseAdmin, configureMockSupabase } from './supabase.js';
 *   configureMockSupabase({
 *     session: { user: { id: 'user-1' } },
 *   });
 */

import { vi } from 'vitest';

// ── Configurable result store ─────────────────────────────────────────

interface MockSupabaseConfig {
  session?: {
    user: { id: string; email?: string; [key: string]: unknown };
    [key: string]: unknown;
  } | null;
  uploadResult?: { path: string; id?: string };
  signedUrl?: string;
  downloadData?: Blob | null;
  storageError?: { message: string } | null;
}

let _config: MockSupabaseConfig = {};

export function configureMockSupabase(config: MockSupabaseConfig): void {
  _config = config;
}

export function resetMockSupabase(): void {
  _config = {};
}

// ── Storage bucket mock ───────────────────────────────────────────────

function createBucketMock() {
  return {
    upload: vi.fn(async (_path: string, _body: unknown, _options?: unknown) => {
      if (_config.storageError) {
        return { data: null, error: _config.storageError };
      }
      return {
        data: _config.uploadResult ?? { path: 'mock/path.png', id: 'mock-id' },
        error: null,
      };
    }),
    download: vi.fn(async (_path: string) => {
      if (_config.storageError) {
        return { data: null, error: _config.storageError };
      }
      return { data: _config.downloadData ?? new Blob(['test']), error: null };
    }),
    createSignedUrl: vi.fn(async (_path: string, _expiresIn: number) => {
      if (_config.storageError) {
        return { data: null, error: _config.storageError };
      }
      return {
        data: {
          signedUrl:
            _config.signedUrl ?? 'https://mock.supabase.co/signed/test.png',
        },
        error: null,
      };
    }),
    remove: vi.fn(async (_paths: string[]) => {
      return { data: _paths.map((p) => ({ name: p })), error: null };
    }),
    list: vi.fn(async (_prefix?: string) => {
      return { data: [], error: null };
    }),
    getPublicUrl: vi.fn((_path: string) => {
      return {
        data: { publicUrl: `https://mock.supabase.co/public/${_path}` },
      };
    }),
  };
}

// ── Mock supabaseAdmin instance ───────────────────────────────────────

export const mockSupabaseAdmin = {
  auth: {
    getSession: vi.fn(async () => {
      const session = _config.session ?? null;
      return {
        data: { session },
        error: null,
      };
    }),
    getUser: vi.fn(async (_jwt?: string) => {
      const session = _config.session ?? null;
      return {
        data: { user: session?.user ?? null },
        error: session ? null : { message: 'Not authenticated' },
      };
    }),
    admin: {
      getUserById: vi.fn(async (id: string) => {
        return {
          data: {
            user: { id, email: `${id}@test.com` },
          },
          error: null,
        };
      }),
    },
  },
  storage: {
    from: vi.fn((_bucket: string) => createBucketMock()),
  },
};

export type MockSupabaseAdmin = typeof mockSupabaseAdmin;
