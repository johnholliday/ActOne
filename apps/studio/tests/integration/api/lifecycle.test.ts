/**
 * T048: Integration tests for POST /project/lifecycle Hono handler.
 *
 * Tests lifecycle stage transitions, snapshot creation, auth checks,
 * validation, and ownership enforcement via sanyam-projects' createProjectRoutes.
 */

import '../../fixtures/mocks/setup.js';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureMockDb, resetMockDb } from '../../fixtures/mocks/db.js';
import {
  createTestApp,
  appRequest,
  getJsonBody,
  defaultUser,
} from './helpers.js';

// ── Shared fixtures ───────────────────────────────────────────────────

const projectId = '00000000-0000-4000-a000-000000000001';

const projectData = {
  id: projectId,
  userId: defaultUser.id,
  name: 'Test Project',
  lifecyclePhase: 'concept',
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
};

// ── Tests ─────────────────────────────────────────────────────────────

describe('POST /project/lifecycle', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('transitions concept -> draft successfully', async () => {
    configureMockDb({
      select: [projectData],
      insert: [{ id: 'snapshot-1' }],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { projectId, targetStage: 'draft' },
    });

    expect(response.status).toBe(200);

    const body = await getJsonBody<{
      previousStage: string;
      currentStage: string;
      snapshotId: string;
    }>(response);

    expect(body.previousStage).toBe('concept');
    expect(body.currentStage).toBe('draft');
  });

  it('returns previousStage and currentStage and snapshotId', async () => {
    configureMockDb({
      select: [projectData],
      insert: [{ id: 'snapshot-42' }],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { projectId, targetStage: 'draft' },
    });

    const body = await getJsonBody<{
      previousStage: string;
      currentStage: string;
      snapshotId: string;
    }>(response);

    expect(body).toEqual({
      previousStage: 'concept',
      currentStage: 'draft',
      snapshotId: 'snapshot-42',
    });
  });

  it('returns 401 for unauthenticated request', async () => {
    const app = createTestApp(null);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { projectId, targetStage: 'draft' },
    });

    expect(response.status).toBe(401);
  });

  it('returns 400 for missing projectId', async () => {
    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { targetStage: 'draft' },
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid targetStage', async () => {
    configureMockDb({
      select: [projectData],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { projectId, targetStage: 'nonexistent' },
    });

    expect(response.status).toBe(400);
  });

  it('returns 404 for non-existent project', async () => {
    configureMockDb({
      select: [],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { projectId, targetStage: 'draft' },
    });

    expect(response.status).toBe(404);
  });

  it('returns 404 for non-owned project (ownership + existence combined)', async () => {
    // sanyam-projects queries WHERE id = ? AND userId = ?, so non-owned → not found
    configureMockDb({
      select: [],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { projectId, targetStage: 'draft' },
    });

    expect(response.status).toBe(404);
  });

  it('returns 400 for invalid transition (concept -> published)', async () => {
    configureMockDb({
      select: [projectData],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { projectId, targetStage: 'published' },
    });

    expect(response.status).toBe(400);
  });
});
