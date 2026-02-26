/**
 * T047: Project management API endpoint tests.
 *
 * Tests POST /api/project/create, GET /api/project/manifest,
 * and POST /api/project/[id]/files handlers.
 */

// Must be first import — sets up vi.mock() for server singletons
import '../../fixtures/mocks/setup.js';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureMockDb, resetMockDb, mockDb } from '../../fixtures/mocks/db.js';
import {
  createAuthenticatedEvent,
  createUnauthenticatedEvent,
  getJsonBody,
  expectHttpError,
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

import { POST as createProject } from '$routes/api/project/create/+server.js';
import { GET as getManifest } from '$routes/api/project/manifest/+server.js';
import { POST as manageFiles } from '$routes/api/project/[id]/files/+server.js';

// ── POST /api/project/create ────────────────────────────────────────

describe('POST /api/project/create', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('creates a project with valid input', async () => {
    configureMockDb({
      insert: [{ id: 'p1', title: 'Test' }],
    });

    const event = createAuthenticatedEvent({
      method: 'POST',
      body: { title: 'Test' },
    });

    const response = await createProject(event);
    expect(response.status).toBe(201);

    const body = await getJsonBody<{ id: string; title: string; entryFilePath: string }>(response);
    expect(body.id).toBe('p1');
    expect(body.title).toBe('Test');
    expect(body.entryFilePath).toBe('test.actone');
  });

  it('returns 401 for unauthenticated request', async () => {
    const event = createUnauthenticatedEvent({
      method: 'POST',
      body: { title: 'Test' },
    });

    await expectHttpError(() => createProject(event), 401);
  });

  it('returns 400 for missing title', async () => {
    const event = createAuthenticatedEvent({
      method: 'POST',
      body: {},
    });

    await expectHttpError(() => createProject(event), 400);
  });

  it('returns 400 for empty title', async () => {
    const event = createAuthenticatedEvent({
      method: 'POST',
      body: { title: '' },
    });

    await expectHttpError(() => createProject(event), 400);
  });

  it('uses default composition mode', async () => {
    configureMockDb({
      insert: [{ id: 'p2', title: 'My Novel' }],
    });

    const event = createAuthenticatedEvent({
      method: 'POST',
      body: { title: 'My Novel' },
    });

    await createProject(event);

    // Verify db.insert was called — first call creates the project
    expect(mockDb.insert).toHaveBeenCalled();

    // The first insert call creates the project row.
    // The chainable .values() receives the project data including compositionMode.
    const firstInsertChain = mockDb.insert.mock.results[0]?.value;
    expect(firstInsertChain).toBeDefined();
    expect(firstInsertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        compositionMode: 'merge',
        userId: defaultUser.id,
        title: 'My Novel',
      }),
    );
  });
});

// ── GET /api/project/manifest ───────────────────────────────────────

describe('GET /api/project/manifest', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('returns project manifest for valid projectId', async () => {
    const now = new Date();
    configureMockDb({
      select: [
        {
          id: 'p1',
          title: 'Test Project',
          authorName: 'Author',
          genre: 'Fiction',
          grammarVersion: '1.0.0',
          grammarFingerprint: 'abc123',
          compositionMode: 'merge',
          lifecycleStage: 'concept',
          publishingMode: 'text',
          userId: defaultUser.id,
          createdAt: now,
          modifiedAt: now,
          count: 3,
        },
      ],
    });

    const event = createAuthenticatedEvent({
      method: 'GET',
      searchParams: { projectId: 'p1' },
    });

    const response = await getManifest(event);
    expect(response.status).toBe(200);

    const body = await getJsonBody<{
      id: string;
      title: string;
      fileCount: number;
    }>(response);
    expect(body.id).toBe('p1');
    expect(body.title).toBe('Test Project');
    // fileCount comes from the second select query which also resolves
    // to the same _config.select array. The handler destructures [fileCountResult]
    // and reads fileCountResult.count.
    expect(body.fileCount).toBe(3);
  });

  it('returns 400 for missing projectId', async () => {
    const event = createAuthenticatedEvent({
      method: 'GET',
      searchParams: {},
    });

    await expectHttpError(() => getManifest(event), 400);
  });

  it('returns 404 for non-existent project', async () => {
    configureMockDb({
      select: [],
    });

    const event = createAuthenticatedEvent({
      method: 'GET',
      searchParams: { projectId: 'nonexistent' },
    });

    await expectHttpError(() => getManifest(event), 404);
  });

  it('returns 403 if user does not own project', async () => {
    const now = new Date();
    configureMockDb({
      select: [
        {
          id: 'p1',
          title: 'Other Project',
          userId: 'other-user-999',
          createdAt: now,
          modifiedAt: now,
        },
      ],
    });

    const event = createAuthenticatedEvent({
      method: 'GET',
      searchParams: { projectId: 'p1' },
    });

    await expectHttpError(() => getManifest(event), 403);
  });
});

