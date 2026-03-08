import '../../fixtures/mocks/setup.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { loadProjectFromSupabase } from '$lib/stores/project-loader.js';
import {
  mockSupabaseClient,
  configureTable,
  resetMockSupabaseClient,
} from '../../fixtures/mocks/supabase-client.js';
import { createProjectRow } from '../../fixtures/factories.js';

beforeEach(() => {
  resetMockSupabaseClient();
});

describe('loadProjectFromSupabase', () => {
  it('returns project meta and files on happy path', async () => {
    const projectRow = createProjectRow({ id: 'proj-1', name: 'My Novel' });

    configureTable('projects', { data: projectRow, error: null });
    configureTable('project_files', {
      data: [
        { id: 'f1', file_path: 'main.act', is_entry: true, content: 'story {}' },
        { id: 'f2', file_path: 'chars.act', is_entry: false, content: 'character {}' },
      ],
      error: null,
    });

    const result = await loadProjectFromSupabase(
      mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.project.id).toBe('proj-1');
    expect(result.project.title).toBe('My Novel');
    expect(result.files).toHaveLength(2);
    expect(result.files[0]!.filePath).toBe('main.act');
    expect(result.files[0]!.isEntry).toBe(true);
  });

  it('maps columns correctly from new schema with extension data', async () => {
    const projectRow = createProjectRow({
      author_name: 'Jane Austen',
      composition_mode: 'parallel',
      lifecycle_phase: 'revision',
      publishing_mode: 'graphic-novel',
      grammar_version: '2.0.0',
      grammar_fingerprint: 'xyz789',
    });

    configureTable('projects', { data: projectRow, error: null });
    configureTable('project_files', { data: [], error: null });

    const result = await loadProjectFromSupabase(
      mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.project.authorName).toBe('Jane Austen');
    expect(result.project.compositionMode).toBe('parallel');
    expect(result.project.lifecycleStage).toBe('revision');
    expect(result.project.publishingMode).toBe('graphic-novel');
    expect(result.project.grammarVersion).toBe('2.0.0');
    expect(result.project.grammarFingerprint).toBe('xyz789');
  });

  it('maps snake_case columns to camelCase for files', async () => {
    configureTable('projects', { data: createProjectRow(), error: null });
    configureTable('project_files', {
      data: [{ id: 'f1', file_path: 'src/main.act', is_entry: true, content: '...' }],
      error: null,
    });

    const result = await loadProjectFromSupabase(
      mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.files[0]!.filePath).toBe('src/main.act');
    expect(result.files[0]!.isEntry).toBe(true);
  });

  it('returns failure when project query errors', async () => {
    configureTable('projects', { data: null, error: { message: 'db error' } });

    const result = await loadProjectFromSupabase(
      mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient,
    );

    expect(result.success).toBe(false);
  });

  it('returns failure when no project exists (null data)', async () => {
    configureTable('projects', { data: null, error: null });

    const result = await loadProjectFromSupabase(
      mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient,
    );

    expect(result.success).toBe(false);
  });

  it('returns failure when files query errors', async () => {
    configureTable('projects', { data: createProjectRow(), error: null });
    configureTable('project_files', { data: null, error: { message: 'files error' } });

    const result = await loadProjectFromSupabase(
      mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient,
    );

    expect(result.success).toBe(false);
  });

  it('returns empty files when fileRows is null', async () => {
    configureTable('projects', { data: createProjectRow(), error: null });
    configureTable('project_files', { data: null, error: null });

    const result = await loadProjectFromSupabase(
      mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient,
    );

    // fileRows is null but no error — should succeed with empty files
    // The code checks for filesError first, then uses (fileRows ?? [])
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.files).toEqual([]);
  });
});
