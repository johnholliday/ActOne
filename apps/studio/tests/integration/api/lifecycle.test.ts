/**
 * T048: Integration tests for POST /project/lifecycle Hono handler.
 *
 * Tests lifecycle stage transitions, snapshot creation, auth checks,
 * validation, and ownership enforcement.
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

vi.mock('$lib/project/snapshots', () => ({
  generateSnapshotTag: vi.fn(() => 'snapshot-v1'),
  aggregateStats: vi.fn(() => ({ wordCount: 100, sceneCount: 5, characterCount: 3 })),
}));

/**
 * Mock @actone/shared so we can control isValidTransition per-test.
 * vi.hoisted() ensures the variable is available during vi.mock hoisting.
 */
const { mockIsValidTransition } = vi.hoisted(() => ({
  mockIsValidTransition: vi.fn<[string, string], boolean>(),
}));

vi.mock('@actone/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@actone/shared')>();
  return {
    ...actual,
    isValidTransition: mockIsValidTransition,
  };
});

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
    mockIsValidTransition.mockReset();
    // Re-apply default delegation after reset
    mockIsValidTransition.mockImplementation((from: string, to: string) => {
      const validTransitions = [
        { from: 'concept', to: 'draft' },
        { from: 'draft', to: 'revision' },
        { from: 'revision', to: 'draft' },
        { from: 'revision', to: 'final' },
        { from: 'final', to: 'revision' },
        { from: 'final', to: 'published' },
      ];
      return validTransitions.some((t) => t.from === from && t.to === to);
    });
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

  it('returns 403 for non-owned project', async () => {
    configureMockDb({
      select: [{ ...projectData, userId: 'other-user-999' }],
    });

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { projectId, targetStage: 'draft' },
    });

    expect(response.status).toBe(403);
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

  it('returns 409 for same-stage transition', async () => {
    const draftProject = { ...projectData, lifecyclePhase: 'draft' };
    configureMockDb({
      select: [draftProject],
    });

    mockIsValidTransition.mockReturnValueOnce(true);

    const app = createTestApp(defaultUser);
    const response = await appRequest(app, '/project/lifecycle', {
      method: 'POST',
      body: { projectId, targetStage: 'draft' },
    });

    expect(response.status).toBe(409);
  });
});
