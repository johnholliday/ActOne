import '../../fixtures/mocks/setup.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load } from '$routes/gallery/+page.server.js';
import { createPageLoadEvent } from '../../fixtures/mocks/load-event.js';
import { createProjectRow, createAssetRow } from '../../fixtures/factories.js';
import { resetMockSupabaseClient } from '../../fixtures/mocks/supabase-client.js';

beforeEach(() => {
  resetMockSupabaseClient();
});

type LoadResult = { assets: Array<Record<string, unknown>> };
const callLoad = (event: unknown) =>
  (load as (e: unknown) => Promise<unknown>)(event) as Promise<LoadResult>;

describe('gallery/+page.server.ts load', () => {
  it('returns empty assets when session is null', async () => {
    const event = createPageLoadEvent({
      parentData: { session: null, projects: [] },
    });

    const result = await callLoad(event);
    expect(result.assets).toEqual([]);
  });

  it('returns empty assets when projects array is empty', async () => {
    const event = createPageLoadEvent({
      parentData: {
        session: { user: { id: 'u1' } },
        projects: [],
      },
    });

    const result = await callLoad(event);
    expect(result.assets).toEqual([]);
  });

  it('uses first project ID when no search param', async () => {
    const projects = [
      createProjectRow({ id: 'proj-first' }),
      createProjectRow({ id: 'proj-second' }),
    ];

    const assetRows = [createAssetRow({ project_id: 'proj-first' })];

    const event = createPageLoadEvent({
      parentData: {
        session: { user: { id: 'u1' } },
        projects,
      },
      supabaseConfig: {
        assets: { data: assetRows, error: null },
      },
    });

    const result = await callLoad(event);
    expect(result.assets).toHaveLength(1);
  });

  it('uses projectId from search params when provided', async () => {
    const projects = [createProjectRow({ id: 'proj-first' })];
    const assetRows = [createAssetRow({ project_id: 'proj-custom' })];

    const event = createPageLoadEvent({
      parentData: {
        session: { user: { id: 'u1' } },
        projects,
      },
      searchParams: { projectId: 'proj-custom' },
      supabaseConfig: {
        assets: { data: assetRows, error: null },
      },
    });

    const result = await callLoad(event);
    expect(result.assets).toHaveLength(1);
  });

  it('maps snake_case rows to camelCase', async () => {
    const row = createAssetRow({
      id: 'a1',
      type: 'scene',
      name: 'Battle Scene',
      status: 'approved',
      prompt: 'epic battle',
      backend: 'dall-e-3',
      metadata: { imageUrl: 'https://cdn.example.com/battle.png' },
      created_at: '2026-02-15T10:00:00Z',
    });

    const event = createPageLoadEvent({
      parentData: {
        session: { user: { id: 'u1' } },
        projects: [createProjectRow()],
      },
      supabaseConfig: {
        assets: { data: [row], error: null },
      },
    });

    const result = await callLoad(event);
    const asset = result.assets[0]!;

    expect(asset.id).toBe('a1');
    expect(asset.type).toBe('scene');
    expect(asset.label).toBe('Battle Scene');
    expect(asset.storageUrl).toBe('https://cdn.example.com/battle.png');
    expect(asset.status).toBe('approved');
    expect(asset.createdAt).toBe('2026-02-15T10:00:00Z');
    expect(asset.prompt).toBe('epic battle');
    expect(asset.backend).toBe('dall-e-3');
  });

  it('handles null metadata as empty storageUrl', async () => {
    const row = createAssetRow({ metadata: null });

    const event = createPageLoadEvent({
      parentData: {
        session: { user: { id: 'u1' } },
        projects: [createProjectRow()],
      },
      supabaseConfig: {
        assets: { data: [row], error: null },
      },
    });

    const result = await callLoad(event);
    expect(result.assets[0]!.storageUrl).toBe('');
  });

  it('handles metadata without imageUrl as empty storageUrl', async () => {
    const row = createAssetRow({ metadata: { width: 1024 } });

    const event = createPageLoadEvent({
      parentData: {
        session: { user: { id: 'u1' } },
        projects: [createProjectRow()],
      },
      supabaseConfig: {
        assets: { data: [row], error: null },
      },
    });

    const result = await callLoad(event);
    expect(result.assets[0]!.storageUrl).toBe('');
  });

  it('returns empty assets and logs error on query failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const event = createPageLoadEvent({
      parentData: {
        session: { user: { id: 'u1' } },
        projects: [createProjectRow()],
      },
      supabaseConfig: {
        assets: { data: null, error: { message: 'permission denied' } },
      },
    });

    const result = await callLoad(event);
    expect(result.assets).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load gallery assets:',
      'permission denied',
    );

    consoleSpy.mockRestore();
  });

  it('returns empty assets when assetRows is null (no error)', async () => {
    const event = createPageLoadEvent({
      parentData: {
        session: { user: { id: 'u1' } },
        projects: [createProjectRow()],
      },
      supabaseConfig: {
        assets: { data: null, error: null },
      },
    });

    const result = await callLoad(event);
    expect(result.assets).toEqual([]);
  });
});
