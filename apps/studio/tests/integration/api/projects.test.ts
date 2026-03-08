/**
 * T047: Project management API endpoint tests.
 *
 * Tests POST /project/create, GET /project/manifest,
 * and POST /project/:id/files Hono handlers.
 */

// Must be first import — sets up vi.mock() for server singletons
import '../../fixtures/mocks/setup.js';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureMockDb, resetMockDb, mockDb } from '../../fixtures/mocks/db.js';
import {
  createTestApp,
  appRequest,
  getJsonBody,
  defaultUser,
} from './helpers.js';

// Mock project creation utilities
vi.mock('$lib/project/creation-wizard', () => ({
  generateEntryFilePath: vi.fn(
    (title: string) => `${title.toLowerCase().replace(/\s+/g, '-')}.actone`,
  ),
  generateEntrySkeleton: vi.fn((title: string) => `story "${title}" {}\n`),
}));

// Mock snapshot utilities
vi.mock('$lib/project/snapshots', () => ({
  generateSnapshotTag: vi.fn(() => 'snapshot-tag'),
  aggregateStats: vi.fn(() => ({
    wordCount: 100,
    sceneCount: 5,
    characterCount: 3,
  })),
}));

// ── POST /project/create ──────────────────────────────────────────────

describe('POST /project/create', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('creates a project with valid input', async () => {
    configureMockDb({
      insert: [{ id: 'p1', name: 'Test' }],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/create', {
      method: 'POST',
      body: { title: 'Test' },
    });

    expect(response.status).toBe(201);

    const body = await getJsonBody<{ id: string; title: string; entryFilePath: string }>(response);
    expect(body.id).toBe('p1');
    expect(body.title).toBe('Test');  // API returns `title` (mapped from `name`)
    expect(body.entryFilePath).toBe('test.actone');
  });

  it('returns 401 for unauthenticated request', async () => {
    const app = createTestApp(null);
    const response = await appRequest(app, '/project/create', {
      method: 'POST',
      body: { title: 'Test' },
    });

    expect(response.status).toBe(401);
  });

  it('returns 400 for missing title', async () => {
    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/create', {
      method: 'POST',
      body: {},
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 for empty title', async () => {
    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/create', {
      method: 'POST',
      body: { title: '' },
    });

    expect(response.status).toBe(400);
  });

  it('uses default composition mode', async () => {
    configureMockDb({
      insert: [{ id: 'p2', name: 'My Novel' }],
    });

    const app = createTestApp(defaultUser);
    await appRequest(app, '/project/create', {
      method: 'POST',
      body: { title: 'My Novel' },
    });

    // Verify db.insert was called — first call creates the project, second the extension
    expect(mockDb.insert).toHaveBeenCalled();

    // The first insert creates the base project row (name, lifecyclePhase).
    const firstInsertChain = mockDb.insert.mock.results[0]?.value;
    expect(firstInsertChain).toBeDefined();
    expect(firstInsertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: defaultUser.id,
        name: 'My Novel',
        lifecyclePhase: 'concept',
      }),
    );
  });
});

// ── GET /project/manifest ─────────────────────────────────────────────

describe('GET /project/manifest', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('returns project manifest for valid projectId', async () => {
    const now = new Date();
    configureMockDb({
      select: [
        {
          projects: {
            id: 'p1',
            name: 'Test Project',
            grammarVersion: '1.0.0',
            grammarFingerprint: 'abc123',
            lifecyclePhase: 'concept',
            userId: defaultUser.id,
            createdAt: now,
            updatedAt: now,
          },
          actone_project_ext: {
            authorName: 'Author',
            genre: 'Fiction',
            compositionMode: 'merge',
            publishingMode: 'text',
          },
          count: 3,
        },
      ],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/manifest', {
      searchParams: { projectId: 'p1' },
    });

    expect(response.status).toBe(200);

    const body = await getJsonBody<{
      id: string;
      title: string;
      fileCount: number;
    }>(response);
    expect(body.id).toBe('p1');
    expect(body.title).toBe('Test Project');
    expect(body.fileCount).toBe(3);
  });

  it('returns 400 for missing projectId', async () => {
    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/manifest');

    expect(response.status).toBe(400);
  });

  it('returns 404 for non-existent project', async () => {
    configureMockDb({
      select: [],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/manifest', {
      searchParams: { projectId: 'nonexistent' },
    });

    expect(response.status).toBe(404);
  });

  it('returns 403 if user does not own project', async () => {
    const now = new Date();
    configureMockDb({
      select: [
        {
          projects: {
            id: 'p1',
            name: 'Other Project',
            userId: 'other-user-999',
            createdAt: now,
            updatedAt: now,
          },
          actone_project_ext: null,
        },
      ],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/manifest', {
      searchParams: { projectId: 'p1' },
    });

    expect(response.status).toBe(403);
  });
});

// ── POST /project/:id/files ──────────────────────────────────────────

describe('POST /project/:id/files', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('creates a new file', async () => {
    let selectCallCount = 0;
    const projectRow = { id: 'p1', userId: defaultUser.id };
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // First select: project ownership check
        return createSelectChain([projectRow]);
      }
      // Second select: duplicate file check — no existing file
      return createSelectChain([]);
    });

    configureMockDb({
      insert: { id: 'f1' },
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/p1/files', {
      method: 'POST',
      body: {
        action: 'create',
        filePath: 'chapter-1.actone',
        content: 'story "Chapter 1" {}\n',
      },
    });

    expect(response.status).toBe(200);

    const body = await getJsonBody<{ filePath: string; action: string }>(response);
    expect(body.filePath).toBe('chapter-1.actone');
    expect(body.action).toBe('create');
  });

  it('deletes an existing file', async () => {
    let selectCallCount = 0;
    const projectRow = { id: 'p1', userId: defaultUser.id };
    const fileRow = { id: 'f1', isEntry: false };
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return createSelectChain([projectRow]);
      }
      return createSelectChain([fileRow]);
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/p1/files', {
      method: 'POST',
      body: {
        action: 'delete',
        filePath: 'chapter-2.actone',
      },
    });

    expect(response.status).toBe(200);

    const body = await getJsonBody<{ filePath: string; action: string }>(response);
    expect(body.filePath).toBe('chapter-2.actone');
    expect(body.action).toBe('delete');
  });

  it('returns 400 for invalid action', async () => {
    const projectRow = { id: 'p1', userId: defaultUser.id };
    mockDb.select.mockImplementation(() => createSelectChain([projectRow]));

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/p1/files', {
      method: 'POST',
      body: {
        action: 'rename',
        filePath: 'chapter-1.actone',
      },
    });

    expect(response.status).toBe(400);
  });
});

// ── Helper: create a chainable select mock ──────────────────────────

/**
 * Creates a chainable query object that resolves to the given rows,
 * mirroring the mock db's createChainableQuery but with a specific result.
 */
function createSelectChain(rows: unknown[]): Record<string, unknown> {
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

  chain.then = (
    resolve: (v: unknown) => void,
    reject: (e: unknown) => void,
  ) => {
    try {
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  };

  chain[Symbol.toStringTag] = 'Promise';

  return chain;
}
