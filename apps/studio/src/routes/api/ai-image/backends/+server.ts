/**
 * T109: GET /api/ai-image/backends
 *
 * Lists available image generation backends with dynamic availability check
 * per contracts/api-endpoints.md §2.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { imageBackendRegistry } from '$lib/server/image-backends.js';

export const GET: RequestHandler = async () => {
  const backends = await imageBackendRegistry.listAll();
  return json({ backends });
};
