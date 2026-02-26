/**
 * T053: Integration tests for publishing endpoints.
 *
 * Tests:
 *   GET  /api/publishing/dependencies — check publishing readiness
 *   GET  /api/publishing/preview      — HTML manuscript preview
 *   POST /api/publishing/export       — generate and upload export files
 */

import '../../fixtures/mocks/setup.js';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureMockDb, resetMockDb } from '../../fixtures/mocks/db.js';
import { configureMockSupabase, resetMockSupabase } from '../../fixtures/mocks/supabase.js';
import {
  createFakeEvent,
  getJsonBody,
  expectHttpError,
} from './helpers.js';

import { GET as getDependencies } from '$routes/api/publishing/dependencies/+server.js';
import { GET as getPreview } from '$routes/api/publishing/preview/+server.js';
import { POST as exportProject } from '$routes/api/publishing/export/+server.js';

// ── Mock publishing utilities ───────────────────────────────────────

vi.mock('$lib/publishing/manuscript-assembler', () => ({
  assembleManuscript: vi.fn(() => ({
    title: 'Test Story',
    author: 'Test Author',
    frontMatter: {
      halfTitle: 'Test',
      titlePage: { title: 'Test Story', author: 'Test Author' },
      copyright: '© 2025',
      tableOfContents: [{ title: 'Chapter 1', index: 1 }],
    },
    chapters: [
      {
        title: 'Chapter 1',
        sceneName: 'TestScene',
        paragraphs: ['Test content.'],
      },
    ],
    backMatter: { authorBio: 'Test bio', acknowledgments: '' },
    wordCount: 100,
  })),
}));

vi.mock('$lib/publishing/html-preview', () => ({
  generateHtmlPreview: vi.fn(
    () =>
      '<!DOCTYPE html><html><head><title>Test Story</title></head><body><h1>Test Story</h1><p>Test content.</p></body></html>',
  ),
}));

vi.mock('$lib/publishing/epub-generator', () => ({
  generateEpubFiles: vi.fn(() => [
    { path: 'mimetype', content: 'application/epub+zip' },
    { path: 'META-INF/container.xml', content: '<xml/>' },
    { path: 'content.opf', content: '<xml/>' },
    { path: 'nav.xhtml', content: '<html/>' },
    { path: 'chapter1.xhtml', content: '<html/>' },
  ]),
}));

vi.mock('$lib/publishing/docx-generator', () => ({
  generateDocxSections: vi.fn(() => [
    { type: 'title', heading: 'Test Story', paragraphs: [] },
    { type: 'chapter', heading: 'Chapter 1', paragraphs: ['Test content.'] },
  ]),
  DOCX_FORMAT: { fontSize: 24, fontFamily: 'Times New Roman', lineSpacing: 480 },
}));

vi.mock('$lib/publishing/pdf-generator', () => ({
  generatePdfStructure: vi.fn(() => ({
    pages: [{ type: 'title' }, { type: 'content' }],
    config: { trimWidth: 6, trimHeight: 9 },
  })),
  TRIM_SIZES: [
    { width: 5.0, height: 8.0, name: '5" x 8"' },
    { width: 5.5, height: 8.5, name: '5.5" x 8.5"' },
    { width: 6.0, height: 9.0, name: '6" x 9"' },
    { width: 6.14, height: 9.21, name: '6.14" x 9.21" (A5)' },
    { width: 8.5, height: 11.0, name: '8.5" x 11" (Letter)' },
  ],
}));

// ── Fixtures ────────────────────────────────────────────────────────

const projectId = '00000000-0000-0000-0000-000000000001';

