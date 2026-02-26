# Research: ActOne Studio

**Branch**: `002-actone-studio` | **Date**: 2026-02-24

## R1: Langium 4.x Browser Web Worker

**Decision**: Use Langium 4.2.1 running in a browser web worker via `BrowserMessageReader`/`BrowserMessageWriter` from `vscode-languageserver/browser.js`.

**Rationale**: Langium 4.x has first-class browser support. The `langium` core package is browser-safe; only `langium/node` contains Node.js APIs. The official pattern uses `startLanguageServer()` from `langium/lsp` with a standard LSP connection over `postMessage`. This gives us a full language server (parsing, validation, completion, hover, references, rename, formatting, semantic tokens) running entirely client-side with zero server latency.

**Alternatives considered**:
- **Server-side Langium**: Would require a backend process and add network latency to every edit. Rejected — the browser worker approach is officially supported and eliminates the server dependency for language intelligence.
- **Lezer parser in CodeMirror**: Would provide basic parsing but no LSP features (completion, hover, references, rename, semantic tokens). Would require reimplementing all language services. Rejected — Langium provides everything out of the box.

**Key details**:
- **Packages**: `langium@~4.2.1`, `langium-cli@~4.2.0` (dev), `vscode-languageserver@~9.0.1`, `vscode-languageserver-protocol@~3.17.5`
- **File system**: Custom `SupabaseFileSystemProvider` implementing Langium's `FileSystemProvider` interface, wrapping an in-memory cache populated from Supabase queries
- **Worker entry**: Uses `EmptyFileSystem` base, custom FS provider for multi-file projects
- **Bundling**: Vite handles web worker bundling via `new Worker(new URL('...', import.meta.url), { type: 'module' })`
- **Key imports**: `langium` (core, browser-safe), `langium/lsp` (LSP integration), never `langium/node`
- **Langium 4.x changes from 3.x**: `PrecomputedScopes` renamed to `LocalSymbols`, `findDeclaration()` returns array, `$type` constants, new `infix` rule syntax, requires TypeScript >= 5.8 and Node >= 20.10

---

## R2: SvelteKit 2.x + Svelte 5 Application Framework

**Decision**: Use SvelteKit 2.53.x with Svelte 5.53.x, Vite 7.x, and adapter-node for deployment.

**Rationale**: SvelteKit is the specified framework. Svelte 5 runes (`$state`, `$derived`, `$effect`) replace Svelte 4 stores, providing a cleaner reactive model. SvelteKit's file-based routing, server hooks, and SSE-capable `+server.ts` endpoints match the architecture requirements.

**Alternatives considered**:
- **Next.js/React**: The existing `apps/web` scaffolding uses Next.js, but the spec explicitly calls for SvelteKit. The existing web app scaffold is empty and will be superseded.
- **Svelte 4**: Svelte 5 is stable and all key dependencies (SvelteFlow) require it.

**Key details**:
- **Svelte 5 runes**: `$state()` for reactive state, `$state.raw()` for non-deep-tracked objects (important for SvelteFlow performance), `$derived()` for computed values, `$effect()` for side effects with cleanup
- **Props**: `let { prop } = $props()` replaces `export let prop`
- **TypeScript**: Strict mode, `moduleResolution: "bundler"` (required by Vite), `target: "ES2022"`
- **Web workers**: `new Worker(new URL('$lib/worker/langium-worker.ts', import.meta.url), { type: 'module' })` — Vite handles bundling
- **CSS**: Tailwind CSS 4.2.x with `@tailwindcss/vite` plugin (CSS-first config, no tailwind.config.js)
- **Adapter**: `@sveltejs/adapter-node@5.5.x` for self-hosted deployment

---

## R3: SvelteFlow Diagram Library

**Decision**: Use @xyflow/svelte 1.5.x for all five diagram views.

**Rationale**: SvelteFlow is the only mature Svelte-native diagramming library with custom node/edge components, built-in grouping/nesting, and interactive features (drag, context menus, zoom/pan). It requires Svelte 5 (^5.25.0) which aligns with our stack.

**Alternatives considered**:
- **D3.js**: Lower-level, would require building all diagram primitives from scratch. Rejected — too much custom work for the five diagram views.
- **Cytoscape.js**: Graph-focused but lacks SvelteFlow's component model and SvelteKit integration. Rejected.

