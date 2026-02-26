/**
 * T092: GET and PUT /api/ai-text/backends
 *
 * GET: List available text backends with status.
 * PUT: Switch active backend.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { backendRegistry } from '$lib/ai/backends/backend-registry.js';

export const GET: RequestHandler = async () => {
  const backends = await backendRegistry.listAll();

  return json(
    backends.map((b) => ({
      ...b,
      active: b.id === backendRegistry.getActiveId(),
    })),
  );
};

const switchSchema = z.object({
  backendId: z.string().min(1),
});

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const parsed = switchSchema.safeParse(body);

  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  try {
    backendRegistry.setActive(parsed.data.backendId);
  } catch (e) {
    error(400, e instanceof Error ? e.message : 'Failed to switch backend');
  }

  return json({ activeBackendId: parsed.data.backendId });
};