const fakeProject = {
  id: projectId,
  title: 'Test Story',
  authorName: 'Test Author',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const fakeAcceptedDraft = {
  id: 'draft-1',
  projectId,
  sceneName: 'TestScene',
  paragraphIndex: 0,
  content: 'Test content for the scene.',
  status: 'accepted',
  backend: 'claude-api',
  model: 'claude-sonnet-4-6',
  temperature: 0.8,
  tokenCount: 50,
  costUsd: 0.001,
  createdAt: new Date('2026-01-15'),
};

const fakeSourceFile = {
  id: 'file-1',
  projectId,
  name: 'story.act1',
  content: 'scene "TestScene" { objective: "Test" }',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const fakeCoverAsset = {
  id: 'asset-1',
  projectId,
  type: 'cover',
  status: 'approved',
  name: 'cover.png',
  storagePath: 'assets/cover.png',
  createdAt: new Date('2026-01-10'),
};

// ── GET /api/publishing/dependencies ────────────────────────────────

describe('GET /api/publishing/dependencies', () => {
  beforeEach(() => {
    resetMockDb();
    resetMockSupabase();
    vi.clearAllMocks();
  });

  it('returns ready: true when all scenes have accepted drafts', async () => {
    // The dependencies endpoint makes 3 sequential db.select() calls.
    // Since our mock always returns the same array, we combine draft + source
    // data but omit the cover asset to avoid `status` collision
    // (fakeAcceptedDraft.status='accepted' vs fakeCoverAsset.status='approved').
    configureMockDb({
      select: [
        {
          ...fakeAcceptedDraft,
          ...fakeSourceFile,
        },
      ],
    });

    const event = createFakeEvent({
      searchParams: { projectId },
    });

    const response = await getDependencies(event);
    expect(response.status).toBe(200);

    const body = await getJsonBody<{
      ready: boolean;
      acceptedSceneCount: number;
      totalSceneCount: number;
      wordCount: number;
      missingScenes: string[];
      hasCoverImage: boolean;
    }>(response);

    expect(body).toHaveProperty('ready');
    expect(body).toHaveProperty('acceptedSceneCount');
    expect(body).toHaveProperty('totalSceneCount');
    expect(body).toHaveProperty('wordCount');
    expect(body).toHaveProperty('missingScenes');
    expect(body).toHaveProperty('hasCoverImage');

    // With our combined mock data, the scene "TestScene" is both defined in
    // source content and has an accepted draft, so ready should be true
    expect(body.ready).toBe(true);
    expect(body.missingScenes).toEqual([]);
    expect(body.acceptedSceneCount).toBe(1);
    expect(body.totalSceneCount).toBe(1);
    expect(typeof body.wordCount).toBe('number');
    // Cover asset data omitted from combined mock to avoid status collision
    expect(typeof body.hasCoverImage).toBe('boolean');
  });

  it('returns 400 for missing projectId', async () => {
    const event = createFakeEvent();

    await expectHttpError(() => getDependencies(event), 400);
  });

  it('returns ready: false with missing scenes', async () => {
    // Source file defines two scenes but only one has an accepted draft.
    // The mock returns the same array for all selects, so we embed both
    // source content (with 2 scenes) and draft info (for 1 scene).
    const sourceWithTwoScenes = {
      ...fakeAcceptedDraft,
      content: 'scene "TestScene" { } scene "MissingScene" { }',
      type: 'cover',
      status: 'accepted',
    };

    configureMockDb({
      select: [sourceWithTwoScenes],
    });

    const event = createFakeEvent({
      searchParams: { projectId },
    });

    const response = await getDependencies(event);
    expect(response.status).toBe(200);

    const body = await getJsonBody<{
      ready: boolean;
      acceptedSceneCount: number;
      totalSceneCount: number;
      missingScenes: string[];
    }>(response);

    expect(body.ready).toBe(false);
    expect(body.totalSceneCount).toBe(2);
    expect(body.missingScenes).toContain('MissingScene');
  });
});

// ── GET /api/publishing/preview ─────────────────────────────────────

describe('GET /api/publishing/preview', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('returns HTML preview', async () => {
    // The preview endpoint makes 3 selects: project, drafts, source files.
    // We provide a merged object that satisfies all three queries.
    configureMockDb({
      select: [
        {
          ...fakeProject,
          ...fakeAcceptedDraft,
          ...fakeSourceFile,
        },
      ],
    });

    const event = createFakeEvent({
      searchParams: { projectId },
    });

    const response = await getPreview(event);
    expect(response.status).toBe(200);

    const contentType = response.headers.get('Content-Type');
    expect(contentType).toContain('text/html');

    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Test Story');
  });

  it('returns 400 for missing projectId', async () => {
    const event = createFakeEvent();

    await expectHttpError(() => getPreview(event), 400);
  });
});

// ── POST /api/publishing/export ─────────────────────────────────────

describe('POST /api/publishing/export', () => {
  beforeEach(() => {
    resetMockDb();
    resetMockSupabase();
    vi.clearAllMocks();
  });

  it('exports in requested formats', async () => {
    // The export endpoint makes 3 selects: project, drafts, source files.
    // Then uploads each format to Supabase Storage.
    configureMockDb({
      select: [
        {
          ...fakeProject,
          ...fakeAcceptedDraft,
          ...fakeSourceFile,
        },
      ],
    });

    configureMockSupabase({
      uploadResult: { path: 'exports/test.epub', id: 'upload-1' },
      signedUrl: 'https://mock.supabase.co/signed/exports/test.epub',
    });

    const event = createFakeEvent({
      method: 'POST',
      body: {
        projectId,
        formats: ['epub', 'docx'],
      },
    });

    const response = await exportProject(event);
    expect(response.status).toBe(200);

    const body = await getJsonBody<{
      exports: Array<{
        format: string;
        fileSize: number;
        storagePath: string;
        downloadUrl: string;
      }>;
    }>(response);

    expect(body.exports).toBeInstanceOf(Array);
    expect(body.exports).toHaveLength(2);

    const formats = body.exports.map((e) => e.format);
    expect(formats).toContain('epub');
    expect(formats).toContain('docx');

    for (const exp of body.exports) {
      expect(exp.fileSize).toBeGreaterThan(0);
      expect(exp.storagePath).toBeTruthy();
      expect(exp.downloadUrl).toBeTruthy();
    }
  });

  it('returns 400 for missing projectId', async () => {
    const event = createFakeEvent({
      method: 'POST',
      body: {
        formats: ['epub'],
      },
    });

    await expectHttpError(() => exportProject(event), 400);
  });

  it('returns 400 for empty formats array', async () => {
    const event = createFakeEvent({
      method: 'POST',
      body: {
        projectId,
        formats: [],
      },
    });

    await expectHttpError(() => exportProject(event), 400);
  });
});