**Key details**:
- **Custom nodes**: Standard Svelte 5 components registered via `nodeTypes` map, receiving `NodeProps` via `$props()`
- **Custom edges**: Same pattern via `edgeTypes`, with path utilities (`getBezierPath`, `getSmoothStepPath`, `getStraightPath`)
- **Grouping**: `parentId` property + `extent: 'parent'` for nesting locations inside worlds. Parents must precede children in the nodes array.
- **Reactivity**: Use `$state.raw()` for nodes/edges arrays (avoids deep proxy overhead), `bind:nodes` / `bind:edges` for two-way sync
- **Context menus**: `onnodecontextmenu`, `onedgecontextmenu`, `onpanecontextmenu` events with viewport-aware positioning
- **Store access**: `useSvelteFlow()` for viewport control and batch operations, `useNodes()`/`useEdges()` for reactive access

---

## R4: ELK.js Layout Engine

**Decision**: Use elkjs 0.11.x for automatic diagram layout across all five views.

**Rationale**: ELK provides multiple layout algorithms (layered, force, stress, radial) suitable for different diagram types. It supports hierarchical layouts (needed for worlds with nested locations) and integrates cleanly with SvelteFlow by computing node positions that feed into SvelteFlow's node data.

**Alternatives considered**:
- **dagre**: Simpler but less flexible, no hierarchical layout support, less actively maintained. Rejected.
- **d3-force**: Good for force-directed only. ELK covers more layout types. Rejected as primary (may supplement for character network).

**Key details**:
- **Import**: `elkjs/lib/elk.bundled.js` for synchronous use, or `elkjs/lib/elk-api.js` with web worker for non-blocking layout on large graphs
- **Algorithms**: `layered` for story structure (LEFT_TO_RIGHT), `force`/`stress` for character network, `layered` for world map (with hierarchy), custom horizontal for timeline, custom vertical for interaction sequence
- **Integration**: Compute layout → set positions on SvelteFlow nodes → merge manual overrides → update store
- **Hierarchical**: `elk.hierarchyHandling: 'INCLUDE_CHILDREN'` for nested layout (worlds → locations)

---

## R5: Supabase + Drizzle ORM Data Layer

**Decision**: Use Drizzle ORM 0.45.x for schema definition, migrations, and server-side queries. Use @supabase/supabase-js 2.97.x for auth, storage, and realtime. Use @supabase/ssr 0.8.x for SvelteKit auth integration.

**Rationale**: Drizzle provides type-safe SQL queries with full PostgreSQL feature support (joins, CTEs, subqueries), schema-as-code with built-in RLS policy definitions, and native Zod schema generation (satisfying Principle VII). The Supabase client handles auth (cookie-based SSR with @supabase/ssr), file storage, and realtime subscriptions — capabilities Drizzle doesn't provide.

**Alternatives considered**:
- **Supabase client only**: Limited query capabilities (PostgREST), no schema-as-code, no built-in Zod generation. Rejected for server-side data operations.
- **Prisma**: Heavier ORM, less PostgreSQL-native, no built-in RLS support. Rejected.
- **Raw SQL**: No type safety, no Zod generation. Rejected.

**Key details**:
- **Driver**: `postgres` (postgres.js) v3.4.x with `prepare: false` for Supabase transaction pool mode
- **RLS**: Drizzle 0.45.x supports `pgPolicy()` inline with table definitions, using `authenticatedRole`, `authUid` from `drizzle-orm/supabase`
- **Zod**: `createInsertSchema`, `createSelectSchema`, `createUpdateSchema` from `drizzle-orm/zod` (built-in since 0.30.0, separate `drizzle-zod` package is deprecated)
- **Server-side RLS**: Transaction wrapper pattern (`SET LOCAL ROLE`, `set_config('request.jwt.claims', ...)`) for Drizzle queries that respect user-scoped RLS
- **Admin bypass**: Direct Drizzle queries without the transaction wrapper (for server-side admin operations)
- **SvelteKit auth**: `@supabase/ssr` with `hooks.server.ts` for cookie-based session management, `safeGetSession()` pattern

---

## R6: CodeMirror 6 Editor Integration

**Decision**: Use CodeMirror 6 with custom extensions that bridge to the Langium web worker via postMessage.

**Rationale**: CodeMirror 6 provides a modular, extensible editor framework with Svelte 5 compatibility. We do not use Lezer for parsing (Langium handles all language intelligence in the worker). Instead, CodeMirror extensions translate between CodeMirror's extension API and LSP protocol messages to/from the worker.

**Alternatives considered**:
- **Monaco Editor**: Heavier (~2MB), has built-in LSP client support via monaco-languageclient. Rejected — larger bundle size, React-oriented, and the CodeMirror approach with a custom thin LSP client is lighter and more Svelte-friendly.
- **svelte-codemirror-editor wrapper**: Too limited for our customization needs. We'll create a direct CodeMirror integration.

