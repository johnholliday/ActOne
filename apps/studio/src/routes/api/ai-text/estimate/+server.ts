/**
 * T091: POST /api/ai-text/estimate
 *
 * Returns estimated cost/tokens/words before generation.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { backendRegistry } from '$lib/ai/backends/backend-registry.js';
import { assembleContext } from '$lib/ai/context-assembler.js';
import { estimateWords } from '$lib/ai/cost-estimator.js';
import { astStore } from '$lib/stores/ast.svelte.js';

const estimateSchema = z.object({
  projectId: z.string().uuid(),
  sceneName: z.string().min(1),
  backendId: z.string().min(1),
});

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const parsed = estimateSchema.safeParse(body);

  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  const { sceneName, backendId } = parsed.data;

  const backend = backendRegistry.get(backendId);
  if (!backend) {
    error(400, `Backend "${backendId}" not found`);
  }

  const ast = astStore.activeAst;
  if (!ast) {
    error(400, 'No active story AST available');
  }

  const context = assembleContext(ast, sceneName, 'moderate', 0.7);
  const estimate = await backend.estimateCost(context);

  return json({
    estimatedCostUsd: estimate.estimatedCostUsd,
    estimatedTokens: estimate.estimatedTokens,
    estimatedWords: estimateWords(estimate.estimatedTokens),
  });
};
