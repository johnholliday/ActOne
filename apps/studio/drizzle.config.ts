import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: '../../packages/shared/src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Uses DATABASE_URL from environment
    url: process.env['DATABASE_URL'] ?? '',
  },
});
