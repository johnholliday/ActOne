# Quickstart: ActOne Studio Test Suite

**Branch**: `003-actone-studio-tests` | **Date**: 2026-02-26

## Prerequisites

- Node.js >= 20.10 (required by Langium 4.x)
- pnpm 9.x (`corepack enable && corepack prepare pnpm@latest --activate`)
- All ActOne Studio packages built (`pnpm build`)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

This installs Vitest (already in devDeps) and adds Playwright for E2E tests.

### 2. Install Playwright browsers (E2E only)

```bash
cd apps/studio
npx playwright install --with-deps chromium
```

### 3. Build all packages

```bash
pnpm build
```

Tests depend on built packages (Langium generated types, shared type exports).

## Running Tests

### All tests (unit + integration + performance)

```bash
pnpm test
```

Runs Vitest across all three workspace packages via Turborepo.

### Single package tests

```bash
turbo run test --filter=@repo/langium      # Grammar tests only
turbo run test --filter=@repo/shared       # Shared package tests only
turbo run test --filter=studio             # Studio unit + integration + performance
```

### E2E tests (requires running dev server)

```bash
# Terminal 1: Start dev server
turbo run dev --filter=studio

# Terminal 2: Run E2E tests
cd apps/studio
npx playwright test
```

### Watch mode (during development)

```bash
cd packages/langium && npx vitest --watch   # Watch grammar tests
cd apps/studio && npx vitest --watch        # Watch studio tests
```

### Coverage report

```bash
cd packages/langium && npx vitest --coverage
cd apps/studio && npx vitest --coverage
```

## Test Structure

| Package | Test Location | Config | Framework |
|---------|--------------|--------|-----------|
| `@repo/langium` | `packages/langium/tests/` | `packages/langium/vitest.config.ts` | Vitest + `langium/test` |
| `@repo/shared` | `packages/shared/tests/` | `packages/shared/vitest.config.ts` | Vitest |
| `studio` | `apps/studio/tests/` | `apps/studio/vitest.config.ts` | Vitest + SvelteKit plugin |
| `studio (E2E)` | `apps/studio/tests/e2e/` | `apps/studio/tests/e2e/playwright.config.ts` | Playwright |

## Key Patterns

### Langium grammar tests

```typescript
import { parseHelper, validationHelper } from 'langium/test';
import { createActOneServices } from '@repo/langium';
import type { Story } from '@repo/langium';

const { ActOne } = createActOneServices();
const parse = parseHelper<Story>(ActOne);
const validate = validationHelper<Story>(ActOne);

it('parses a character', async () => {
  const doc = await parse(`story "Test" { character Alice { nature: "protagonist" } }`);
  expect(doc.parseResult.parserErrors).toHaveLength(0);
});
```

### Studio unit tests (pure functions)

```typescript
import { canTransition, getValidTargets } from '$lib/project/lifecycle';

it('allows concept → draft', () => {
  expect(canTransition('concept', 'draft')).toBe(true);
});
```

### Studio API integration tests (mocked dependencies)

```typescript
vi.mock('$lib/server/db');
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'mock' } }));

import { POST } from '$lib/../routes/api/projects/+server';

it('creates a project', async () => {
  const response = await POST({ request: new Request('...', { method: 'POST', body: '...' }) } as RequestEvent);
  expect(response.status).toBe(200);
});
```

### Performance benchmarks

```typescript
it('validates in under 200ms', async () => {
  const start = performance.now();
  await validate(fullStoryFixture);
  expect(performance.now() - start).toBeLessThan(200);
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module '$lib/...'` | Run `pnpm build` first, or verify `sveltekit()` plugin is in vitest config |
| `Cannot find module '@repo/langium'` | Run `turbo run build --filter=@repo/langium` |
| Playwright tests timeout | Ensure dev server is running (`turbo run dev --filter=studio`) |
| Performance tests flaky | Run in isolation (`npx vitest run tests/performance/`), consider hardware variance |
| `vi.mock` not hoisting | Ensure mock calls are at the top level of the file, not inside `describe` blocks |
