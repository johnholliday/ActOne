/**
 * T052: Analytics API endpoint integration tests.
 *
 * Tests POST /api/analytics/snapshot and GET /api/analytics/timeseries
 * using mocked Drizzle db.
 */

import '../../fixtures/mocks/setup.js';

import { describe, it, expect, beforeEach } from 'vitest';
import { configureMockDb, resetMockDb } from '../../fixtures/mocks/db.js';
import {
  createFakeEvent,
  getJsonBody,
  expectHttpError,
} from './helpers.js';

import { POST as createSnapshot } from '$routes/api/analytics/snapshot/+server.js';
import { GET as getTimeseries } from '$routes/api/analytics/timeseries/+server.js';

// ── Fixtures ─────────────────────────────────────────────────────────

const PROJECT_ID = '00000000-0000-4000-8000-000000000001';

const validSnapshotBody = {
  projectId: PROJECT_ID,
  wordCount: 12_500,
  sceneCount: 24,
  characterCount: 8,
  metrics: {
    sceneTypeDistribution: { Action: 10, Dialogue: 8, Exposition: 6 },
    characterScreenTime: { Elena: 18, Marco: 12, Ava: 6 },
    pacingRhythm: ['Action', 'Dialogue', 'Exposition', 'Action'],
  },
};

const SNAPSHOT_ID = 'snap-001';
const CAPTURED_AT = new Date('2026-02-26T12:00:00Z');

// ── Tests ────────────────────────────────────────────────────────────

describe('POST /api/analytics/snapshot', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('creates a snapshot with valid data', async () => {
    configureMockDb({
      insert: [{ id: SNAPSHOT_ID, capturedAt: CAPTURED_AT }],
    });

    const event = createFakeEvent({
      method: 'POST',
      body: validSnapshotBody,
    });

    const response = await createSnapshot(event);
    const body = await getJsonBody<{ id: string; capturedAt: string }>(response);

    expect(body.id).toBe(SNAPSHOT_ID);
    expect(body.capturedAt).toBe(CAPTURED_AT.toISOString());
  });

  it('returns 201 status', async () => {
    configureMockDb({
      insert: [{ id: SNAPSHOT_ID, capturedAt: CAPTURED_AT }],
    });

    const event = createFakeEvent({
      method: 'POST',
      body: validSnapshotBody,
    });

    const response = await createSnapshot(event);

    expect(response.status).toBe(201);
  });

  it('returns 400 for missing projectId', async () => {
    const { projectId: _, ...bodyWithoutProjectId } = validSnapshotBody;

    const event = createFakeEvent({
      method: 'POST',
      body: bodyWithoutProjectId,
    });

    await expectHttpError(() => createSnapshot(event), 400);
  });

  it('returns 400 for negative wordCount', async () => {
    const event = createFakeEvent({
      method: 'POST',
      body: { ...validSnapshotBody, wordCount: -1 },
    });

    await expectHttpError(() => createSnapshot(event), 400);
  });
});

describe('GET /api/analytics/timeseries', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('returns snapshots for a project', async () => {
    const snapshotRows = [
      {
        id: 'snap-001',
        projectId: PROJECT_ID,
        wordCount: 12_500,
        sceneCount: 24,
        characterCount: 8,
        metrics: {},
        capturedAt: new Date('2026-02-26T12:00:00Z'),
      },
      {
        id: 'snap-002',
        projectId: PROJECT_ID,
        wordCount: 11_000,
        sceneCount: 22,
        characterCount: 7,
        metrics: {},
        capturedAt: new Date('2026-02-25T12:00:00Z'),
      },
    ];

    configureMockDb({ select: snapshotRows });

    const event = createFakeEvent({
      method: 'GET',
      searchParams: { projectId: PROJECT_ID },
    });

    const response = await getTimeseries(event);
    const body = await getJsonBody<{ snapshots: typeof snapshotRows }>(response);

    expect(response.status).toBe(200);
    expect(body.snapshots).toHaveLength(2);
    expect(body.snapshots[0]!.id).toBe('snap-001');
    expect(body.snapshots[1]!.id).toBe('snap-002');
  });

  it('returns 400 for missing projectId', async () => {
    const event = createFakeEvent({
      method: 'GET',
      searchParams: {},
    });

    await expectHttpError(() => getTimeseries(event), 400);
  });

  it('returns empty array when no snapshots', async () => {
    configureMockDb({ select: [] });

    const event = createFakeEvent({
      method: 'GET',
      searchParams: { projectId: PROJECT_ID },
    });

    const response = await getTimeseries(event);
    const body = await getJsonBody<{ snapshots: unknown[] }>(response);

    expect(response.status).toBe(200);
    expect(body.snapshots).toEqual([]);
  });

  it('respects limit parameter', async () => {
    const snapshotRows = Array.from({ length: 5 }, (_, i) => ({
      id: `snap-${String(i + 1).padStart(3, '0')}`,
      projectId: PROJECT_ID,
      wordCount: 10_000 + i * 500,
      sceneCount: 20 + i,
      characterCount: 5 + i,
      metrics: {},
      capturedAt: new Date(`2026-02-${String(26 - i).padStart(2, '0')}T12:00:00Z`),
    }));

    configureMockDb({ select: snapshotRows });

    const event = createFakeEvent({
      method: 'GET',
      searchParams: { projectId: PROJECT_ID, limit: '5' },
    });

    const response = await getTimeseries(event);
    const body = await getJsonBody<{ snapshots: typeof snapshotRows }>(response);

    expect(response.status).toBe(200);
    expect(body.snapshots).toHaveLength(5);
  });
});
