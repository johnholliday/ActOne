/**
 * Server-side AI provider registry singleton.
 *
 * The empty registry is created here. It gets populated by hooks.server.ts
 * at startup (before any requests are served).
 *
 * Other server modules (e.g. cost-estimator) can import `providers` from here.
 */

import { createProviderRegistry } from '@docugenix/sanyam-ai-provider';

export const providers = createProviderRegistry();
