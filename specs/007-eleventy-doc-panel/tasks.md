# Tasks: Eleventy Documentation with In-App Fly-out Panel

**Input**: Design documents from `/specs/007-eleventy-doc-panel/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test tasks included (not explicitly requested in feature specification).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the guide workspace package and monorepo integration

- [x] T001 Create `guide/package.json` with Eleventy 3.1.x, @11ty/eleventy-navigation, `"type": "module"`, and build/dev/clean scripts
- [x] T002 Add `guide` to `pnpm-workspace.yaml` packages list
- [x] T003 [P] Add `guide/_site/` to `.gitignore`
- [x] T004 [P] Add `guide:build` and `guide:dev` scripts to root `package.json`
- [x] T005 Run `pnpm install` to link the new guide workspace package

---

## Phase 2: Foundational (Eleventy Infrastructure)

**Purpose**: Eleventy configuration, templates, and CSS that ALL content and integration stories depend on

**CRITICAL**: No content or integration work can begin until this phase is complete

### Eleventy Configuration

- [x] T006 Create `guide/eleventy.config.js` with ESM config: pathPrefix `/guide/`, navigation plugin, custom `sectionPages`/`prevInSection`/`nextInSection` filters, passthrough copy for CSS, template formats (md, njk, html), and markdownTemplateEngine `njk`

### Data Files

- [x] T007 [P] Create `guide/src/_data/site.json` with title "ActOne Guide" and site description
- [x] T008 [P] Create `guide/src/_data/year.js` exporting dynamic copyright year
- [x] T009 [P] Create `guide/src/_data/navigation.json` with all 4 sections (getting-started, user-guide, language-reference, reference) and their page entries

### Templates

- [x] T010 Create `guide/src/_includes/layouts/base.njk` master layout wrapping content in `<article>` element, with head (meta, CSS link, theme init script), nav partial, page-wrapper (sidebar + main-content with breadcrumb + article + prev/next nav), footer partial, and theme toggle script
- [x] T011 [P] Create `guide/src/_includes/partials/nav.njk` header with site brand link and theme toggle button (sun/moon SVG icons)
- [x] T012 [P] Create `guide/src/_includes/partials/sidebar.njk` with sections loop from `navigation.sections`, section titles, nav links with active state detection
- [x] T013 [P] Create `guide/src/_includes/partials/breadcrumb.njk` showing Guide > Section > Page trail
- [x] T014 [P] Create `guide/src/_includes/partials/footer.njk` with copyright year and project name

### CSS Architecture

- [x] T015 Create `guide/src/css/main.css` importing reset, variables, typography, layout, and components CSS files
- [x] T016 [P] Create `guide/src/css/reset.css` with box-sizing, margins, and base resets
- [x] T017 [P] Create `guide/src/css/variables.css` with 100+ CSS custom properties: colors (primary, text, bg, link, code, border), typography (font families, size scale sm–4xl), spacing scale (space-1 through space-16), layout dimensions (sidebar-width 280px, header-height 64px, content-max-width 780px), shadows, and dark mode overrides under `[data-theme='dark']`
- [x] T018 [P] Create `guide/src/css/typography.css` with body, headings h1–h6, links, lists, inline code, code blocks, blockquotes, and horizontal rule styles
- [x] T019 [P] Create `guide/src/css/layout.css` with header (sticky, 64px), sidebar (280px, sticky, scroll-y), main-content (max 780px, padded), page-wrapper grid, footer, and responsive breakpoint at 900px (sidebar collapses to horizontal band)
- [x] T020 [P] Create `guide/src/css/components.css` with breadcrumb, callout blocks (tip/info/warning/danger with colored borders and icons), tables, prev/next navigation, landing page sections (hero, section grid), formula blocks, and definition lists

### Section Defaults

- [x] T021 [P] Create `guide/src/getting-started/getting-started.json` with layout, tags, and section defaults
- [x] T022 [P] Create `guide/src/user-guide/user-guide.json` with layout, tags, and section defaults
- [x] T023 [P] Create `guide/src/language-reference/language-reference.json` with layout, tags, and section defaults
- [x] T024 [P] Create `guide/src/reference/reference.json` with layout, tags, and section defaults

### Verification

- [x] T025 Build the guide (`pnpm --filter actone-guide build`) and verify `guide/_site/index.html` exists with correct pathPrefix

**Checkpoint**: Eleventy infrastructure complete — content can now be authored and the guide builds successfully

---

## Phase 3: User Story 1 - Browse Documentation in Standalone Site (Priority: P1) MVP

**Goal**: A complete, navigable documentation site at `/guide/` with sidebar navigation, breadcrumbs, theme toggle, and prev/next page navigation across Getting Started, User Guide, and Reference sections.

**Independent Test**: Build the guide (`pnpm --filter actone-guide build`), run Eleventy dev server (`pnpm --filter actone-guide dev`), browse `http://localhost:8080/guide/` — verify landing page, sidebar nav, page navigation, theme toggle, breadcrumbs, and prev/next all work correctly.

