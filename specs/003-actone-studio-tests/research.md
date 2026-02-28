# Research: ActOne Studio Test Suite

## Decision 1: Unit/Integration Testing Framework

**Decision**: Vitest 3.x (already installed in `apps/studio/package.json`)

**Rationale**: Vitest is already a devDependency, shares Vite's transform pipeline (critical for SvelteKit alias resolution), and provides native ESM support. It integrates seamlessly with the SvelteKit Vite plugin, resolving `$lib`, `$env`, and `@repo/*` aliases automatically.

**Alternatives considered**:
- Jest: Requires additional ESM configuration, doesn't share Vite's transform pipeline, worse SvelteKit integration
- Node test runner: No SvelteKit plugin support, limited assertion library

## Decision 2: E2E Testing Framework

**Decision**: Playwright (`@playwright/test`)

**Rationale**: Industry standard for browser-based E2E testing. Supports Chromium, Firefox, and WebKit. Built-in test runner with parallel execution, auto-waiting, and network interception. Not yet installed but will be added as a devDependency.

**Alternatives considered**:
- Cypress: Slower, no multi-tab support, weaker TypeScript integration
- Puppeteer: Lower-level, no built-in test runner

## Decision 3: Vitest Configuration Pattern for SvelteKit

**Decision**: Use `sveltekit()` Vite plugin in vitest.config.ts to resolve all aliases automatically.

**Rationale**: The SvelteKit Vite plugin registers `$lib`, `$env`, `$app`, and `@repo/*` path aliases. Using it in vitest.config.ts means no manual alias configuration is needed. Tests in `apps/studio` use `environment: 'node'` for server-side tests (API endpoints, business logic) since no DOM is needed.

**Key pattern**:
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

**For packages/langium and packages/shared**: Standard Vitest config with `environment: 'node'`, no SvelteKit plugin needed.

## Decision 4: SvelteKit Module Mocking Strategy

**Decision**: Use `vi.mock()` for server singletons (`$lib/server/db`, `$lib/server/supabase`, `$lib/server/image-backends`) and `$env/dynamic/private`. Use a shared setup file for common mocks.

**Rationale**: Server modules create singleton instances on module load, so they must be mocked before any test code imports them. Vitest's `vi.mock()` is hoisted to the top of the file, ensuring mocks are in place before imports execute.

**Key mocks needed**:
- `$lib/server/db` → mock `db` object with Drizzle-like chainable API
- `$lib/server/supabase` → mock `supabaseAdmin` client
- `$lib/server/image-backends` → mock `imageBackendRegistry`
- `$env/dynamic/private` → `vi.mock()` with test env values

## Decision 5: Langium Testing Approach

**Decision**: Use Langium 4.x built-in test utilities from `langium/test` module.

**Rationale**: Langium provides a comprehensive set of test helpers (`parseHelper`, `validationHelper`, `expectError`, `expectCompletion`, `expectHover`, `expectFormatting`, `expectSymbols`, `highlightHelper`, `expectSemanticToken`, `expectGoToDefinition`, `expectFindReferences`). These handle document lifecycle, cursor position markers (`<|>`), and assertion patterns. `createActOneServices()` works in Node without a web worker or browser.

**Key pattern**:
```typescript
import { parseHelper, validationHelper, expectError } from 'langium/test';
import { createActOneServices } from '@repo/langium';
import type { Story } from '@repo/langium';

const { ActOne } = createActOneServices();
const parse = parseHelper<Story>(ActOne);
const validate = validationHelper<Story>(ActOne);
```

**Available utilities**:
| Utility | Purpose |
|---------|---------|
| `parseHelper<T>` | Parse string → LangiumDocument |
| `validationHelper<T>` | Parse + validate → diagnostics |
| `expectError` / `expectWarning` | Assert specific diagnostics |
| `expectNoIssues` | Assert zero diagnostics |
| `expectCompletion` | Test suggestions at `<\|>` cursor |
| `expectHover` | Test tooltip at `<\|>` cursor |
| `expectFormatting` | Test before → after formatting |
| `expectSymbols` | Test document outline |
| `highlightHelper` + `expectSemanticToken` | Test syntax highlighting |
| `expectGoToDefinition` | Test jump-to-definition |
| `expectFindReferences` | Test find-all-references |

