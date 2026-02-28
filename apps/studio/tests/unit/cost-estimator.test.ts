/**
 * T039: Cost estimator tests.
 *
 * Verifies formatCostEstimate and estimateWords pure functions.
 * estimateCost is async and depends on the backend registry,
 * so it is tested with a mock backend if needed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { estimateCost, formatCostEstimate, estimateWords } from '$lib/ai/cost-estimator.js';
import { backendRegistry } from '$lib/ai/backends/backend-registry.js';
import type { GenerationContext, TextBackend } from '$lib/ai/backends/backend-registry.js';

const testContext: GenerationContext = {
  sceneName: 'Opening',
  sceneType: 'Reflection',
  location: 'Studio',
  atmosphere: [{ name: 'calm', value: 70 }],
  objective: 'Test',
  participants: [
    {
      name: 'Elena',
      nature: 'Human',
      bio: 'Test',
      voice: 'Calm',
      personality: [{ name: 'creativity', value: 85 }],
    },
  ],
  worldRules: ['Tides follow schedule'],
  themeStatements: ['Every ending seeds a beginning.'],
  pacing: 'Measured',
  temperature: 0.8,
};

/** Minimal mock backend for testing estimateCost. */
function createMockBackend(): TextBackend {
  return {
    id: 'test-backend',
    name: 'Test Backend',
    async *generate() {
      yield { text: 'test' };
      return { fullText: 'test', totalTokens: 100, durationMs: 50 };
    },
    async estimateCost() {
      return { estimatedCostUsd: 0.015, estimatedTokens: 500 };
    },
    async checkAvailability() {
      return { available: true };
    },
    getCapabilities() {
      return { maxContextTokens: 100_000, streaming: true, concurrentRequests: 1 };
    },
  };
}

describe('estimateCost', () => {
  let mockBackend: TextBackend;

  beforeEach(() => {
    mockBackend = createMockBackend();
    backendRegistry.register(mockBackend);
  });

  afterEach(() => {
    backendRegistry.unregister('test-backend');
  });

  it('returns a CostEstimate with positive values', async () => {
    const result = await estimateCost(testContext, 'test-backend');

    expect(result.estimatedCostUsd).toBeGreaterThanOrEqual(0);
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });
});

describe('formatCostEstimate', () => {
  it('returns a string for a standard estimate', () => {
    const formatted = formatCostEstimate({ estimatedCostUsd: 0.01, estimatedTokens: 500 });

    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('includes free label for zero cost', () => {
    const formatted = formatCostEstimate({ estimatedCostUsd: 0, estimatedTokens: 500 });

    expect(formatted).toContain('free');
  });

  it('formats small costs with less-than indicator', () => {
    const formatted = formatCostEstimate({ estimatedCostUsd: 0.005, estimatedTokens: 200 });

    expect(formatted).toContain('< $0.01');
  });
});

describe('estimateWords', () => {
  it('converts tokens to approximate word count', () => {
    const words = estimateWords(100);

    expect(words).toBeGreaterThan(0);
    expect(typeof words).toBe('number');
  });

  it('returns 0 for 0 tokens', () => {
    expect(estimateWords(0)).toBe(0);
  });
});
