# Feature Specification: Shared String Utilities Package

**Feature Branch**: `001-string-utils`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Build a shared utilities package for string manipulation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Case Conversion (Priority: P1)

A developer working in the ActOne monorepo needs to convert strings between common casing conventions (camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE). They import the utility from `@repo/string-utils` and call the appropriate function, receiving a correctly transformed string.

**Why this priority**: Case conversion is the most universally needed string manipulation across codebases — used in code generation, API transformations, serialization, and display formatting. It provides immediate, high-frequency value.

**Independent Test**: Can be fully tested by passing strings in any casing format and verifying the output matches the target convention. Delivers value as a standalone utility even without other string functions.

**Acceptance Scenarios**:

1. **Given** a camelCase string like `"myVariableName"`, **When** converting to snake_case, **Then** the result is `"my_variable_name"`
2. **Given** a kebab-case string like `"my-component-name"`, **When** converting to PascalCase, **Then** the result is `"MyComponentName"`
3. **Given** a string with consecutive uppercase letters like `"parseHTTPResponse"`, **When** converting to kebab-case, **Then** the result is `"parse-http-response"` (acronyms treated as single words)
4. **Given** an empty string, **When** converting to any case, **Then** the result is an empty string

---

### User Story 2 - String Trimming and Whitespace Normalization (Priority: P2)

A developer needs to sanitize user-facing strings by trimming edges, collapsing internal whitespace, and removing specific characters. They use the string-utils package to normalize whitespace and strip unwanted characters from strings before display or storage.

**Why this priority**: Whitespace normalization is a common requirement for input sanitization, display formatting, and data cleaning. It complements case conversion and is needed across most applications.

**Independent Test**: Can be tested by passing strings with irregular whitespace and verifying output is properly normalized. Delivers value for any input cleaning workflow.

**Acceptance Scenarios**:

1. **Given** a string with leading/trailing whitespace `"  hello world  "`, **When** trimming, **Then** the result is `"hello world"`
2. **Given** a string with multiple internal spaces `"hello    world"`, **When** collapsing whitespace, **Then** the result is `"hello world"`
3. **Given** a string with mixed whitespace characters (tabs, newlines, spaces), **When** normalizing whitespace, **Then** all whitespace is collapsed to single spaces and edges are trimmed

---

### User Story 3 - Truncation and Ellipsis (Priority: P2)

A developer needs to display truncated strings in a UI — for example, truncating long titles or descriptions to fit within a fixed-width layout. They use the string-utils package to truncate to a maximum length with a configurable suffix (defaulting to `"…"`).

**Why this priority**: Truncation is a frequent UI need. It pairs well with other string utilities and is straightforward to implement, delivering immediate display-layer value.

**Independent Test**: Can be tested by passing strings exceeding a length limit and verifying the output is truncated with the correct suffix and does not break mid-word.

**Acceptance Scenarios**:

1. **Given** a string `"The quick brown fox jumps over the lazy dog"` and a limit of 20, **When** truncating, **Then** the result is `"The quick brown fox…"` (truncated at word boundary, suffix included in length count)
2. **Given** a string shorter than the limit, **When** truncating, **Then** the original string is returned unchanged
3. **Given** a custom suffix `"..."`, **When** truncating, **Then** the custom suffix is used instead of the default

---

### User Story 4 - Slug Generation (Priority: P3)

A developer needs to generate URL-safe slugs from titles or names — for example, converting `"My Blog Post Title!"` into `"my-blog-post-title"`. They use the string-utils package to produce clean, lowercase, hyphen-separated slugs.

**Why this priority**: Slug generation is important for routing and URL construction but is a more specialized need. It builds on case conversion and whitespace normalization.

**Independent Test**: Can be tested by passing arbitrary strings containing special characters, spaces, and mixed case, and verifying the output is a valid URL-safe slug.

**Acceptance Scenarios**:

1. **Given** a string `"Hello World! This is a Test"`, **When** generating a slug, **Then** the result is `"hello-world-this-is-a-test"`
2. **Given** a string with special characters `"Héllo & Wörld"`, **When** generating a slug, **Then** accented characters are transliterated and special characters are removed: `"hello-and-world"`
3. **Given** a string with consecutive hyphens or leading/trailing hyphens after processing, **When** generating a slug, **Then** consecutive hyphens are collapsed and edge hyphens are removed

---

### Edge Cases

- What happens when the input contains only whitespace? Trimming returns an empty string; case conversion returns an empty string; slug generation returns an empty string.
- What happens when the input contains emoji or Unicode characters? Functions preserve valid Unicode in general operations (trim, truncate). Slug generation strips non-ASCII characters that aren't transliterable.
- What happens when the truncation limit is smaller than the suffix length? Return just the suffix truncated to the limit.
- What happens when a string has no detectable casing boundaries (e.g., `"alllowercase"`)? Return the string as-is in the target case (all lowercase stays lowercase for snake_case/kebab-case; capitalizes first letter for PascalCase).
- What happens when the input has mixed delimiters (e.g., `"some_mixed-caseString"`)? All delimiters (hyphens, underscores, spaces, case transitions) are recognized as word boundaries for case conversion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Package MUST be published as `@repo/string-utils` within the monorepo workspace, importable by any app or package in the monorepo
- **FR-002**: Package MUST provide case conversion functions supporting at minimum: camelCase, PascalCase, snake_case, kebab-case, and CONSTANT_CASE
- **FR-003**: Case conversion functions MUST correctly handle acronyms and consecutive uppercase letters (e.g., `"parseHTTPResponse"` → `"parse-http-response"`)
- **FR-004**: Package MUST provide whitespace normalization functions: trim, collapse internal whitespace, and strip specified characters
- **FR-005**: Package MUST provide a truncation function that respects word boundaries and supports a configurable suffix (default: `"…"`)
- **FR-006**: Package MUST provide a slug generation function that produces URL-safe, lowercase, hyphen-separated strings with basic transliteration of common accented characters
- **FR-007**: All functions MUST accept `string` input and return `string` output — no mutation, no side effects
- **FR-008**: Package MUST be tree-shakeable — each function independently importable so unused functions are excluded from bundles
- **FR-009**: Package MUST include TypeScript type declarations
- **FR-010**: Package MUST include a comprehensive test suite with full coverage of documented acceptance scenarios and edge cases

### Key Entities

- **StringUtils Package**: The shared library (`@repo/string-utils`) providing all string manipulation functions. Lives in `packages/string-utils/` following monorepo conventions. Exports individual named functions — no classes or stateful objects.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All acceptance scenarios from all user stories pass automated tests
- **SC-002**: Any developer in the monorepo can import and use any string-utils function in under 1 minute with no additional setup beyond existing `pnpm install`
- **SC-003**: All exported functions produce correct results for the documented edge cases
- **SC-004**: Unused functions are excluded from production bundles (tree-shaking verified)
- **SC-005**: Package has zero runtime dependencies

## Assumptions

- The package follows existing monorepo conventions: TypeScript strict mode, ESLint + Prettier, `@repo/` scoped naming
- The package targets the same ES2022 / NodeNext configuration as the rest of the monorepo
- Transliteration for slug generation covers common Latin-alphabet accented characters (é→e, ü→u, ñ→n, etc.) but does not need to support full Unicode transliteration (e.g., CJK characters)
- The `&` symbol is transliterated to `"and"` in slug generation; other symbolic characters are stripped
- Word-boundary truncation is preferred but falls back to character-level truncation if a single word exceeds the limit
- Input type safety is enforced at compile time via TypeScript; functions do not need runtime type guards for non-string inputs