### Landing Page

- [x] T026 [US1] Create `guide/src/index.md` landing page with hero section, section overview cards linking to each section's first page, and brief site description

### Getting Started Section (4 pages)

- [x] T027 [P] [US1] Create `guide/src/getting-started/01-introduction.md` — what ActOne is, who it's for, how the guide is organized (front matter: title, order: 1, description)
- [x] T028 [P] [US1] Create `guide/src/getting-started/02-core-concepts.md` — fundamental concepts: stories, characters, worlds, scenes, timelines, plots (derived from grammar element types)
- [x] T029 [P] [US1] Create `guide/src/getting-started/03-quick-tour.md` — visual walkthrough of the ActOne Studio UI: editor, outline, diagram, problems panel, export
- [x] T030 [P] [US1] Create `guide/src/getting-started/04-first-story.md` — step-by-step guide to creating a minimal ActOne story with a character, world, and scene

### User Guide Section (4 pages)

- [x] T031 [P] [US1] Create `guide/src/user-guide/01-projects.md` — creating, opening, and managing projects in ActOne Studio
- [x] T032 [P] [US1] Create `guide/src/user-guide/02-editor.md` — using the code editor: syntax highlighting, auto-complete, formatting, save behavior
- [x] T033 [P] [US1] Create `guide/src/user-guide/03-multi-file.md` — multi-file projects: composition modes (merge, overlay, sequential), file management, cross-file references
- [x] T034 [P] [US1] Create `guide/src/user-guide/04-diagrams-export.md` — diagram panel, export formats (DOCX, PDF), and output panel

### Reference Section (2 pages)

- [x] T035 [P] [US1] Create `guide/src/reference/glossary.md` — comprehensive glossary of ActOne terms using definition lists (`<dt>`/`<dd>`)
- [x] T036 [P] [US1] Create `guide/src/reference/troubleshooting.md` — common problems and solutions: parse errors, reference resolution failures, export issues

### Verification

- [x] T037 [US1] Build guide and verify all pages: landing page renders with section links, all 10 content pages load with correct breadcrumbs, sidebar shows active states, prev/next navigation links work within each section, theme toggle persists across page loads

**Checkpoint**: Standalone documentation site is fully functional — users can browse all sections, navigate with sidebar/prev-next, and toggle themes

---

## Phase 4: User Story 3 - Serve Guide in Development via Vite Plugin (Priority: P2)

**Goal**: Guide pages accessible at `http://localhost:54530/guide/` through the SvelteKit dev server during development, without running a separate Eleventy server.

**Independent Test**: Build the guide once, start the SvelteKit dev server (`pnpm --filter studio dev`), navigate to `http://localhost:54530/guide/` — guide renders correctly with all CSS and page navigation working.

**Dependencies**: Requires Phase 3 (US1) complete — guide must have built content to serve.

### Implementation

- [x] T038a [US3] Add `"actone-guide": "workspace:*"` to `devDependencies` in `apps/studio/package.json` and run `pnpm install` to link the guide workspace
- [x] T038 [US3] Add `serveGuide()` Vite plugin function in `apps/studio/vite.config.ts`: intercept `/guide/*` requests, resolve to `guide/_site/`, strip query strings, append `index.html` for directory URLs, validate path traversal, serve with correct MIME types (per contracts/vite-plugin.md), fall through to `next()` on miss. Register plugin before `sveltekit()` in the plugins array.

### Verification

- [ ] T039 [US3] Start SvelteKit dev server, verify `/guide/` loads the landing page, `/guide/getting-started/01-introduction/` loads with CSS, and `/guide/css/main.css` serves with correct Content-Type

