# Implementation Plan: Eleventy Documentation with In-App Fly-out Panel

**Branch**: `007-eleventy-doc-panel` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-eleventy-doc-panel/spec.md`

## Summary

Add an Eleventy-powered documentation site to the ActOne monorepo, served at `/guide/` both as a standalone site and within the ActOne Studio app via a resizable fly-out panel. The guide includes a comprehensive ActOne language reference derived from the Langium grammar. During development, a Vite plugin serves the guide from Eleventy's build output. In production, the guide's static files are copied into SvelteKit's build output. The fly-out panel fetches pre-rendered HTML, extracts `<article>` content, and renders it with scoped CSS to prevent style conflicts with Tailwind.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2022 target, Bundler module resolution) + JavaScript ESM for Eleventy config/data files
**Primary Dependencies**: Eleventy 3.1.x, @11ty/eleventy-navigation, SvelteKit 2.53.x, Svelte 5.53.x (runes), Vite 7.0.0, Tailwind CSS 4.2.x, lucide-svelte, dockview-core 5.0.0
**Storage**: localStorage (panel state persistence), static files (guide content)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web (browser) — SvelteKit with adapter-node
**Project Type**: Static documentation site (Eleventy) + Web application integration (SvelteKit)
**Performance Goals**: Panel opens and displays content within 1 second; guide pages are static HTML (instant load)
**Constraints**: CSS isolation between guide content and host app Tailwind styles; guide CSS uses plain CSS with custom properties (no Tailwind); content wraps in `<article>` for panel extraction
**Scale/Scope**: ~20-40 documentation pages across 4-5 sections; 8 grammar element types to document in language reference

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode & Pure ESM | PASS | Studio code is TypeScript strict. Eleventy config uses JavaScript ESM — same precedent as `svelte.config.js`. Content files (markdown, Nunjucks) are not source code. |
| II. Monorepo Discipline | PASS | Guide added to `pnpm-workspace.yaml` as workspace package. Independently buildable via `pnpm --filter actone-guide build`. |
| III. Quality Gates | PASS | Guide build integrated into Turborepo pipeline. Prettier can check markdown files. |
| IV. Forward-Only Versioning | PASS | Using latest Eleventy 3.1.x and all current dependency versions. |
| V. Complete Solutions | PASS | Full implementation per reference specification — no shortcuts. |
| VI. Single Source of Truth | PASS | No shared domain types defined. DocPanelState is component-local. |
| VII. Boundary Validation | PASS | Panel validates fetch response (`response.ok`). localStorage reads wrapped in try/catch with fallback defaults. Vite plugin validates paths against traversal. |
| VIII. TypeScript Computes; Claude Interprets | N/A | No LLM integration in this feature. |

**Post-Phase 1 re-check**: All gates still pass. No design decisions introduced violations.

## Project Structure

### Documentation (this feature)

```text
specs/007-eleventy-doc-panel/
├── plan.md              # This file
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: developer quickstart
├── contracts/
│   ├── doc-panel-state.md    # Panel state API contract
│   ├── vite-plugin.md        # Vite guide serving plugin contract
│   └── guide-html-structure.md  # HTML structure contract for extraction
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
guide/                                    # NEW: Eleventy documentation site
├── package.json                          # Eleventy 3.1.x + navigation plugin
├── eleventy.config.js                    # ESM config with custom filters
├── src/
│   ├── _data/
│   │   ├── navigation.json              # Sidebar navigation tree
│   │   ├── site.json                    # Site title + description
│   │   └── year.js                      # Dynamic copyright year
│   ├── _includes/
│   │   ├── layouts/
│   │   │   └── base.njk                 # Master layout (<article> wrapper)
│   │   └── partials/
│   │       ├── nav.njk                  # Header + theme toggle
│   │       ├── sidebar.njk              # Sidebar navigation
│   │       ├── breadcrumb.njk           # Breadcrumb trail
│   │       └── footer.njk              # Footer
│   ├── css/
│   │   ├── main.css                     # Import orchestrator
│   │   ├── reset.css                    # CSS reset
│   │   ├── variables.css                # 100+ CSS custom properties
│   │   ├── typography.css               # Text styles
│   │   ├── layout.css                   # Grid layout + responsive
│   │   └── components.css               # Callouts, tables, prev/next
│   ├── index.md                         # Landing page
│   ├── getting-started/                 # Section: Getting Started
│   │   ├── getting-started.json
│   │   ├── 01-introduction.md
│   │   ├── 02-core-concepts.md
│   │   ├── 03-quick-tour.md
│   │   └── 04-first-story.md
│   ├── user-guide/                      # Section: User Guide
│   │   ├── user-guide.json
│   │   ├── 01-projects.md
│   │   ├── 02-editor.md
│   │   ├── 03-multi-file.md
│   │   └── 04-diagrams-export.md
│   ├── language-reference/              # Section: Language Reference
│   │   ├── language-reference.json
│   │   ├── 01-language-overview.md
│   │   ├── 02-syntax-reference.md
│   │   ├── 03-element-reference.md
│   │   ├── 04-use-cases.md
│   │   └── 05-best-practices.md
│   └── reference/                       # Section: Reference
│       ├── reference.json
│       ├── glossary.md
│       └── troubleshooting.md
└── _site/                               # Build output (gitignored)

apps/studio/                             # MODIFIED: SvelteKit studio app
├── vite.config.ts                       # + serveGuide() Vite plugin
├── src/
│   ├── lib/
│   │   ├── stores/
│   │   │   └── doc-panel.svelte.ts      # NEW: panel state singleton
│   │   └── components/
│   │       ├── DocPanel.svelte          # NEW: fly-out panel component
│   │       └── guide-panel.css          # NEW: scoped panel styles (~470 lines)
│   └── routes/
│       └── +layout.svelte               # MODIFIED: add DocPanel to layout
└── package.json                         # + actone-guide as workspace dependency

pnpm-workspace.yaml                      # MODIFIED: add guide to workspaces
.gitignore                               # MODIFIED: add guide/_site/
package.json (root)                      # MODIFIED: add guide:build, guide:dev scripts
```

**Structure Decision**: Two-part feature spanning a new `guide/` workspace package (Eleventy static site) and modifications to the existing `apps/studio/` SvelteKit app (Vite plugin, panel component, layout integration). This follows monorepo discipline — the guide is an independent, buildable package; the studio consumes its output.

## Complexity Tracking

No constitution violations to justify. All design decisions align with existing patterns and principles.
