/**
 * T088: Cost estimator.
 *
 * Calculates estimated USD cost and token count before generation.
 * Uses the sanyam ProviderRegistry to look up text providers.
 */

import type { CostEstimate } from '@actone/shared';
import { providers } from '$lib/server/ai-providers.js';
import type { GenerationContext } from './generation-context.js';
import { buildPrompt } from './prompt-builder.js';

/**
 * Convert ActOne's domain GenerationContext to sanyam's GenerateContext
 * by running it through the prompt builder.
 */
function toGenerateContext(context: GenerationContext) {
  const userPrompt = buildPrompt(context);
  return {
    systemPrompt: context.precedingSceneSummary ?? '',
    userPrompt,
    temperature: context.temperature,
  };
}

/**
 * Estimate the cost of generating prose for the given context.
 *
 * @param context - Assembled generation context
 * @param backendId - Provider to estimate for (uses first available if not specified)
 * @returns Cost estimate with USD and token counts
 */
export async function estimateCost(
  context: GenerationContext,
  backendId?: string,
): Promise<CostEstimate> {
  const provider = backendId
    ? providers.getText(backendId)
    : providers.getAllText()[0];

  if (!provider) {
    throw new Error(
      backendId
        ? `Provider "${backendId}" not found`
        : 'No text providers configured',
    );
  }

  const generateCtx = toGenerateContext(context);
  const result = await provider.estimateCost(generateCtx);

  return {
    estimatedCostUsd: result.estimatedCostUsd,
    estimatedTokens: result.inputTokens,
  };
}

/**
 * Format a cost estimate for display.
 */
export function formatCostEstimate(estimate: CostEstimate): string {
  if (estimate.estimatedCostUsd === 0) {
    return `~${estimate.estimatedTokens.toLocaleString()} tokens (free)`;
  }

  const costStr = estimate.estimatedCostUsd < 0.01
    ? `< $0.01`
    : `~$${estimate.estimatedCostUsd.toFixed(2)}`;

  return `${costStr} (~${estimate.estimatedTokens.toLocaleString()} tokens)`;
}

/**
 * Estimate word count from token count.
 * Roughly 0.75 words per token for English prose.
 */
export function estimateWords(tokenCount: number): number {
  return Math.round(tokenCount * 0.75);
}
