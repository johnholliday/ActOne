/**
 * T039: Cost estimator tests.
 *
 * Verifies formatCostEstimate and estimateWords pure functions.
 * estimateCost is async and depends on the provider registry,
 * so it is tested with a mocked provider.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GenerationContext } from '$lib/ai/generation-context.js';

// Mock the provider registry before importing cost-estimator
const mockEstimateCost = vi.fn(async () => ({
  inputTokens: 500,
  estimatedCostUsd: 0.015,
  providerId: 'test-provider',
}));

vi.mock('$lib/server/ai-providers', () => ({
  providers: {
    getText: vi.fn((id: string) =>
      id === 'test-provider'
        ? { id: 'test-provider', name: 'Test Provider', estimateCost: mockEstimateCost }
        : undefined,
    ),
    getAllText: vi.fn(() => [
      { id: 'test-provider', name: 'Test Provider', estimateCost: mockEstimateCost },
    ]),
  },
  providerInit: Promise.resolve(),
}));

// Must also mock prompt-builder since cost-estimator uses it
vi.mock('$lib/ai/prompt-builder', () => ({
  buildPrompt: vi.fn(() => 'mock prompt for cost estimation'),
}));

import { estimateCost, formatCostEstimate, estimateWords } from '$lib/ai/cost-estimator.js';

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

describe('estimateCost', () => {
  beforeEach(() => {
    mockEstimateCost.mockClear();
  });

  it('returns a CostEstimate with positive values', async () => {
    const result = await estimateCost(testContext, 'test-provider');

    expect(result.estimatedCostUsd).toBeGreaterThanOrEqual(0);
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });

  it('uses first available provider when no backendId specified', async () => {
    const result = await estimateCost(testContext);

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
