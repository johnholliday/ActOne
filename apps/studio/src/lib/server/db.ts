import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { DATABASE_URL } from '$env/static/private';
import * as schema from '@actone/shared/db';
import * as relations from '@actone/shared/db/relations';

/**
 * Raw postgres.js client with `prepare: false` for Supabase transaction pooler.
 */
const client = postgres(DATABASE_URL, { prepare: false });

/**
 * Drizzle ORM instance with full schema + relations.
 * Use this for admin queries (service role, bypasses RLS).
 */
export const db = drizzle(client, {
  schema: { ...schema, ...relations },
});

/**
 * Execute a Drizzle query block within an RLS-scoped transaction.
 * Sets the Supabase role and JWT claims so Postgres RLS policies
 * evaluate against the authenticated user.
 *
 * @param jwt - The user's JWT access token from the session
 * @param fn - Callback receiving the RLS-scoped Drizzle transaction
 */
export async function withRLS<T>(
  jwt: string,
  fn: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Switch to authenticated role so RLS policies apply
    await tx.execute(
      /* sql */ `SELECT set_config('role', 'authenticated', true)`,
    );
    await tx.execute(
      /* sql */ `SELECT set_config('request.jwt.claims', '${jwt}', true)`,
    );
    return fn(tx as unknown as typeof db);
  });
}