**Key details**:
- **Core packages**: `@codemirror/view`, `@codemirror/state`, `@codemirror/autocomplete`, `@codemirror/lint`, `@codemirror/language`
- **Custom extensions**: `linter()` for diagnostics, `autocompletion()` for completions, `ViewPlugin` for semantic token highlighting and didChange notifications, `hoverTooltip()` for hover info
- **No Lezer grammar**: All parsing/validation/completion/hover handled by Langium in the worker
- **Thin LSP client**: Custom `LangiumClient` class on the main thread handling `postMessage` ↔ LSP protocol translation

---

## R7: Publishing Libraries

**Decision**: Use `docx@9.6.x` for DOCX, custom EPUB 3 assembly with `archiver@7.x` for EPUB, `pdfkit@0.17.x` for PDF, and `sharp@0.34.x` for image processing.

**Rationale**: Each library is the best-of-breed for its format. For EPUB, we need fine-grained control over the package structure (nav.xhtml, content.opf, per-chapter files, Dublin Core metadata) that `epub-gen-memory` doesn't fully provide — we'll use `archiver` for ZIP assembly with custom EPUB structure generation. For DOCX, the `docx` package provides full manuscript formatting control. For PDF, `pdfkit` enables programmatic layout without a browser dependency.

**Alternatives considered**:
- **epub-gen-memory for EPUB**: Simpler API but less control over EPUB 3 specifics (custom navigation, stylesheet, fixed-layout for graphic novels). Rejected for insufficient control.
- **Puppeteer for PDF**: Requires headless Chromium (~300MB). Rejected for size — `pdfkit` is lighter.
- **KPF generation**: Research shows KPF is a proprietary Amazon format with no public library. Amazon KDP accepts EPUB 3 and DOCX directly. For graphic novel Kindle publishing, we'll generate EPUB 3 fixed-layout with panel region metadata.

**Key details**:
- **EPUB 3**: Custom assembly: `mimetype`, `META-INF/container.xml`, `content.opf`, `nav.xhtml` (EPUB 3 nav), `toc.ncx` (EPUB 2 compat), per-chapter XHTML, stylesheet, images — zipped with `archiver`
- **DOCX**: `docx@9.6.x` — 12pt font, double-spaced (line: 480), 1-inch margins (convertInchesToTwip), right-aligned headers, page breaks for chapters
- **PDF**: `pdfkit@0.17.x` — configurable page size (trim sizes), margins, gutter, bleed, spine width calculation
- **Images**: `sharp@0.34.x` — resize, format conversion, cover image generation
- **KPF replacement**: EPUB 3 fixed-layout with `rendition:layout=pre-paginated` + custom panel region JSON sidecar for Kindle Create import
- **Markdown**: `marked@17.x` for rendering markdown in hover tooltips and story bible

---

## R8: TypeScript Configuration for SvelteKit

**Decision**: Create a new `sveltekit.json` preset in `@repo/typescript-config` with `moduleResolution: "Bundler"` for Vite-based projects.

**Rationale**: The constitution mandates `moduleResolution: "bundler"` in all tsconfig.json files. SvelteKit/Vite requires bundler resolution. The existing `base.json` uses `NodeNext` (a pre-existing discrepancy). New ActOne packages will use the new preset.

**Key details**:
- New preset: `packages/typescript-config/sveltekit.json` extending `base.json`, overriding `module: "ES2022"` and `moduleResolution: "Bundler"`
- New preset: `packages/typescript-config/library.json` for non-React shared libraries, with `moduleResolution: "Bundler"`
- The SvelteKit app's tsconfig extends `.svelte-kit/tsconfig.json` (auto-generated) with strict overrides
- Langium package uses the library preset with `moduleResolution: "Bundler"`

---

## R9: Tailwind CSS 4.x Configuration

**Decision**: Use Tailwind CSS 4.2.x with the `@tailwindcss/vite` plugin for CSS-first configuration.

**Rationale**: Tailwind 4 eliminates `tailwind.config.js` and PostCSS configuration in favor of CSS-native `@theme {}` blocks and the `@import "tailwindcss"` directive. The `@tailwindcss/vite` plugin integrates directly with Vite.

**Key details**:
- Install: `tailwindcss@4.2.x`, `@tailwindcss/vite@4.2.x`
- Config: Add `tailwindcss()` to `vite.config.ts` plugins (before `sveltekit()`)
- Styles: `src/app.css` with `@import "tailwindcss"` and `@theme {}` for custom tokens
