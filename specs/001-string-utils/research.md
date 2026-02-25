# Research: Shared String Utilities Package

**Feature**: 001-string-utils
**Date**: 2026-02-24

## Decision 1: Testing Framework

**Decision**: Vitest

**Rationale**: Vitest is ESM-native, requires minimal configuration for TypeScript projects, and provides fast execution with watch mode. It aligns with the SvelteKit ecosystem (future stack per constitution). It supports `moduleResolution: "Bundler"` out of the box, unlike Jest which requires additional ESM configuration.

**Alternatives considered**:
- **Jest**: Requires `ts-jest` or SWC transform, ESM support is experimental, more configuration overhead for pure ESM projects
- **node:test**: Built-in but lacks ergonomic assertion APIs, watch mode, and coverage reporting without additional tooling

## Decision 2: Build Strategy

**Decision**: `tsc` to `./dist` with declarations and source maps

**Rationale**: The constitution mandates `tsc` to `./dist` with declarations and source maps. For a small utility library with zero dependencies, `tsc` is sufficient — no bundling needed. Tree-shaking is achieved by the consumer's bundler via ESM named exports + `"sideEffects": false` in package.json.

**Alternatives considered**:
- **tsup/unbuild**: Would add a dev dependency for marginal benefit. `tsc` output is fine for an internal monorepo package.
- **No build (source exports like @repo/ui)**: `@repo/ui` exports raw `.tsx` source files. This works for React components consumed by a bundler, but for a general-purpose utility library, compiled output with declarations is more robust and avoids requiring consumers to have matching TypeScript config.

## Decision 3: Module Resolution

**Decision**: Override base tsconfig to use `moduleResolution: "Bundler"` and `module: "ESNext"` per constitution

**Rationale**: The constitution mandates `moduleResolution: "Bundler"` in every tsconfig.json. The existing `base.json` uses `NodeNext`, but overriding in a package-level tsconfig is straightforward. For a library consumed by bundler-based apps (SvelteKit, Vite), `Bundler` resolution is appropriate and avoids requiring file extensions in imports.

**Alternatives considered**:
- **Follow base.json's NodeNext**: Would violate constitution. NodeNext requires explicit `.js` extensions in imports, adding friction for a small internal library.

## Decision 4: Word Splitting Algorithm

**Decision**: Regex-based word splitting that detects all common boundaries: uppercase transitions (camelCase), hyphens, underscores, spaces, and acronym boundaries (HTTPResponse → HTTP, Response)

**Rationale**: A single robust `splitWords` function serves as the foundation for case conversion. (Slug generation uses a direct string pipeline instead — see Decision 5.) The key challenge is acronym handling — `parseHTTPResponse` must split into `["parse", "HTTP", "Response"]` not `["parse", "H", "T", "T", "P", "Response"]`. This requires detecting the boundary between consecutive uppercase letters and a following lowercase letter.

**Algorithm**: Split on:
1. Explicit delimiters: hyphens, underscores, spaces, dots
2. Transition from lowercase to uppercase: `aB` → split between `a` and `B`
3. Transition from multiple uppercase to uppercase+lowercase: `HTTPResponse` → split between `P` and `R` (keeping `HTTP` together)
4. Filter empty segments

**Alternatives considered**:
- **Per-function splitting**: Would duplicate logic if multiple modules needed it. A shared `words.ts` keeps case conversion DRY. Slug generation uses a direct pipeline instead (transliterate → NFKD → regex), so it doesn't need `splitWords`.
- **Third-party library (change-case)**: Would violate zero-dependency constraint (SC-005).

## Decision 5: Transliteration Approach

**Decision**: Static lookup map for common Latin-alphabet diacritical marks (~50 mappings) plus `&` → `and`

**Rationale**: Per spec assumptions, slug generation only needs common Latin characters (é→e, ü→u, ñ→n, etc.). A static map is fast, has zero dependencies, and covers the documented use cases. Full Unicode normalization (NFKD + strip combining marks) would cover more cases but is over-engineering for the stated requirements.

**Alternatives considered**:
- **Unicode NFKD normalization**: `"é".normalize("NFKD").replace(/[\u0300-\u036f]/g, "")` handles most Latin diacritics automatically. This is simpler code but less predictable for edge cases and doesn't handle `&` → `and` or ligatures. Could be combined with the static map as a fallback.
- **Third-party library (slugify, transliterate)**: Would violate zero-dependency constraint.

**Revised decision**: Use NFKD normalization as the primary mechanism (handles most accented characters automatically), augmented by a small static map for special cases (`&` → `and`, `ß` → `ss`, `æ` → `ae`, `ø` → `o`, etc.). This gives broader coverage with less code.

## Decision 6: Package Exports Configuration

**Decision**: Dual exports — barrel `"."` for convenience and per-module `"./*"` for granular imports

**Rationale**: FR-008 requires tree-shakeable imports. A barrel export (`import { toCamelCase } from "@repo/string-utils"`) is ergonomic and tree-shakeable by modern bundlers when modules have no side effects. Per-module imports (`import { toCamelCase } from "@repo/string-utils/case"`) provide explicit control. Supporting both maximizes consumer flexibility.

```json
{
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./case": { "import": "./dist/case.js", "types": "./dist/case.d.ts" },
    "./whitespace": { "import": "./dist/whitespace.js", "types": "./dist/whitespace.d.ts" },
    "./truncate": { "import": "./dist/truncate.js", "types": "./dist/truncate.d.ts" },
    "./slug": { "import": "./dist/slug.js", "types": "./dist/slug.d.ts" }
  }
}
```

**Alternatives considered**:
- **Barrel only**: Simpler package.json but no per-module import path
- **Per-module only (no barrel)**: Forces consumers to know which module a function lives in
