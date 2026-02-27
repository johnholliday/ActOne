import '../../fixtures/mocks/setup.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { load } from '$routes/+layout.server.js';
import { createLayoutLoadEvent } from '../../fixtures/mocks/load-event.js';
import { createProjectRow } from '../../fixtures/factories.js';
import { resetMockSupabaseClient } from '../../fixtures/mocks/supabase-client.js';

beforeEach(() => {
  resetMockSupabaseClient();
});

describe('+layout.server.ts load', () => {
  it('returns null session and empty projects when no session', async () => {
    const event = createLayoutLoadEvent({ session: null });
    const result = await (load as (e: unknown) => Promise<unknown>)(event) as {
      session: unknown;
      projects: unknown[];
    };

    expect(result.session).toBeNull();
    expect(result.projects).toEqual([]);
  });

  it('returns session and projects for authenticated user', async () => {
    const projects = [
      createProjectRow({ id: 'p1', modified_at: '2026-02-01T00:00:00Z' }),
      createProjectRow({ id: 'p2', modified_at: '2026-01-01T00:00:00Z' }),
    ];

    const event = createLayoutLoadEvent({
      session: { user: { id: 'user-1', email: 'test@example.com' } },
      supabaseConfig: {
        projects: { data: projects, error: null },
      },
    });

    const result = await (load as (e: unknown) => Promise<unknown>)(event) as {
      session: unknown;
      projects: unknown[];
    };

    expect(result.session).toBeTruthy();
    expect(result.projects).toHaveLength(2);
    expect((result.projects[0] as Record<string, unknown>).id).toBe('p1');
  });

  it('returns empty projects when Supabase query returns null data', async () => {
    const event = createLayoutLoadEvent({
      session: { user: { id: 'user-1' } },
      supabaseConfig: {
        projects: { data: null, error: null },
      },
    });

    const result = await (load as (e: unknown) => Promise<unknown>)(event) as {
      session: unknown;
      projects: unknown[];
    };

    expect(result.session).toBeTruthy();
    expect(result.projects).toEqual([]);
  });

  it('returns empty projects when Supabase query errors', async () => {
    const event = createLayoutLoadEvent({
      session: { user: { id: 'user-1' } },
      supabaseConfig: {
        projects: { data: null, error: { message: 'connection refused' } },
      },
    });

    const result = await (load as (e: unknown) => Promise<unknown>)(event) as {
      session: unknown;
      projects: unknown[];
    };

    // The layout destructures { data: projects } so if error is set but
    // data is null, projects ?? [] gives [].
    expect(result.projects).toEqual([]);
  });
});