// ── POST /api/project/[id]/files ────────────────────────────────────

describe('POST /api/project/[id]/files', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('creates a new file', async () => {
    // The select mock returns the project (for ownership check).
    // The second select (duplicate check) also returns this same array,
    // but since the handler checks for an existing file with the same path
    // and destructures [existing], the first element will be treated as
    // the "existing" file. To avoid a false 409, we need the select to
    // return the project for the first call and empty for the second.
    //
    // Since the mock always returns the same array, we configure it with
    // the project data. The handler's duplicate-check select will see the
    // project object (which has id/userId but not filePath-specific fields),
    // which means [existing] will be truthy and trigger a 409.
    //
    // To work around this, we use the fact that the mock's select always
    // returns the same value. We need to set up the select to return the
    // project for the ownership check. For the duplicate check, the handler
    // also gets [existing] from the same select result. Since we can't
    // differentiate calls, we set select to return a project-like object
    // with `id` and `userId` that satisfies ownership but the handler
    // treats the existence of [existing] as a duplicate.
    //
    // The practical approach: configure select to return the project for
    // ownership. The files handler first checks project ownership, then
    // checks for duplicate. Both selects return the same array. To avoid
    // the 409, we override mockDb.select to return different values on
    // successive calls.
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

    const event = createAuthenticatedEvent({
      method: 'POST',
      params: { id: 'p1' },
      body: {
        action: 'create',
        filePath: 'chapter-1.actone',
        content: 'story "Chapter 1" {}\n',
      },
    });

    const response = await manageFiles(event);
    expect(response.status).toBe(200);

    const body = await getJsonBody<{ filePath: string; action: string }>(response);
    expect(body.filePath).toBe('chapter-1.actone');
    expect(body.action).toBe('create');
  });

  it('deletes an existing file', async () => {
    // First select: project ownership check
    // Second select: file lookup (needs id and isEntry)
    let selectCallCount = 0;
    const projectRow = { id: 'p1', userId: defaultUser.id };
    const fileRow = { id: 'f1', isEntry: false };
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return createSelectChain([projectRow]);
      }
      // Second select: the file to delete
      return createSelectChain([fileRow]);
    });

    const event = createAuthenticatedEvent({
      method: 'POST',
      params: { id: 'p1' },
      body: {
        action: 'delete',
        filePath: 'chapter-2.actone',
      },
    });

    const response = await manageFiles(event);
    expect(response.status).toBe(200);

    const body = await getJsonBody<{ filePath: string; action: string }>(response);
    expect(body.filePath).toBe('chapter-2.actone');
    expect(body.action).toBe('delete');
  });

  it('returns 400 for invalid action', async () => {
    // Ownership check must pass before body validation (Zod) runs.
    // Use mockImplementation to ensure the select mock is fresh.
    const projectRow = { id: 'p1', userId: defaultUser.id };
    mockDb.select.mockImplementation(() => createSelectChain([projectRow]));

    const event = createAuthenticatedEvent({
      method: 'POST',
      params: { id: 'p1' },
      body: {
        action: 'rename',
        filePath: 'chapter-1.actone',
      },
    });

    await expectHttpError(() => manageFiles(event), 400);
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
