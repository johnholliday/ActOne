# Test Plan: ActOne Studio

**Feature Branch**: `002-actone-studio`
**Created**: 2026-02-26
**Framework**: Vitest (unit/integration), Playwright (E2E)
**Success Criteria**: SC-001 through SC-010

---

## Phase 0: Test Infrastructure Setup

### Step 0.1 — Vitest Configuration

1. Create `apps/studio/vitest.config.ts` with SvelteKit aliases (`$lib`, `$env`, `@repo/*`)
2. Create `packages/shared/vitest.config.ts` for shared package tests
3. Create `packages/langium/vitest.config.ts` for grammar/LSP tests
4. Add `"test": "vitest run"` script to each `package.json`
5. Add `"test"` task to `turbo.json` pipeline with `dependsOn: ["^build"]`
6. Add `"test:watch": "vitest"` for development
7. Verify: `pnpm test` runs across all packages from root

### Step 0.2 — Test Utilities & Fixtures

1. Create `apps/studio/tests/fixtures/` with sample `.actone` files:
   - `minimal.actone` — single character, single scene (smoke test baseline)
   - `full-story.actone` — 5+ characters, 3 worlds, 4 themes, 2 timelines, 10+ scenes, 2 plots, 3 interactions, 1 generate block
   - `invalid-values.actone` — personality trait 150, weight 200, self-relationship, duplicate generate block
   - `multi-file/entry.actone` + `multi-file/characters.actone` + `multi-file/worlds.actone` — multi-file project
   - `large-project/` — 50 characters, 100 scenes, 10 files (for SC-010 performance testing)
2. Create `apps/studio/tests/helpers/` with:
   - `mock-db.ts` — in-memory Drizzle adapter or vi.mock for `$lib/server/db`
   - `mock-supabase.ts` — mock Supabase client (auth, storage)
   - `mock-backends.ts` — mock AI text/image backends returning canned responses
   - `parse-fixture.ts` — helper to parse `.actone` fixture files through Langium
   - `create-test-project.ts` — helper to set up a project with files in mock DB
3. Create `packages/langium/tests/helpers/`:
   - `parse-helper.ts` — initialize Langium services and parse a string into AST

### Step 0.3 — Playwright Setup (E2E)

1. Install `@playwright/test` in `apps/studio`
2. Create `apps/studio/playwright.config.ts` pointing to dev server
3. Create `apps/studio/tests/e2e/` directory with auth fixtures
4. Verify: `pnpm exec playwright test` launches browser against dev server

---

## Phase 1: Unit Tests — Shared Package (`packages/shared`)

### Step 1.1 — Drizzle Schema Validation

**File**: `packages/shared/tests/db/schema.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | All table exports are valid Drizzle table objects | Schema integrity |
| 2 | `projects` table has correct columns (id, title, authorName, genre, grammarVersion, grammarFingerprint, compositionMode, publishingMode, lifecycleStage, userId, createdAt, updatedAt) | FR-010, FR-013 |
| 3 | `sourceFiles` table has correct columns (id, projectId, filePath, content, isEntry, userId, createdAt, updatedAt) | FR-011 |
| 4 | `snapshots` table has correct columns (id, projectId, tag, stage, wordCount, sceneCount, characterCount, notes, userId, capturedAt) | FR-014 |
| 5 | `draftVersions` table has correct columns (id, projectId, sceneName, paragraphIndex, content, status, backend, model, temperature, tokenCount, costUsd, userId, createdAt) | FR-034 |
| 6 | `assets` table has correct columns (id, projectId, type, name, status, prompt, backend, metadata, storageUrl, userId, createdAt) | FR-044 |
| 7 | `analyticsSnapshots` table has correct columns (id, projectId, wordCount, sceneCount, characterCount, metrics, userId, capturedAt) | FR-014 |
| 8 | Enum types match expected values (compositionMode, lifecycleStage, publishingMode, sceneType, etc.) | Data model enums |

### Step 1.2 — Zod Schema Validation

**File**: `packages/shared/tests/db/schemas.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Insert project schema accepts valid project data | FR-010 |
| 2 | Insert project schema rejects missing required fields (title) | Input validation |
| 3 | Insert draft schema validates status enum (pending/accepted/rejected/editing) | FR-034 |
| 4 | Insert asset schema validates type enum (portrait/cover/scene/style-board/chapter-header/panel) | FR-040 |
| 5 | Insert snapshot schema validates stage enum | FR-013 |
| 6 | Select schemas include auto-generated fields (id, createdAt) | Schema completeness |

### Step 1.3 — Constants & Type Guards

