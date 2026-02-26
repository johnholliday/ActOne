/**
 * T049: AI text generation endpoint tests.
 *
 * Tests POST /api/ai-text/estimate and GET/PUT /api/ai-text/backends.
 * SSE streaming endpoint (POST /api/ai-text/generate) is skipped for now.
 */

import '../../fixtures/mocks/setup.js';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureMockDb, resetMockDb } from '../../fixtures/mocks/db.js';
import {
  createAuthenticatedEvent,
  createFakeEvent,
  getJsonBody,
  expectHttpError,
} from './helpers.js';

// ── Mock modules used by the estimate endpoint ────────────────────────

vi.mock('$lib/ai/context-assembler', () => ({
  assembleContext: vi.fn(() => ({
    sceneName: 'TestScene',
    sceneType: 'Action',
    location: 'TestPlace',
    atmosphere: [],
    objective: 'Test objective',
    participants: [
      { name: 'Alice', nature: 'Human', bio: 'Test bio', voice: '', personality: [] },
    ],
    worldRules: [],
    themeStatements: [],
    pacing: 'moderate',
    temperature: 0.7,
  })),
}));

vi.mock('$lib/stores/ast.svelte', () => ({
  astStore: {
    activeAst: {
      ast: {
        name: 'Test Story',
        elements: [],
      },
      valid: true,
      errors: 0,
      diagnostics: [],
      uri: 'test://story.act1',
    },
  },
}));

vi.mock('$lib/ai/cost-estimator', () => ({
  estimateWords: vi.fn((tokenCount: number) => Math.round(tokenCount * 0.75)),
}));

// ── Handler imports ───────────────────────────────────────────────────

import { POST as estimate } from '$routes/api/ai-text/estimate/+server.js';
import { GET as listBackends, PUT as switchBackend } from '$routes/api/ai-text/backends/+server.js';

// ── Tests ─────────────────────────────────────────────────────────────

describe('GET /api/ai-text/backends', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('returns list of available backends', async () => {
    const event = createAuthenticatedEvent({ method: 'GET' });
    const response = await listBackends(event);

    expect(response.status).toBe(200);

    const body = await getJsonBody<
      Array<{ id: string; name: string; type: string; available: boolean; active: boolean }>
    >(response);

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0]).toMatchObject({
      id: 'mock-text',
      name: 'Mock Text Backend',
      type: 'text',
      available: true,
    });
    // The active flag is computed in the handler
    expect(body[0]).toHaveProperty('active');
  });
});

describe('PUT /api/ai-text/backends', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('switches active backend', async () => {
    const event = createAuthenticatedEvent({
      method: 'PUT',
      body: { backendId: 'mock-text' },
    });
    const response = await switchBackend(event);

    expect(response.status).toBe(200);

    const body = await getJsonBody<{ activeBackendId: string }>(response);
    expect(body).toEqual({ activeBackendId: 'mock-text' });
  });

  it('returns 400 for missing backendId', async () => {
    const event = createAuthenticatedEvent({
      method: 'PUT',
      body: {},
    });

    await expectHttpError(() => switchBackend(event), 400);
  });
});

describe('POST /api/ai-text/estimate', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('returns cost estimate for valid request', async () => {
    const event = createAuthenticatedEvent({
      method: 'POST',
      body: {
        projectId: '00000000-0000-0000-0000-000000000001',
        sceneName: 'TestScene',
        backendId: 'mock-text',
      },
    });
    const response = await estimate(event);

    expect(response.status).toBe(200);

    const body = await getJsonBody<{
      estimatedCostUsd: number;
      estimatedTokens: number;
      estimatedWords: number;
    }>(response);

    expect(body).toHaveProperty('estimatedCostUsd');
    expect(body).toHaveProperty('estimatedTokens');
    expect(body).toHaveProperty('estimatedWords');
    expect(typeof body.estimatedCostUsd).toBe('number');
    expect(typeof body.estimatedTokens).toBe('number');
    expect(typeof body.estimatedWords).toBe('number');
    // The mock backend returns 0.005 USD and 500 tokens
    expect(body.estimatedCostUsd).toBe(0.005);
    expect(body.estimatedTokens).toBe(500);
    // estimateWords(500) = Math.round(500 * 0.75) = 375
    expect(body.estimatedWords).toBe(375);
  });

  it('returns 400 for missing fields', async () => {
    // Missing sceneName and backendId
    const event = createAuthenticatedEvent({
      method: 'POST',
      body: {
        projectId: '00000000-0000-0000-0000-000000000001',
      },
    });

    await expectHttpError(() => estimate(event), 400);
  });
});
