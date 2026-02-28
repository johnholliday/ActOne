/**
 * T050: Integration tests for AI image endpoints.
 *
 * Tests:
 *   GET  /api/ai-image/backends  — list available image backends
 *   POST /api/ai-image/generate  — generate an image via selected backend
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

import { GET as listImageBackends } from '$routes/api/ai-image/backends/+server.js';
import { POST as generateImage } from '$routes/api/ai-image/generate/+server.js';

// ── GET /api/ai-image/backends ──────────────────────────────────────────

describe('GET /api/ai-image/backends', () => {
  it('returns list of available image backends', async () => {
    const event = createFakeEvent({ method: 'GET' });
    const response = await listImageBackends(event);

    expect(response.status).toBe(200);

    const body = await getJsonBody<{
      backends: Array<{
        id: string;
        name: string;
        type: string;
        available: boolean;
        capabilities: { maxResolution: number; referenceImages: boolean };
      }>;
    }>(response);

    expect(body.backends).toBeInstanceOf(Array);
    expect(body.backends.length).toBeGreaterThanOrEqual(1);

    const backend = body.backends[0]!;
    expect(backend).toMatchObject({
      id: 'mock-image',
      name: 'Mock Image Backend',
      type: 'image',
      available: true,
      capabilities: {
        maxResolution: 1024,
        referenceImages: false,
      },
    });
  });
});

// ── POST /api/ai-image/generate ─────────────────────────────────────────

describe('POST /api/ai-image/generate', () => {
  const validProjectId = '00000000-0000-0000-0000-000000000001';

  const validBody = {
    projectId: validProjectId,
    type: 'portrait' as const,
    name: 'Elena Portrait',
    backendId: 'mock-image',
    prompt: 'A young painter in a sunlit studio.',
    width: 1024,
    height: 1024,
  };

  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  it('generates an image with valid request', async () => {
    const mockAssetId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    // Configure mockDb so the insert().values().returning() chain yields an asset row
    configureMockDb({
      insert: [
        {
          id: mockAssetId,
          projectId: validProjectId,
          type: 'portrait',
          name: 'Elena Portrait',
          status: 'pending',
          prompt: 'A young painter in a sunlit studio.',
          backend: 'mock-image',
          metadata: { width: 1024, height: 1024 },
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const event = createAuthenticatedEvent({
      method: 'POST',
      body: validBody,
    });

    const response = await generateImage(event);

    expect(response.status).toBe(200);

    const body = await getJsonBody<{
      assetId: string;
      prompt: string;
      status: string;
      storageUrl: string;
    }>(response);

    expect(body.assetId).toBe(mockAssetId);
    expect(body.prompt).toBe('A young painter in a sunlit studio.');
    expect(body.status).toBe('pending');
    expect(body.storageUrl).toBe('https://mock.example.com/image.png');
  });

  it('returns 400 for missing required fields', async () => {
    // Omit 'name' and 'backendId' which are required
    const incompleteBody = {
      projectId: validProjectId,
      type: 'portrait',
    };

    const event = createAuthenticatedEvent({
      method: 'POST',
      body: incompleteBody,
    });

    await expectHttpError(() => generateImage(event), 400);
  });

  it('returns 400 for invalid image type', async () => {
    const badTypeBody = {
      ...validBody,
      type: 'hologram', // not in the enum
    };

    const event = createAuthenticatedEvent({
      method: 'POST',
      body: badTypeBody,
    });

    await expectHttpError(() => generateImage(event), 400);
  });
});