**File**: `packages/shared/tests/constants.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Scene type colors map every scene type to a valid hex color | FR-019 |
| 2 | Beat type colors map every beat type to a valid hex color | FR-019 |
| 3 | Character nature colors map every nature to a valid hex color | FR-020 |
| 4 | Validation constants define correct ranges (personality: 0–100, weight: −100–100, temperature: 0.0–2.0, mood: 0–100, continuity loss: 0.0–1.0) | FR-003 |
| 5 | All enum constant arrays are non-empty and have no duplicates | Data integrity |

---

## Phase 2: Unit Tests — Langium Grammar (`packages/langium`)

### Step 2.1 — Parser (Grammar Acceptance)

**File**: `packages/langium/tests/parser.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Parses minimal story: `story "Test" { }` | Grammar baseline |
| 2 | Parses character with all properties (nature, bio, role, voice, personality, quirks, goals, relationships, arc, symbols, secret, notes) | FR-001 |
| 3 | Parses world with period, sensory details, locations (atmosphere, connects_to), and rules (category) | FR-001 |
| 4 | Parses theme with statement, motifs, counter_theme, tension | FR-001 |
| 5 | Parses timeline with structure_type, span, and layers (description, period) | FR-001 |
| 6 | Parses scene with all properties (type, location, pov, timeline_layer, participants, atmosphere, objective, trigger, transition) | FR-001 |
| 7 | Parses plot with conflict_type, resolution_pattern, beats (description, type, act), subplots | FR-001 |
| 8 | Parses interaction with participants, pattern, style_mix, subtext, power_dynamic, emotional_arc | FR-001 |
| 9 | Parses generate block with temperature, max_tokens, continuity_loss, style_bleed, genre, tones, tense, default_pov, pacing, chapter_breaks | FR-001 |
| 10 | Parses line comments (`//`) and block comments (`/* */`) | FR-009 |
| 11 | Rejects syntactically invalid input (missing braces, unclosed strings) | Error handling |
| 12 | Parses the `full-story.actone` fixture without errors | Comprehensive validation |

### Step 2.2 — Validator (Semantic Rules)

**File**: `packages/langium/tests/validator.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Error on personality trait value < 0 | FR-003 |
| 2 | Error on personality trait value > 100 | FR-003, US1-AS2 |
| 3 | Error on relationship weight < −100 | FR-003 |
| 4 | Error on relationship weight > 100 | FR-003 |
| 5 | Error on temperature < 0.0 | FR-003 |
| 6 | Error on temperature > 2.0 | FR-003 |
| 7 | Error on continuity_loss < 0.0 | FR-003 |
| 8 | Error on continuity_loss > 1.0 | FR-003 |
| 9 | Error on mood value < 0 | FR-003 |
| 10 | Error on mood value > 100 | FR-003 |
| 11 | Error on duplicate generate blocks in one story | FR-003, US1-AS7 |
| 12 | Error on self-relationship (character references itself in `to:`) | FR-003, US1-AS8 |
| 13 | Error on scene participant referencing undefined character | FR-003, US1-AS10 |
| 14 | No errors on valid full-story fixture | Positive validation |
| 15 | Error on personality trait value at boundary+1 (101) | Boundary testing |
| 16 | No error on personality trait value at boundary (0 and 100) | Boundary testing |
| 17 | No error on relationship weight at boundaries (−100 and 100) | Boundary testing |

### Step 2.3 — Scope Provider (Cross-References)

**File**: `packages/langium/tests/scope.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Character name resolves in scene `participants` | FR-004, FR-006 |
| 2 | Character name resolves in scene `pov` | FR-004 |
| 3 | Character name resolves in relationship `to:` | FR-004 |
| 4 | Character name resolves in interaction `participants` | FR-004 |
| 5 | Location name resolves in scene `location:` | FR-004 |
| 6 | Location name resolves in `connects_to:` | FR-004 |
| 7 | Timeline layer name resolves in scene `timeline_layer:` | FR-004 |
| 8 | Scene name resolves in subplot `convergence_scene:` | FR-004 |
| 9 | Unresolved reference produces linking error | FR-003 |

### Step 2.4 — Completion Provider

