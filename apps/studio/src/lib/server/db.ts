import { createDrizzleClient } from '@docugenix/sanyam-db/client';

import { DATABASE_URL } from '$env/static/private';
import * as schema from '@actone/shared/db';
import * as relations from '@actone/shared/db/relations';

/**
 * Drizzle ORM instance with full ActOne schema + relations.
 * Uses sanyam-db's RLS-aware connection helpers.
 */
export const { db, withRLS } = createDrizzleClient({
  databaseUrl: DATABASE_URL,
  schema: { ...schema, ...relations },
});
