/**
 * T088: Cost estimator.
 *
 * Calculates estimated USD cost and token count before generation.
 */

import type { CostEstimate } from '@repo/shared';
import { backendRegistry } from './backends/backend-registry.js';
import type { GenerationContext } from './backends/backend-registry.js';

/**
 * Estimate the cost of generating prose for the given context.
 *
 * @param context - Assembled generation context
 * @param backendId - Backend to estimate for (uses active if not specified)
 * @returns Cost estimate with USD and token counts
 */
export async function estimateCost(
  context: GenerationContext,
  backendId?: string,
): Promise<CostEstimate> {
  const backend = backendId
    ? backendRegistry.get(backendId)
    : backendRegistry.getActive();

  if (!backend) {
    throw new Error(
      backendId
        ? `Backend "${backendId}" not found`
        : 'No active backend configured',
    );
  }

  return backend.estimateCost(context);
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