**Checkpoint**: Guide is accessible via SvelteKit dev server — the in-app panel can now fetch guide content

---

## Phase 5: User Story 2 - Access Documentation In-App via Fly-out Panel (Priority: P2)

**Goal**: A resizable fly-out panel in the ActOne Studio app that fetches and displays guide pages inline, with in-panel navigation, hash link scrolling, external link handling, Escape-to-close, and localStorage persistence.

**Independent Test**: Open ActOne Studio, trigger the documentation panel (help button or programmatic call), verify content loads, click an internal guide link (navigates in-panel), click a hash link (smooth-scrolls), resize the panel (persists width), press Escape (closes), reopen (remembers last page and width).

**Dependencies**: Requires Phase 4 (US3) complete — panel fetches from `/guide/*` served by the Vite plugin.

### Implementation

- [x] T040 [P] [US2] Create `apps/studio/src/lib/stores/doc-panel.svelte.ts` — Svelte 5 runes singleton per contracts/doc-panel-state.md: `$state` for open, docSlug, docHtml, loading, error, width; methods openDoc(slug), close(), toggle(), setWidth(value), handleContentClick(e, contentEl), urlToSlug(url), isActiveDoc(url); localStorage persistence under key `actone-doc-panel`; getDocPanelState() and initDocPanelState() exports
- [x] T041 [P] [US2] Create `apps/studio/src/lib/components/guide-panel.css` — scoped panel styles (~470 lines) under `.guide-content` class: `--gc-*` CSS custom properties, light mode defaults, dark mode overrides under `:root.dark .guide-content`, typography (0.875rem base), headings, links, code blocks, tables, callout blocks (tip/info/warning/danger), prev/next nav, breadcrumb hidden, formula blocks, definition lists, blockquotes, responsive adjustments
- [x] T042 [US2] Create `apps/studio/src/lib/components/DocPanel.svelte` — fly-out panel component: conditionally renders when `docPanel.open`, header with title + external-link icon + close button (X), scrollable `.guide-content` content area with loading spinner and error state, right-edge resize handle (pointer events, 280–800px range), body class management during drag (select-none, cursor-col-resize), Escape key handler via `<svelte:window>`, scroll-to-top on content change, imports guide-panel.css
- [x] T043 [US2] Modify `apps/studio/src/routes/+layout.svelte` — import and render `<DocPanel />` in the root layout as a sibling to the dockview container inside the main flex container; call `initDocPanelState()` on mount
- [x] T044 [US2] Add a documentation trigger button in the app UI — add a help/docs icon button (e.g., in the MenuBar or StatusBar) that calls `docPanel.openDoc('getting-started/01-introduction')` or `docPanel.toggle()`

### Verification

- [ ] T045 [US2] Verify panel lifecycle: open via trigger → content loads → click internal link → navigates in-panel → click hash link → smooth-scrolls → click external link → opens new tab → resize → width persists → Escape → closes → reopen → remembers page and width

**Checkpoint**: In-app documentation panel fully functional — users can read docs without leaving the studio

---

## Phase 6: User Story 4 - Include Guide in Production Build (Priority: P3)

**Goal**: Guide static files included in the production build output so `/guide/*` routes work in production without a separate server.

**Independent Test**: Run the full production build, verify `apps/studio/build/client/guide/index.html` exists, start the production server (`node build`), navigate to `/guide/` — documentation loads.

**Dependencies**: Requires Phase 3 (US1) complete — guide must be built before it can be copied.

### Implementation

- [x] T046 [US4] Add a `postbuild` script to `apps/studio/package.json` that runs after `vite build`: build the guide (`pnpm --filter actone-guide build`), then copy `guide/_site/*` into `apps/studio/build/client/guide/` using `cp -r`
- [x] T047 [US4] Verify the production build pipeline: run `pnpm --filter studio build`, confirm guide files exist in `build/client/guide/`, start preview server and verify `/guide/` loads correctly

**Checkpoint**: Production deployment includes the guide — no additional configuration needed

---

## Phase 7: User Story 5 - ActOne Language Reference Documentation (Priority: P3)

**Goal**: A comprehensive language reference section in the guide documenting every grammar element, keyword, cross-reference pattern, enum type, and validation rule in the ActOne DSL, with realistic code examples from multiple domains.

**Independent Test**: Navigate to the Language Reference section, verify all 5 pages exist with substantial content, check that every grammar element type is documented, verify all code examples are syntactically valid ActOne.

