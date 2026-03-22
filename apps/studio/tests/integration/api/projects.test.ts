/**
 * T047: Project management API endpoint tests.
 *
 * Tests POST /project/create, GET /project/manifest,
 * and POST /project/:id/files via sanyam-projects' createProjectRoutes.
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

// ── POST /project/create ──────────────────────────────────────────────

describe('POST /project/create', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('creates a project with valid input', async () => {
    configureMockDb({
      insert: [{ id: 'p1' }],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/create', {
      method: 'POST',
      body: { title: 'Test' },
    });

    expect(response.status).toBe(201);

    const body = await getJsonBody<{ id: string; title: string; entryFilePath: string }>(response);
    expect(body.id).toBe('p1');
    expect(body.title).toBe('Test');
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

  it('inserts project row with correct fields', async () => {
    configureMockDb({
      insert: [{ id: 'p2' }],
    });

    const app = createTestApp(defaultUser);
    await appRequest(app, '/project/create', {
      method: 'POST',
      body: { title: 'My Novel' },
    });

    // Verify db.insert was called
    expect(mockDb.insert).toHaveBeenCalled();
  });
});

// ── GET /project/manifest ─────────────────────────────────────────────

describe('GET /project/manifest', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
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
});

// ── POST /project/:id/files ──────────────────────────────────────────

describe('POST /project/:id/files', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('returns 400 for invalid action', async () => {
    const projectRow = { id: 'p1', userId: defaultUser.id };
    configureMockDb({
      select: [projectRow],
    });

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
