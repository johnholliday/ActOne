# Research: Eleventy Documentation with In-App Fly-out Panel

**Feature**: `007-eleventy-doc-panel`
**Date**: 2026-03-03

## R1: Eleventy TypeScript Configuration Support

**Decision**: Use JavaScript ESM config files (`.js` with `"type": "module"`) for the Eleventy guide package, with JSDoc type annotations for IDE support.

**Rationale**: Eleventy 3.x supports TypeScript config via Node 22.6+ `--experimental-strip-types` or the `tsx` package, but these add complexity and fragility for a content build tool. The project already uses JavaScript for `svelte.config.js` — build tool configs are not application source code per the constitution's intent. The guide package's markdown and Nunjucks templates are content, not TypeScript source. Using standard JS config follows Eleventy's ecosystem conventions and minimizes friction.

**Alternatives considered**:
- `eleventy.config.ts` with `tsx` — adds a dev dependency and non-standard invocation; fragile for a config that rarely changes
- `eleventy.config.ts` with Node `--experimental-strip-types` — requires Node 22.6+; not universally available
- JSDoc-typed `.js` files (chosen) — zero extra dependencies, full IDE autocomplete via `@param {import("@11ty/eleventy").UserConfig}`

## R2: Vite Plugin Integration with SvelteKit 2.53.x + Vite 7.0.0

**Decision**: Add a custom Vite `configureServer` middleware plugin in `apps/studio/vite.config.ts` that intercepts `/guide/*` requests during development.

**Rationale**: The existing `vite.config.ts` has only two plugins (`tailwindcss()` and `sveltekit()`). A custom Vite plugin using `configureServer` is the standard approach for serving additional static content in dev. The plugin resolves URL paths to `guide/_site/`, validates against path traversal, and serves files with correct MIME types. This is a well-established pattern.

**Alternatives considered**:
- SvelteKit `handle` hook as reverse proxy — adds SSR overhead for static files; not appropriate for pure static content
- Running Eleventy's dev server alongside SvelteKit — requires two processes; complicates the dev experience
- Vite's built-in `publicDir` — cannot map to a subdirectory at a custom URL prefix

## R3: Panel Integration with Dockview Layout

**Decision**: Implement the doc panel as a standalone fly-out component (not a dockview panel) that sits in the root layout alongside the dockview container.

**Rationale**: The documentation panel is a global app-level feature (accessible from any screen) rather than a project-specific workspace panel. Dockview panels are tied to workspace layout and can be moved/closed by users. The doc panel needs fixed positioning, global keyboard shortcuts (Escape), and persistence independent of workspace state. Placing it in `+layout.svelte` as a sibling to the dockview container gives it global scope.

**Alternatives considered**:
- Dockview panel — would be movable/closable within the workspace; loses global accessibility; confuses workspace panels (editor-related) with app-level features (help)
- Modal/dialog overlay — blocks interaction with the app; poor UX for reference documentation that users read while working
- Standalone fly-out in layout (chosen) — global scope, resizable, non-blocking, independent of workspace state

## R4: Production Deployment Strategy

**Decision**: Add a build step that copies `guide/_site/*` into SvelteKit's static output directory after the SvelteKit build completes. No Dockerfile changes needed yet (no Dockerfile exists).

**Rationale**: The studio uses `@sveltejs/adapter-node`. In production, adapter-node serves files from `build/client/` as static assets. Copying the guide's output into `build/client/guide/` makes the guide available at `/guide/*` without any middleware. Since no Dockerfile exists yet, the build script handles this via a post-build copy step.

**Alternatives considered**:
- SvelteKit `static/` directory — would work but mixes generated content with source-controlled static assets; requires pre-building guide before SvelteKit build
- Custom SvelteKit route handler — adds unnecessary SSR for static files
- Post-build copy (chosen) — clean separation; guide builds independently; output copied as final step

## R5: CSS Isolation Strategy

**Decision**: All guide content rendered in the fly-out panel is wrapped in a `.guide-content` container with fully scoped CSS using `--gc-*` prefixed custom properties. The guide's standalone CSS remains independent (plain CSS with its own custom properties).

**Rationale**: The host app uses Tailwind CSS 4.2.x which applies global styles. Guide content (fetched HTML) must be styled without Tailwind interference. Scoping all guide styles under `.guide-content` prevents bidirectional leakage. The standalone guide uses its own CSS with different custom properties (`--color-*`, `--space-*`) that don't conflict with Tailwind's utility classes.

**Alternatives considered**:
- Shadow DOM — maximum isolation but breaks accessibility, form interactions, and makes styling harder to maintain
- CSS modules — not applicable since content is pre-rendered HTML inserted via `innerHTML`
- Scoped CSS class namespace (chosen) — proven pattern; maintainable; works with `innerHTML` content

## R6: ActOne Grammar Scope for Language Reference

**Decision**: Document all 8 top-level element types (GenerateBlock, ThemeDef, CharacterDef, WorldDef, TimelineDef, SceneDef, PlotDef, InteractionDef), all enum types, all cross-reference patterns, and all property blocks. Derive content from the `.langium` grammar, validator, and test fixtures.

**Rationale**: The grammar has a rich feature set with 8+ element types, 7+ enum categories, qualified cross-references, and multi-file support. End users need documentation for every keyword and construct they can use. Test fixtures provide validated examples that can be adapted for documentation.

**Sources**:
- Grammar: `packages/langium/src/actone.langium`
- Validator: `packages/langium/src/services/actone-validator.ts`
- Test fixtures: `packages/langium/tests/fixtures/` (minimal, full-story, multi-file, large-project)
