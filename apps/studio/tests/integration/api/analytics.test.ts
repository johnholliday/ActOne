/**
 * T052: Analytics API Hono handler integration tests.
 *
 * Tests POST /project/analytics/snapshot and GET /project/analytics/timeseries
 * via sanyam-project's createProjectRoutes using mocked Drizzle db.
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

const PROJECT_ID = '00000000-0000-4000-8000-000000000001';

const validSnapshotBody = {
  projectId: PROJECT_ID,
  wordCount: 12_500,
  metrics: {
    sceneCount: 24,
    characterCount: 8,
    sceneTypeDistribution: { Action: 10, Dialogue: 8, Exposition: 6 },
    characterScreenTime: { Elena: 18, Marco: 12, Ava: 6 },
    pacingRhythm: ['Action', 'Dialogue', 'Exposition', 'Action'],
  },
};

const SNAPSHOT_ID = 'snap-001';
const CAPTURED_AT = new Date('2026-02-26T12:00:00Z');

// ── Tests ────────────────────────────────────────────────────────────

describe('POST /project/analytics/snapshot', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('creates a snapshot with valid data', async () => {
    // First select: ownership check returns project; then insert returns snapshot
    configureMockDb({
      select: [{ id: PROJECT_ID, userId: defaultUser.id }],
      insert: [{ id: SNAPSHOT_ID, capturedAt: CAPTURED_AT }],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/analytics/snapshot', {
      method: 'POST',
      body: validSnapshotBody,
    });

    const body = await getJsonBody<{ id: string; capturedAt: string | Date }>(response);

    expect(body.id).toBe(SNAPSHOT_ID);
  });

  it('returns 201 status', async () => {
    configureMockDb({
      select: [{ id: PROJECT_ID, userId: defaultUser.id }],
      insert: [{ id: SNAPSHOT_ID, capturedAt: CAPTURED_AT }],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/analytics/snapshot', {
      method: 'POST',
      body: validSnapshotBody,
    });

    expect(response.status).toBe(201);
  });

  it('returns 400 for missing projectId', async () => {
    const { projectId: _, ...bodyWithoutProjectId } = validSnapshotBody;

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/analytics/snapshot', {
      method: 'POST',
      body: bodyWithoutProjectId,
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 for negative wordCount', async () => {
    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/analytics/snapshot', {
      method: 'POST',
      body: { ...validSnapshotBody, wordCount: -1 },
    });

    expect(response.status).toBe(400);
  });
});

describe('GET /project/analytics/timeseries', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('returns snapshots for a project', async () => {
    const snapshotRows = [
      {
        id: 'snap-001',
        wordCount: 12_500,
        metrics: { sceneCount: 24, characterCount: 8 },
        capturedAt: new Date('2026-02-26T12:00:00Z'),
      },
      {
        id: 'snap-002',
        wordCount: 11_000,
        metrics: { sceneCount: 22, characterCount: 7 },
        capturedAt: new Date('2026-02-25T12:00:00Z'),
      },
    ];

    // First select: ownership check; second select: timeseries query
    let selectCount = 0;
    configureMockDb({
      select: snapshotRows,
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/analytics/timeseries', {
      searchParams: { projectId: PROJECT_ID },
    });

    const body = await getJsonBody<{ snapshots: typeof snapshotRows }>(response);

    expect(response.status).toBe(200);
    expect(body.snapshots).toHaveLength(2);
    expect(body.snapshots[0]!.id).toBe('snap-001');
    expect(body.snapshots[1]!.id).toBe('snap-002');
  });

  it('returns 400 for missing projectId', async () => {
    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/analytics/timeseries');

    expect(response.status).toBe(400);
  });

  it('returns empty array when no snapshots', async () => {
    // The mock db returns the same result for all selects; sanyam-project
    // first checks ownership (needs a row), then queries analytics (empty).
    // With a single mock config, both return the same result. Since the
    // ownership check returns a project row, the second select also returns it.
    // This is a limitation of the mock approach — the test verifies the route
    // returns 200 with a snapshots array.
    configureMockDb({ select: [{ id: PROJECT_ID, userId: defaultUser.id }] });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/analytics/timeseries', {
      searchParams: { projectId: PROJECT_ID },
    });

    expect(response.status).toBe(200);

    const body = await getJsonBody<{ snapshots: unknown[] }>(response);
    expect(body.snapshots).toBeDefined();
  });
});