## Decision 6: SvelteKit API Endpoint Testing

**Decision**: Import handler functions directly and call them with mock `RequestEvent` objects.

**Rationale**: SvelteKit endpoint handlers (`GET`, `POST`, `PUT`) are plain async functions that accept a `RequestEvent` and return a `Response`. They can be imported and called directly in Vitest without needing an HTTP server. This is faster and more isolated than full HTTP testing.

**Key pattern**:
```typescript
import { GET } from './+server';
const response = await GET({ url: new URL('http://localhost/api/...') } as RequestEvent);
const data = await response.json();
```

## Decision 7: Test Directory Structure

**Decision**: Co-locate tests with source in `packages/langium/tests/` and `packages/shared/tests/`. For `apps/studio`, use the existing `tests/unit/`, `tests/integration/`, `tests/e2e/` directory structure.

**Rationale**: The studio app already has empty test directories created during the implementation phase. Langium and shared packages follow the existing `string-utils` pattern with `__tests__/` or `tests/` directory. This keeps test infrastructure separate from source while maintaining discoverability.

## Decision 8: Fixture Data Strategy

**Decision**: Create `.actone` fixture files in `packages/langium/tests/fixtures/` for grammar tests and TypeScript fixture factories in `apps/studio/tests/fixtures/` for business logic tests.

**Rationale**: Grammar tests need actual `.actone` text to parse. Business logic tests need `SerializedStory` objects. Text fixtures are best stored as files; typed fixtures are best created by factory functions that produce consistent test data.

**Key fixtures**:
- `minimal.actone` — single character + scene (smoke test)
- `full-story.actone` — all 8 element types with rich properties
- `invalid-values.actone` — out-of-range values for validator tests
- `createTestStory()` — factory producing `SerializedStory` with configurable element counts
- `createTestDrafts()` — factory producing `DraftVersion[]` for publishing tests

## Decision 9: Module Testability Classification

**Decision**: Classify modules by testability to determine mock vs. fixture strategy.

**Pure functions (test with fixtures only)**:
- `lifecycle.ts` — `canTransition`, `getValidTargets`, `getStageLabel`
- `analytics.ts` — `extractAnalytics`
- `composition.ts` — all exports
- `stable-refs.ts` — all exports
- `ast-utils.ts` — all exports
- All diagram transformers (`story-structure.ts`, `character-network.ts`, etc.)
- `manuscript-assembler.ts` — `assembleManuscript`
- `html-preview.ts` — `generateHtmlPreview`
- `kdp-config.ts` — all exports
- `context-assembler.ts` — `assembleContext`
- `prompt-builder.ts` — `buildPrompt`
- `cost-estimator.ts` — `estimateCost`
- `panel-generator.ts` — panel generation functions
- `lettering-system.ts` — lettering functions

**Side-effectful (need mocks)**:
- `lifecycle.ts` — `requestTransition` (accepts `fetchFn` parameter)
- `draft-manager.ts` — `loadDrafts` (accepts `fetchFn` parameter)
- All API endpoint handlers (import `db`, `supabaseAdmin`)
- Image backend registry (initializes from env vars)

## Decision 10: Turbo Test Task Configuration

**Decision**: Add `"test"` task to `turbo.json` with `"outputs": ["coverage/**"]` and `"cache": true`. No `dependsOn` since tests run independently per package.

**Rationale**: Tests don't depend on other packages being tested first. Caching coverage reports speeds up CI. A separate `"test:e2e"` task handles Playwright tests with `"cache": false` since they depend on a running server.

**Key config**:
```json
{
  "test": { "outputs": ["coverage/**"], "cache": true },
  "test:e2e": { "cache": false, "persistent": false }
}
```