**Dependencies**: Requires Phase 2 (Foundational) complete — guide infrastructure must exist. Can be worked on in parallel with Phases 4–6.

### Implementation

- [x] T048 [P] [US5] Create `guide/src/language-reference/01-language-overview.md` — what ActOne DSL is for (narrative design), who uses it, simplest valid document (minimal story), realistic full example, document structure overview (Document → Story → StoryElements, standalone elements for multi-file), derived from `packages/langium/src/actone.langium` entry rule
- [x] T049 [P] [US5] Create `guide/src/language-reference/02-syntax-reference.md` — document structure (Document, Story), all keywords grouped by category (declarations: story/character/world/scene/timeline/plot/theme/interaction/generate; property keywords: nature/bio/role/voice/personality/etc.; enum values: CharacterNature/GoalPriority/RuleCategory/TimelineStructure/SceneType/PovType/PacingType/TenseType/TransitionType/BeatType/ConflictType/ResolutionPattern), data types (ID, STRING, NUMBER, SignedInt, BooleanLiteral, DefinitionName), comments (single-line `//`, multi-line `/* */`), naming rules (bare identifiers vs quoted strings)
- [x] T050 [P] [US5] Create `guide/src/language-reference/03-element-reference.md` — one subsection per element type (GenerateBlock, ThemeDef, CharacterDef, WorldDef, TimelineDef, SceneDef, PlotDef, InteractionDef): purpose, complete syntax with all properties, required vs optional fields, cross-reference relationships (`[CharacterDef:DefinitionName]`, `[LocationEntry:DefinitionName]`, qualified `world=[WorldDef] '.' location=[LocationEntry]`, `[SceneDef:DefinitionName]`, `[TimelineLayer:DefinitionName]`), validation rules from `packages/langium/src/services/actone-validator.ts`, complete examples
- [x] T051 [P] [US5] Create `guide/src/language-reference/04-use-cases.md` — at least 4 complete, valid ActOne documents targeting different domains: (1) simple single-character story, (2) complex multi-character drama with relationships and arcs, (3) science fiction world with parallel timelines, (4) multi-file project demonstrating cross-file references. Each with scenario description, full code, annotations, and expected behavior
- [x] T052 [P] [US5] Create `guide/src/language-reference/05-best-practices.md` — naming conventions (characters: proper nouns; locations: descriptive names; scenes: action-oriented), document organization patterns (single-file vs multi-file, when to split), common patterns (relationship webs, temporal layering, subplot convergence), anti-patterns (overly deep nesting, orphaned cross-references), and multi-file composition tips (merge vs overlay vs sequential)

### Verification

- [x] T053 [US5] Rebuild guide, navigate to all 5 language reference pages, verify substantial content on each, check that all 8 element types are documented in element reference, validate that code examples follow the ActOne grammar structure

**Checkpoint**: Language reference complete — every grammar element, keyword, and validation rule is documented

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all stories

- [x] T054 Run `pnpm turbo build` from repo root and verify no errors
- [x] T055 Run `prettier --check .` and fix any formatting issues in new files
- [x] T056 [P] Verify guide accessibility: check color contrast in both themes, verify all images have alt text, verify keyboard navigation works for sidebar and theme toggle. Run `npx lighthouse http://localhost:8080/guide/ --output=json --chrome-flags="--headless"` and verify accessibility score ≥ 90 (SC-008)
- [x] T057 [P] Verify CSS isolation: open the panel alongside the studio editor, confirm no style leakage between guide content and Tailwind-styled app UI in both light and dark modes
- [x] T058 Run quickstart.md validation: follow all steps in `specs/007-eleventy-doc-panel/quickstart.md` and confirm each produces the expected result

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all content and integration work
- **US1 Standalone Site (Phase 3)**: Depends on Foundational (Phase 2) — BLOCKS US3 and US2
- **US3 Vite Plugin (Phase 4)**: Depends on US1 (Phase 3) — BLOCKS US2
- **US2 Fly-out Panel (Phase 5)**: Depends on US3 (Phase 4) — needs `/guide/*` serving to function
- **US4 Production Build (Phase 6)**: Depends on US1 (Phase 3) — can run in parallel with Phases 4-5
- **US5 Language Reference (Phase 7)**: Depends on Foundational (Phase 2) — can run in parallel with Phases 3-6
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```text
Phase 1: Setup
    │
    ▼
Phase 2: Foundational (Eleventy infra)
    │
    ├──────────────────────────┐
    ▼                          ▼
Phase 3: US1 (Standalone)   Phase 7: US5 (Language Ref) ← parallel
    │
    ├──────────────┐
    ▼              ▼
Phase 4: US3    Phase 6: US4 (Production) ← parallel
(Vite Plugin)
    │
    ▼
Phase 5: US2 (Fly-out Panel)
    │
    ▼
Phase 8: Polish (after all complete)
```