**File**: `packages/langium/tests/completion.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Suggests character names inside `participants: [` | FR-004, US1-AS3, SC-004 |
| 2 | Suggests character names after `pov:` | FR-004, SC-004 |
| 3 | Suggests character names after `to:` in relationships | FR-004, SC-004 |
| 4 | Suggests scene type enum values after `type:` in scene | FR-004 |
| 5 | Suggests nature enum values after `nature:` in character | FR-004 |
| 6 | Suggests structure_type enum values after `structure_type:` | FR-004 |
| 7 | Suggests keywords at top level (character, world, theme, etc.) | FR-004 |
| 8 | Does NOT suggest character names in non-reference contexts | SC-004 |
| 9 | Suggests location names after `location:` in scene | FR-004 |

### Step 2.5 — Hover Provider

**File**: `packages/langium/tests/hover.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Character hover shows nature, bio excerpt, top 3 traits, arc phase, relationship count | FR-005, US1-AS9 |
| 2 | Scene hover shows type, participants, location | FR-005 |
| 3 | Theme hover shows statement, tension, motifs | FR-005 |
| 4 | World hover shows period and location count | FR-005 |
| 5 | No hover on whitespace/comments | Edge case |

### Step 2.6 — Formatter

**File**: `packages/langium/tests/formatter.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Normalizes to 2-space indentation from 4-space | FR-007, US1-AS6 |
| 2 | Normalizes to 2-space indentation from tabs | FR-007 |
| 3 | Reduces >2 blank lines between blocks to exactly 2 | FR-007 |
| 4 | Preserves string content (no whitespace changes inside quotes) | FR-007 |
| 5 | Preserves comment content | FR-007 |
| 6 | Idempotent: formatting an already-formatted file produces no changes | Stability |

### Step 2.7 — Semantic Tokens

**File**: `packages/langium/tests/semantic-tokens.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Keywords (`story`, `character`, `scene`, etc.) get keyword token type | FR-002 |
| 2 | Definition names get definition token type | FR-002 |
| 3 | Reference names get reference token type | FR-002 |
| 4 | String literals get string token type | FR-002 |
| 5 | Number literals get number token type | FR-002 |
| 6 | Comments get comment token type | FR-002 |

### Step 2.8 — Document Symbols

**File**: `packages/langium/tests/symbols.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Story appears as root symbol | FR-008 |
| 2 | Characters, worlds, scenes, etc. appear as nested children | FR-008 |
| 3 | Sub-elements (personality traits, locations, beats) appear as grandchildren | FR-008 |
| 4 | Symbol names match element names | FR-008 |

---

## Phase 3: Unit Tests — Studio Business Logic (`apps/studio`)

### Step 3.1 — Lifecycle State Machine

**File**: `apps/studio/tests/unit/project/lifecycle.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | `getValidTargets('concept')` returns `['draft']` | FR-013 |
| 2 | `getValidTargets('draft')` returns `['revision']` | FR-013 |
| 3 | `getValidTargets('revision')` returns `['final', 'draft']` or similar | FR-013 |
| 4 | `getValidTargets('final')` returns `['published', 'revision']` | FR-013 |
| 5 | `getValidTargets('published')` returns `[]` (terminal) | FR-013, Edge Case |
| 6 | `getStageLabel()` returns human-readable labels for all stages | UX |
| 7 | Invalid stage input throws or returns empty | Error handling |

### Step 3.2 — Analytics

**File**: `apps/studio/tests/unit/project/analytics.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | `extractAnalytics()` counts scenes correctly from fixture AST | US5-AS2 |
| 2 | `extractAnalytics()` counts characters correctly | US5-AS2 |
| 3 | `extractAnalytics()` estimates word count from text content | US5-AS2 |
| 4 | `extractAnalytics()` computes scene type distribution | US5-AS2 |
| 5 | `extractAnalytics()` computes character screen time (scene count per character) | US5-AS2 |
| 6 | `extractAnalytics()` generates pacing rhythm (scene type sequence) | US5-AS2 |
| 7 | `extractRelationshipMatrix()` extracts all character relationships with weight and label | US5-AS1 |
| 8 | Returns zero counts for empty story | Edge case |
| 9 | Returns correct counts for large story (50 characters, 100 scenes) | SC-010 |

### Step 3.3 — Composition Modes

**File**: `apps/studio/tests/unit/project/composition.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Merge mode: two files with unique names resolves all references | FR-011 |
| 2 | Merge mode: two files with duplicate character names produces error | FR-011, US2-AS2 |
| 3 | Overlay mode: last-defined character wins | FR-011 |
| 4 | Sequential mode: per-file namespaces, no cross-file resolution | FR-011 |
| 5 | Entry file is always first in resolution order | FR-012 |
| 6 | Non-entry files ordered alphabetically | FR-012 |

### Step 3.4 — Diagram Transformers

**File**: `apps/studio/tests/unit/diagrams/story-structure.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Each scene produces a node | FR-019 |
| 2 | Scene node color matches scene type color mapping | FR-019 |
| 3 | Beat edges connect scenes in order | FR-019 |
| 4 | Beat edge color matches beat type | FR-019 |
| 5 | Scenes grouped by chapter when chapter breaks exist | FR-019 |
| 6 | Empty story produces no nodes | Edge case |

**File**: `apps/studio/tests/unit/diagrams/character-network.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Each character produces a node | FR-020 |
| 2 | Node size proportional to scene participation count | FR-020 |
| 3 | Relationship weight > 0 produces green edge | FR-020 |
| 4 | Relationship weight < 0 produces red edge | FR-020 |
| 5 | Relationship weight = 0 produces gray edge | FR-020 |
| 6 | Dynamic relationship produces dashed edge | FR-020 |
| 7 | Weight at boundary (60) applies correct color | Edge Case |

**File**: `apps/studio/tests/unit/diagrams/world-map.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Each world produces a container node | FR-021 |
| 2 | Each location produces a nested node inside its world | FR-021 |
| 3 | Location color derived from atmosphere mood values | FR-021 |
| 4 | `connects_to` edges link locations | FR-021 |
| 5 | Scene markers appear on locations where scenes occur | FR-021 |

**File**: `apps/studio/tests/unit/diagrams/timeline.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Each timeline layer produces a swim-lane | FR-022 |
| 2 | Scene blocks positioned in chronological order within lane | FR-022 |
| 3 | Scene block color matches scene type | FR-022 |
| 4 | Arc phase bands rendered behind content | FR-022 |

**File**: `apps/studio/tests/unit/diagrams/interaction-sequence.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Each participant produces a lifeline node | FR-023 |
| 2 | Pattern arrows appear for each exchange step | FR-023 |
| 3 | Style mix percentages displayed on arrows | FR-023 |

### Step 3.5 — Stable IDs & Text Edit Generation

**File**: `apps/studio/tests/unit/diagrams/stable-refs.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | `character:Elena` format for character elements | FR-027 |
| 2 | `scene:Opening` format for scene elements | FR-027 |
| 3 | Same AST produces same IDs on re-parse | FR-027 |
| 4 | Different elements produce different IDs (no collisions) | FR-027 |

**File**: `apps/studio/tests/unit/diagrams/text-edit-generator.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Create character generates valid `character Name { bio: "..." }` text | FR-026, SC-006 |
| 2 | Create scene generates valid `scene Name { type: Action }` text | FR-026, SC-006 |
| 3 | Delete character removes the correct text range | FR-026 |
| 4 | Rename character updates declaration and all references | FR-026, FR-006 |
| 5 | Generated text re-parses without errors | SC-006 |

**File**: `apps/studio/tests/unit/diagrams/conflict-resolver.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | No conflict when diagram edit and source edit target different elements | FR-028 |
| 2 | Conflict detected when both modify same element | FR-028 |
| 3 | Conflict resolution picks editor changes when selected | FR-028 |
| 4 | Conflict resolution picks diagram changes when selected | FR-028 |

### Step 3.6 — AI Context Assembly

**File**: `apps/studio/tests/unit/ai/context-assembler.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Never-truncated elements always included: scene, location, atmosphere, participants, voice, personality, interaction pattern | FR-031 |
| 2 | Progressively-summarized elements condensed under budget pressure: continuity, world rules | FR-031 |
| 3 | Dropped-first elements removed first under budget: non-participant bios, distant summaries | FR-031 |
| 4 | Total context stays within token budget | FR-031 |
| 5 | Scene with no participants produces context without character voice directives | Edge Case |

### Step 3.7 — AI Prompt Builder

**File**: `apps/studio/tests/unit/ai/prompt-builder.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Rich format includes full personality, structured sections, detailed character cards | FR-032 |
| 2 | Concise format includes top 3 traits only, abbreviated sections | FR-032 |
| 3 | Prompt includes scene objective, atmosphere, and location | FR-031 |
| 4 | Prompt includes interaction pattern when present | US4-AS5 |

### Step 3.8 — Cost Estimator

**File**: `apps/studio/tests/unit/ai/cost-estimator.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Estimates token count for a given context size | FR-037 |
| 2 | Estimates USD cost based on backend pricing | FR-037 |
| 3 | Different backends produce different cost estimates | FR-037 |
| 4 | Zero-length context returns zero cost | Edge case |

### Step 3.9 — Draft Manager

**File**: `apps/studio/tests/unit/ai/draft-manager.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | New draft starts with status `pending` | FR-034 |
| 2 | Accept sets status to `accepted` | FR-036 |
| 3 | Reject sets status to `rejected` | FR-036 |
| 4 | Regenerate creates new version, preserves old in history | FR-035, FR-036 |
| 5 | Multiple drafts per paragraph tracked with correct indices | FR-035 |

### Step 3.10 — Manuscript Assembler

**File**: `apps/studio/tests/unit/publishing/manuscript-assembler.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Assembled manuscript has front matter (half-title, title page, copyright, dedication, TOC) | FR-046 |
| 2 | Scene content ordered by scene order array | FR-046 |
| 3 | Back matter included (author bio, acknowledgments, character index) | FR-046 |
| 4 | Empty accepted drafts produces empty chapter content | Edge Case |
| 5 | Scenes with multiple accepted paragraphs assembled in paragraph order | FR-046 |

### Step 3.11 — EPUB Generator

**File**: `apps/studio/tests/unit/publishing/epub-generator.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Output contains `mimetype` file | FR-047 |
| 2 | Output contains `META-INF/container.xml` | FR-047 |
| 3 | Output contains `content.opf` with Dublin Core metadata | FR-047 |
| 4 | Output contains `nav.xhtml` navigation document | FR-047 |
| 5 | Per-chapter XHTML files generated | FR-047 |
| 6 | Stylesheet linked in each chapter | FR-047 |

### Step 3.12 — DOCX Generator

**File**: `apps/studio/tests/unit/publishing/docx-generator.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Document uses 12pt font | FR-048 |
| 2 | Document has double spacing | FR-048 |
| 3 | Document has 1-inch margins | FR-048 |
| 4 | Document has 0.5-inch first-line indent | FR-048 |
| 5 | Chapter breaks start on new pages | FR-048 |

### Step 3.13 — PDF Generator

**File**: `apps/studio/tests/unit/publishing/pdf-generator.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Page dimensions match requested trim size (6x9, 5.5x8.5) | FR-049, US7-AS5 |
| 2 | Bleed is 0.125" on all sides | FR-049 |
| 3 | Spine width calculated from page count and paper type | FR-049 |
| 4 | Gutter calculated correctly | FR-049 |

### Step 3.14 — KDP Config

**File**: `apps/studio/tests/unit/publishing/kdp-config.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | All trim size presets return valid dimensions | FR-049 |
| 2 | Spine width formula: `pageCount * paperWeight` | FR-049 |
| 3 | US Trade (6x9) returns 6.0 x 9.0 inches | FR-049 |

### Step 3.15 — HTML Preview

**File**: `apps/studio/tests/unit/publishing/html-preview.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Output is valid HTML with `<html>`, `<head>`, `<body>` | FR-050 |
| 2 | Contains chapter headings | FR-050 |
| 3 | Contains paragraph content from manuscript | FR-050 |
| 4 | Contains table of contents with chapter links | FR-050 |

### Step 3.16 — Graphic Novel Pipeline

**File**: `apps/studio/tests/unit/graphic-novel/panel-generator.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Full Bleed template generates 1 panel | FR-053 |
| 2 | 4-Grid template generates 4 panels with correct regions | FR-053 |
| 3 | 9-Grid template generates 9 panels | FR-053 |
| 4 | Emotional intensity ≥ 0.9 sets close-up camera | FR-054, US8-AS1 |
| 5 | Emotional intensity ≥ 0.6 sets medium camera | FR-054 |
| 6 | Emotional intensity < 0.2 sets bird's-eye camera | FR-054 |

**File**: `apps/studio/tests/unit/graphic-novel/lettering-system.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Standard dialogue produces standard bubble | FR-055 |
| 2 | Shout marker produces larger bubble | FR-055, US8-AS3 |
| 3 | Whisper marker produces dashed bubble | FR-055 |
| 4 | Thought marker produces cloud bubble | FR-055 |
| 5 | Caption text produces caption box | FR-055 |
| 6 | Text wrapping respects bubble dimensions | FR-055 |

### Step 3.17 — ELK Layout

**File**: `apps/studio/tests/unit/diagrams/elk-layout.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Layered layout produces left-to-right node positioning | FR-019 |
| 2 | Force layout produces non-overlapping node positions | FR-020 |
| 3 | Empty node list returns empty layout | Edge case |
| 4 | Layout respects persisted position overrides | FR-025 |

### Step 3.18 — Sidecar (Position Persistence)

**File**: `apps/studio/tests/unit/diagrams/sidecar.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Manual position stored after drag | FR-025 |
| 2 | Stored position applied on next layout | FR-025, US3-AS7 |
| 3 | Non-overridden nodes use auto layout | FR-025 |

---

## Phase 4: Integration Tests — API Endpoints

### Step 4.1 — Project Endpoints

**File**: `apps/studio/tests/integration/api/project.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | POST `/api/project/create` with valid data returns `{ id, title, entryFilePath }` | FR-010, US2-AS1 |
| 2 | POST `/api/project/create` without title returns 400 | Input validation |
| 3 | GET `/api/project/manifest` returns project metadata with grammar version/fingerprint | FR-016 |
| 4 | GET `/api/project/manifest` with unknown projectId returns 404 | Error handling |
| 5 | POST `/api/project/lifecycle` advances concept → draft with snapshot | FR-013, US2-AS3 |
| 6 | POST `/api/project/lifecycle` rejects invalid transition (concept → published) | FR-013 |
| 7 | POST `/api/project/lifecycle` captures snapshot with wordCount, sceneCount, characterCount | FR-014, SC-009 |
| 8 | POST `/api/project/[id]/files` creates new file in project | FR-011 |
| 9 | POST `/api/project/[id]/files` deletes file from project | FR-011 |

### Step 4.2 — AI Text Endpoints

**File**: `apps/studio/tests/integration/api/ai-text.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | POST `/api/ai-text/generate` returns SSE stream with `chunk` events | FR-033, SC-003 |
| 2 | POST `/api/ai-text/generate` returns `done` event at end with cost info | FR-033 |
| 3 | POST `/api/ai-text/generate` returns `error` event on backend failure | Error handling |
| 4 | POST `/api/ai-text/generate` validates temperature 0.0–2.0 | FR-038 |
| 5 | POST `/api/ai-text/estimate` returns cost estimate before generation | FR-037, US4-AS2 |
| 6 | GET `/api/ai-text/backends` lists backends with availability status | FR-030, US4-AS4 |

### Step 4.3 — AI Image Endpoints

**File**: `apps/studio/tests/integration/api/ai-image.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | POST `/api/ai-image/generate` with type `portrait` returns assetId | FR-040 |
| 2 | POST `/api/ai-image/generate` with type `cover` returns assetId | FR-041 |
| 3 | POST `/api/ai-image/generate` validates required fields per type | Input validation |
| 4 | GET `/api/ai-image/backends` returns backend list with availability | FR-040 |
| 5 | POST `/api/ai-image/visual-dna` returns visual profile with traits | FR-042, US6-AS1 |
| 6 | POST `/api/ai-image/visual-dna` with referenceImageAssetId maintains consistency | FR-042 |

### Step 4.4 — Draft Endpoints

**File**: `apps/studio/tests/integration/api/drafts.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | GET `/api/draft/list` returns all drafts for project | FR-034 |
| 2 | GET `/api/draft/list` with sceneName filter returns only that scene's drafts | FR-034 |
| 3 | PUT `/api/draft/update` sets status to `accepted` | FR-036, US4-AS3 |
| 4 | PUT `/api/draft/update` sets status to `rejected` | FR-036, US4-AS3 |
| 5 | PUT `/api/draft/update` with invalid draftId returns 404 | Error handling |

### Step 4.5 — Analytics Endpoints

**File**: `apps/studio/tests/integration/api/analytics.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | POST `/api/analytics/snapshot` creates snapshot with metrics | US5-AS4 |
| 2 | POST `/api/analytics/snapshot` validates required fields | Input validation |
| 3 | GET `/api/analytics/timeseries` returns chronological snapshot history | US5-AS2 |
| 4 | GET `/api/analytics/timeseries` respects `limit` parameter (default 50) | API contract |
| 5 | GET `/api/analytics/timeseries` with limit > 500 clamps to 500 | API contract |

### Step 4.6 — Publishing Endpoints

**File**: `apps/studio/tests/integration/api/publishing.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | GET `/api/publishing/dependencies` returns readiness status | US7 |
| 2 | GET `/api/publishing/dependencies` shows missingScenes for incomplete project | US7 |
| 3 | GET `/api/publishing/dependencies` returns `ready: true` when all scenes have accepted drafts | FR-046 |
| 4 | GET `/api/publishing/dependencies` checks for approved cover image | FR-047 |
| 5 | GET `/api/publishing/preview` returns HTML content | FR-050 |
| 6 | GET `/api/publishing/preview` with unknown projectId returns 404 | Error handling |
| 7 | POST `/api/publishing/export` with `formats: ['epub']` returns download URL | FR-047, SC-007 |
| 8 | POST `/api/publishing/export` with `formats: ['docx']` returns download URL | FR-048 |
| 9 | POST `/api/publishing/export` with `formats: ['pdf']` and trimSize returns download URL | FR-049 |
| 10 | POST `/api/publishing/export` with no accepted drafts returns empty content warning | Edge Case |

---

## Phase 5: Integration Tests — Worker Protocol

### Step 5.1 — LSP Lifecycle

**File**: `apps/studio/tests/integration/worker/lsp-lifecycle.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Worker initializes and responds to `initialize` request | Worker protocol |
| 2 | `textDocument/didOpen` registers document in workspace | Worker protocol |
| 3 | `textDocument/didChange` updates document content | Worker protocol |
| 4 | `textDocument/didClose` removes document from workspace | Worker protocol |

### Step 5.2 — Custom Extensions

**File**: `apps/studio/tests/integration/worker/custom-requests.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | `actone/openProject` loads all files and returns diagnostics summary | Custom protocol |
| 2 | `actone/updateFile` updates single file content | Custom protocol |
| 3 | `actone/getSerializedAst` returns AST without Langium internals | Custom protocol |
| 4 | `actone/getAstForAllFiles` returns merged AST across files | Custom protocol, FR-011 |
| 5 | `actone/formatDocument` returns text edits | Custom protocol, FR-007 |

### Step 5.3 — Diagnostics Round-Trip

**File**: `apps/studio/tests/integration/worker/diagnostics.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Opening invalid file publishes diagnostics with error positions | FR-003 |
| 2 | Fixing the error and re-sending change clears diagnostics | FR-003 |
| 3 | Diagnostics published within 200ms of change | SC-001 |

---

## Phase 6: Integration Tests — Pipelines

### Step 6.1 — AST → Diagram Pipeline

**File**: `apps/studio/tests/integration/pipelines/ast-to-diagram.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Parse fixture → serialize AST → transform to story-structure nodes/edges → verify count matches | FR-019, FR-024 |
| 2 | Parse fixture → serialize AST → transform to character-network → verify character count | FR-020, FR-024 |
| 3 | Modify source → re-parse → re-transform → verify diagram updated | SC-002 |
| 4 | Apply ELK layout → verify all nodes have positions | Layout |

### Step 6.2 — Diagram → Source Pipeline

**File**: `apps/studio/tests/integration/pipelines/diagram-to-source.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Create character on diagram → generate text edit → apply to source → re-parse → character exists in AST | FR-026, SC-006 |
| 2 | Delete scene on diagram → generate text edit → apply → re-parse → scene removed from AST | FR-026 |
| 3 | Rename character → generate text edit → apply → re-parse → all references updated | FR-026, US1-AS5 |
| 4 | Generated edits produce valid `.actone` syntax (parse with zero errors) | SC-006 |

### Step 6.3 — Generation → Draft Pipeline

**File**: `apps/studio/tests/integration/pipelines/generation-to-draft.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Assemble context → build prompt → mock generate → store draft → verify draft in DB | FR-033, FR-034 |
| 2 | Accept draft → verify status updated | FR-036 |
| 3 | Reject draft → regenerate → verify new version created with old preserved | FR-035, FR-036 |

### Step 6.4 — Draft → Publish Pipeline

**File**: `apps/studio/tests/integration/pipelines/draft-to-publish.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Accepted drafts → assemble manuscript → generate EPUB → verify structure | FR-046, FR-047 |
| 2 | Accepted drafts → assemble manuscript → generate DOCX → verify format | FR-046, FR-048 |
| 3 | No accepted drafts → publishing dependencies check returns `ready: false` | Edge Case |

---

## Phase 7: Performance Tests

### Step 7.1 — Editor Responsiveness (SC-001)

**File**: `apps/studio/tests/performance/editor-latency.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Validation completes in < 200ms for `minimal.actone` | SC-001 |
| 2 | Validation completes in < 200ms for `full-story.actone` | SC-001 |
| 3 | Validation completes in < 500ms for `large-project/` (50 chars, 100 scenes) | SC-010 |
| 4 | Completion response in < 200ms | SC-001 |

### Step 7.2 — Diagram Update Latency (SC-002)

**File**: `apps/studio/tests/performance/diagram-latency.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Story-structure transform + layout in < 2s for full story | SC-002 |
| 2 | Character-network transform + layout in < 2s for 50 characters | SC-002, SC-010 |
| 3 | All 5 transforms complete in < 2s each for large project | SC-002, SC-010 |

---

## Phase 8: E2E Tests (Playwright)

### Step 8.1 — Authentication

**File**: `apps/studio/tests/e2e/auth.spec.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Unauthenticated user is redirected to login page | FR-060 |
| 2 | User can sign in with email/magic link | FR-060 |
| 3 | Authenticated user sees the main layout | FR-059 |

### Step 8.2 — Project Management Flow

**File**: `apps/studio/tests/e2e/project.spec.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Create new project → verify entry file appears in editor | US2-AS1, FR-010 |
| 2 | Type story content → verify syntax highlighting | US1-AS1, FR-002 |
| 3 | Type invalid value → verify error diagnostic appears | US1-AS2, FR-003 |
| 4 | Advance lifecycle stage → verify snapshot captured | US2-AS3, FR-013 |
| 5 | Project navigator shows elements grouped by type | FR-017 |
| 6 | Click element in navigator → editor scrolls to definition | US2-AS5, FR-017 |

### Step 8.3 — Editor Intelligence

**File**: `apps/studio/tests/e2e/editor.spec.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Trigger completion inside `participants: [` → character names appear | US1-AS3, FR-004 |
| 2 | Hover over character name → tooltip with nature, bio, traits | US1-AS9, FR-005 |
| 3 | Invoke format command → indentation normalized | US1-AS6, FR-007 |
| 4 | Go-to-definition on character reference → cursor jumps to declaration | US1-AS4, FR-006 |
| 5 | Rename character → all references updated | US1-AS5, FR-006 |

### Step 8.4 — Diagram Views

**File**: `apps/studio/tests/e2e/diagrams.spec.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Navigate to story-structure → scene nodes visible | US3-AS1, FR-019 |
| 2 | Navigate to character-network → character circles with edges | US3-AS2, FR-020 |
| 3 | Navigate to world-map → world containers with location nodes | US3-AS4, FR-021 |
| 4 | Navigate to timeline → swim-lanes with scene blocks | US3-AS5, FR-022 |
| 5 | Navigate to interaction → lifelines with exchange arrows | US3-AS6, FR-023 |
| 6 | Drag node → reopen view → node at saved position | US3-AS7, FR-025 |
| 7 | Right-click → Create Character → new node appears | US3-AS3, FR-026 |
| 8 | Double-click node → editor opens at source location | FR-029 |
| 9 | Keyboard shortcut Ctrl+1 → story-structure view | FR-058 |

### Step 8.5 — AI Generation Flow

**File**: `apps/studio/tests/e2e/generation.spec.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Select scene → see cost estimate → click Generate → text streams in | US4-AS1, US4-AS2 |
| 2 | Accept paragraph → status changes to accepted | US4-AS3, FR-036 |
| 3 | Reject paragraph → status changes to rejected | US4-AS3, FR-036 |
| 4 | Regenerate paragraph → new version appears with old in history | US4-AS3, FR-035 |
| 5 | Backend selector shows availability indicators | US4-AS4, FR-030 |
| 6 | Ctrl+G keyboard shortcut triggers generation | FR-039 |

### Step 8.6 — Analytics & Story Bible

**File**: `apps/studio/tests/e2e/analytics.spec.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Story Bible → Characters tab shows personality charts | US5-AS1, FR-005 |
| 2 | Story Bible → Themes tab shows statement, motifs, tension | US5-AS3 |
| 3 | Story Bible → Relationships tab shows character matrix | US5-AS1 |
| 4 | Statistics Dashboard → overview cards (word count, scene count, character count) | US5-AS2 |
| 5 | Statistics Dashboard → Capture Snapshot → snapshot saved | US5-AS4 |
| 6 | Statistics Dashboard → word count trend chart visible | US5-AS2 |

### Step 8.7 — Publishing Flow

**File**: `apps/studio/tests/e2e/publishing.spec.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Publishing panel shows dependency status | FR-052 |
| 2 | Export EPUB → download link provided | FR-047, SC-007 |
| 3 | Export DOCX → download link provided | FR-048 |
| 4 | Reading Mode → book-like layout with TOC, chapters, drop caps | FR-050, US7-AS3 |
| 5 | Spread Preview → two-page spread at correct aspect ratio | FR-051, US7-AS4 |

### Step 8.8 — Layout & Navigation

**File**: `apps/studio/tests/e2e/layout.spec.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Three-zone layout renders (sidebar, main, bottom panel) | FR-059 |
| 2 | Ctrl+B toggles sidebar visibility | FR-059 |
| 3 | Ctrl+J toggles bottom panel visibility | FR-059 |
| 4 | Sidebar resize handle adjusts width | FR-059 |
| 5 | Bottom panel resize handle adjusts height | FR-059 |
| 6 | Menu bar: Project, Generate, View, Publish, Help menus open | FR-058 |

---

## Phase 9: Edge Case & Error Handling Tests

**File**: `apps/studio/tests/unit/edge-cases.test.ts`

| # | Test | Validates |
|---|------|-----------|
| 1 | Grammar fingerprint mismatch detected on project load | Edge Case, FR-016 |
| 2 | AI backend unavailable mid-generation preserves partial content | Edge Case |
| 3 | Story with no scenes disables generation button | Edge Case |
| 4 | Published project cannot be reverted (terminal state) | Edge Case, FR-013 |
| 5 | Export with no accepted drafts produces empty manuscript warning | Edge Case |
| 6 | Multi-file merge mode duplicate names across files flagged | Edge Case, FR-011 |
| 7 | Relationship weight at boundary (60) uses correct styling | Edge Case |
| 8 | Scene with no participants generates prose without voice directives | Edge Case |

---

## Execution Order Summary

| Phase | Scope | Count | Dependencies |
|-------|-------|-------|-------------|
| 0 | Infrastructure Setup | — | None |
| 1 | Shared Package Units | ~20 | Phase 0 |
| 2 | Langium Grammar Units | ~55 | Phase 0 |
| 3 | Studio Business Logic Units | ~95 | Phase 0 |
| 4 | API Integration | ~35 | Phase 0, mock DB |
| 5 | Worker Protocol Integration | ~10 | Phases 2, 3 |
| 6 | Pipeline Integration | ~12 | Phases 2, 3, 4 |
| 7 | Performance | ~8 | Phases 2, 3 |
| 8 | E2E (Playwright) | ~40 | All above, running dev server |
| 9 | Edge Cases | ~8 | Phases 2, 3, 4 |
| **Total** | | **~283** | |

---

## Success Criteria Traceability

| Criterion | Description | Test Coverage |
|-----------|-------------|---------------|
| SC-001 | Validation < 200ms | Phase 7, Step 7.1 |
| SC-002 | Diagram update < 2s | Phase 7, Step 7.2 |
| SC-003 | Generation streaming < 1s | Phase 4, Step 4.2 #1 |
| SC-004 | 95% relevant completions | Phase 2, Step 2.4 |
| SC-005 | End-to-end < 30 min | Phase 8, Steps 8.2–8.7 combined |
| SC-006 | 100% valid syntax from diagram edits | Phase 3, Step 3.5; Phase 6, Step 6.2 |
| SC-007 | Exports pass format validation | Phase 4, Step 4.6 #7–9; Phase 8, Step 8.7 |
| SC-008 | Visual DNA 70%+ consistency | Phase 4, Step 4.3 #5–6 |
| SC-009 | Snapshot zero data loss | Phase 4, Step 4.1 #7 |
| SC-010 | 50 chars, 100 scenes, 10 files | Phase 3, Step 3.2 #9; Phase 7, Steps 7.1–7.2 |
