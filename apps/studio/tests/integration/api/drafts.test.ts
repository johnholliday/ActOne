/**
 * T051: Integration tests for draft management Hono handlers.
 *
 * - GET /draft/list
 * - PUT /draft/update
 */

import '../../fixtures/mocks/setup.js';

import { describe, it, expect, beforeEach } from 'vitest';
import { configureMockDb, resetMockDb } from '../../fixtures/mocks/db.js';
import {
  createTestApp,
  appRequest,
  getJsonBody,
  defaultUser,
} from './helpers.js';

// ── Fixtures ─────────────────────────────────────────────────────────

const fakeDrafts = [
  {
    id: 'draft-1',
    projectId: 'p1',
    sceneName: 'Scene 1',
    status: 'pending',
    content: 'Draft content one',
    createdAt: '2026-02-20T00:00:00Z',
  },
  {
    id: 'draft-2',
    projectId: 'p1',
    sceneName: 'Scene 2',
    status: 'editing',
    content: 'Draft content two',
    createdAt: '2026-02-19T00:00:00Z',
  },
];

// ── Tests ────────────────────────────────────────────────────────────

describe('GET /draft/list', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('returns drafts for a project', async () => {
    configureMockDb({ select: fakeDrafts });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/draft/list', {
      searchParams: { projectId: 'p1' },
    });

    expect(response.status).toBe(200);

    const body = await getJsonBody<typeof fakeDrafts>(response);
    expect(body).toEqual(fakeDrafts);
    expect(body).toHaveLength(2);
  });

  it('returns 400 for missing projectId', async () => {
    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/draft/list');

    expect(response.status).toBe(400);
  });

  it('filters by sceneName when provided', async () => {
    const filtered = [fakeDrafts[0]];
    configureMockDb({ select: filtered });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/draft/list', {
      searchParams: { projectId: 'p1', sceneName: 'Scene 1' },
    });

    expect(response.status).toBe(200);

    const body = await getJsonBody<typeof filtered>(response);
    expect(body).toEqual(filtered);
    expect(body).toHaveLength(1);
  });

  it('returns empty array for no drafts', async () => {
    configureMockDb({ select: [] });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/draft/list', {
      searchParams: { projectId: 'p1' },
    });

    expect(response.status).toBe(200);

    const body = await getJsonBody<unknown[]>(response);
    expect(body).toEqual([]);
    expect(body).toHaveLength(0);
  });
});

describe('PUT /draft/update', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('updates draft status to accepted', async () => {
    configureMockDb({
      update: [{ id: 'draft-1', status: 'accepted' }],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/draft/update', {
      method: 'PUT',
      body: {
        draftId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'accepted',
      },
    });

    expect(response.status).toBe(200);

    const body = await getJsonBody<{ id: string; status: string }>(response);
    expect(body).toEqual({ id: 'draft-1', status: 'accepted' });
  });

  it('returns 400 for missing draftId', async () => {
    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/draft/update', {
      method: 'PUT',
      body: {},
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid status', async () => {
    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/draft/update', {
      method: 'PUT',
      body: {
        draftId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'invalid',
      },
    });

    expect(response.status).toBe(400);
  });
});