### Within Each User Story

- Content pages within a section can be written in parallel (marked [P])
- Template/config tasks must complete before content tasks
- Verification tasks must run after all implementation tasks in that story

### Parallel Opportunities

**Phase 2 (Foundational)**: T007–T009 data files in parallel; T011–T014 partials in parallel; T016–T020 CSS files in parallel; T021–T024 section defaults in parallel

**Phase 3 (US1)**: T027–T030 Getting Started pages in parallel; T031–T034 User Guide pages in parallel; T035–T036 Reference pages in parallel

**Phase 5 (US2)**: T040 (state store) and T041 (CSS) in parallel

**Phase 7 (US5)**: T048–T052 all 5 language reference pages in parallel

**Cross-phase**: US5 (Phase 7) can run in parallel with US1 (Phase 3), US3 (Phase 4), US2 (Phase 5), and US4 (Phase 6)

---

## Parallel Example: Phase 2 (Foundational)

```text
# Batch 1: Data files (after T006 config)
Task T007: Create guide/src/_data/site.json
Task T008: Create guide/src/_data/year.js
Task T009: Create guide/src/_data/navigation.json

# Batch 2: Partials (after T010 base layout)
Task T011: Create guide/src/_includes/partials/nav.njk
Task T012: Create guide/src/_includes/partials/sidebar.njk
Task T013: Create guide/src/_includes/partials/breadcrumb.njk
Task T014: Create guide/src/_includes/partials/footer.njk

# Batch 3: CSS files (after T015 main.css)
Task T016: Create guide/src/css/reset.css
Task T017: Create guide/src/css/variables.css
Task T018: Create guide/src/css/typography.css
Task T019: Create guide/src/css/layout.css
Task T020: Create guide/src/css/components.css

# Batch 4: Section defaults (independent)
Task T021: Create guide/src/getting-started/getting-started.json
Task T022: Create guide/src/user-guide/user-guide.json
Task T023: Create guide/src/language-reference/language-reference.json
Task T024: Create guide/src/reference/reference.json
```

## Parallel Example: Phase 3 (US1 Content)

```text
# All content pages within a section can be written simultaneously
Task T027: Create guide/src/getting-started/01-introduction.md
Task T028: Create guide/src/getting-started/02-core-concepts.md
Task T029: Create guide/src/getting-started/03-quick-tour.md
Task T030: Create guide/src/getting-started/04-first-story.md
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Eleventy infrastructure)
3. Complete Phase 3: User Story 1 (Standalone documentation site)
4. **STOP and VALIDATE**: Build and browse the guide at `http://localhost:8080/guide/`
5. The standalone guide is independently valuable — can be shared and used immediately

### Incremental Delivery

1. Setup + Foundational → Guide infrastructure ready
2. Add US1 (Standalone Site) → Test independently → **MVP!** (browsable documentation)
3. Add US3 (Vite Plugin) → Guide accessible via SvelteKit dev server
4. Add US2 (Fly-out Panel) → In-app documentation experience complete
5. Add US4 (Production Build) → Guide works in production deployment
6. Add US5 (Language Reference) → Comprehensive DSL documentation
7. Each story adds value without breaking previous stories

### Content Authoring Note

US5 (Language Reference) can be started as soon as Foundational completes and worked on in parallel with all other phases. This is the most content-heavy work and benefits from early start.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- The reference specification at `eleventy-doc-panel-spec.md` (repo root) contains detailed implementation examples for all templates, CSS, and components — use it as the primary implementation reference
- Content pages must target end users of ActOne Studio, not developers
- All ActOne code examples in language reference must be syntactically valid per the grammar at `packages/langium/src/actone.langium`
- Guide CSS uses plain CSS with custom properties — NOT Tailwind
- Commit after each phase or logical group of tasks
