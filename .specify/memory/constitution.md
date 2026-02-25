<!--
Sync Impact Report
===================
Version change: 1.2.0 → 1.3.0
Modified principles:
  - I. TypeScript Strict Mode & Pure ESM (gate: added ES2022 target)
  - III. Quality Gates (gate: commands updated to pnpm turbo build,
    pnpm turbo lint, prettier --check .)
Modified sections:
  - Technology Stack Constraints → Technology Constraints
    (added: database, build config, ESLint 9 flat config, Prettier
    config details, AI model tiers, future stack; removed: Tailwind
    CSS as current stack item, package-level references moved to
    principles)
  - Development Workflow (rewritten: new quality gate commands, added
    Mermaid diagram rule, added Langium/generated-code workflow rule)
  - Governance (rewritten: owner approval, migration plan for
    affected code)
Added sections: none
Removed sections: none
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed
    (Constitution Check references constitution generically)
  - .specify/templates/spec-template.md ✅ no changes needed
    (spec structure is compatible with all principles)
  - .specify/templates/tasks-template.md ✅ no changes needed
    (task phases and parallel markers align with principles)
  - .specify/templates/agent-file-template.md ✅ no changes needed
    (no agent-specific names; template is generic)
Follow-up TODOs: none
-->

# ActOne Constitution

## Core Principles

### I. TypeScript Strict Mode & Pure ESM

All source code in this repository MUST be written in TypeScript with
`strict: true` enabled in every `tsconfig.json`, targeting ES2022.
No Python or other runtime languages are permitted.

The project MUST use pure ESM (`"type": "module"` in every
`package.json`). Every `tsconfig.json` MUST set
`"moduleResolution": "bundler"`. CommonJS output is prohibited.

The `any` type MUST NOT appear in source code except where
unavoidable at third-party API boundaries. Every such occurrence
MUST be narrowed to a concrete type immediately at the call site
(within the same function or via a type-guard wrapper). Each `any`
MUST include an inline comment explaining why it is necessary.

**Rationale**: A single, strictly-typed language with pure ESM
eliminates cross-language and cross-module-system friction. Banning
`any` preserves the guarantees that strict mode provides; allowing
narrow exceptions at third-party boundaries keeps the rule practical
without eroding type safety inward.

**Testable gate**: Every `tsconfig.json` MUST include
`"strict": true`, `"moduleResolution": "bundler"`, and
`"target": "ES2022"`. Every `package.json` MUST include
`"type": "module"`. Any `.py`, `.rb`, or other non-TypeScript
source files MUST be flagged as violations. Any unnarrated `any`
(missing justification comment) or `any` that leaks beyond the
immediate boundary call site MUST be flagged.

### II. Monorepo Discipline

The project MUST follow pnpm workspaces + Turborepo monorepo
conventions. Deployable applications reside in `apps/`, shared
libraries and configs reside in `packages/`. Every workspace package
MUST be independently buildable via `turbo run build --filter=<pkg>`.

**Rationale**: Consistent structure enables caching, parallel builds,
and clear ownership boundaries. Independent buildability ensures no
hidden cross-package coupling.

**Testable gate**: `pnpm turbo build` MUST succeed from the repo
root. Each package MUST declare its own `package.json` with explicit
dependencies (no implicit imports from sibling packages).

### III. Quality Gates (NON-NEGOTIABLE)

All code changes MUST pass `pnpm turbo build`, `pnpm turbo lint`,
and `prettier --check .` before being considered complete. Tests
MUST pass before merge. All commit messages MUST follow the
Conventional Commits specification.

**Rationale**: Automated quality enforcement prevents style drift,
catches regressions early, and produces a parseable commit history
for changelogs and release automation.

**Testable gate**: CI MUST run `pnpm turbo build`,
`pnpm turbo lint`, `prettier --check .`, and test suites. Any
failure MUST block merge. Commit messages MUST match the pattern
`<type>[optional scope]: <description>`.

### IV. Forward-Only Versioning

Dependencies MUST stay current. When encountering compatibility
issues with newer package versions, the code MUST be updated to
match the new API rather than downgrading the dependency.
Downgrading is permitted only as a documented last resort after
demonstrating that forward migration is infeasible. Any downgrade
MUST include explicit user approval, a written justification
referencing this principle, and evidence that the upgrade path was
attempted and failed.

This applies to all dependencies without exception: TypeScript,
ESLint, Anthropic SDK, Drizzle ORM, and any future additions.

**Rationale**: Downgrading accumulates technical debt and delays
inevitable migration work. Staying current reduces the surface area
of known vulnerabilities and ensures access to latest features and
fixes. Updating code to match new APIs is always preferable to
pinning old versions, because the migration cost only grows with
time.

**Testable gate**: Any PR that reduces a version number in
`package.json` or lock file MUST include: (1) an explicit
justification comment referencing this principle, (2) evidence that
forward migration was attempted, (3) a description of why the
upgrade path is infeasible, and (4) evidence of user approval.

### V. Complete Solutions

Implementation MUST NOT be simplified, abbreviated, or shortcut for
expediency. Every solution MUST be complete and correct. Pivoting to
an alternative approach without alerting the user is prohibited.
Langium-generated code MUST NOT be overwritten; fix generators
instead. Mermaid diagrams are generated — fix the scripts, not the
output.

**Rationale**: Shortcuts compound into technical debt and mask root
causes. Complete solutions save time in aggregate by avoiding
rework. Generated artifacts MUST be treated as build output: the
source of truth is the generator, not the generated file.

**Testable gate**: Code reviews MUST verify that implementations
address the full scope of the request. Any TODO or FIXME introduced
MUST include a tracking reference (issue number or follow-up task).
Any direct edit to a generated file (Langium output, Mermaid
diagrams) MUST be flagged.

### VI. Single Source of Truth

All shared data structures MUST be defined in a single canonical
location: `packages/shared/src/types/index.ts`. No other package
may independently define types that represent the same domain
concepts. Consuming packages MUST import from `packages/shared`
rather than duplicating or re-declaring type definitions.

**Rationale**: A single authoritative type location eliminates
drift between packages, makes refactoring safe (change once,
propagate everywhere), and provides a clear inventory of the
project's domain model.

**Testable gate**: Any PR introducing a new shared data structure
outside `packages/shared/src/types/` MUST be flagged. Duplicate
type declarations across packages (same shape, different file)
MUST be flagged during code review.

### VII. Boundary Validation

All boundaries between layers and all external inputs MUST be
validated at runtime using Zod schemas. This includes but is not
limited to: Claude API responses, Supabase/database query results,
other third-party API responses, user input, webhook payloads, file
reads, and environment variables.

Every Claude API response MUST be validated against a Zod schema
before the response data is used by any downstream logic. Raw,
unvalidated LLM output MUST NOT propagate past the API call site.

Zod schemas MUST be co-located with or derived from the canonical
types in `packages/shared`. Unvalidated external data MUST NOT
propagate past the boundary function.

**Rationale**: TypeScript's type system is erased at runtime and
cannot protect against malformed external data. LLM responses are
inherently unstructured and unpredictable; Zod validation at the
Claude API boundary ensures that malformed, hallucinated, or
off-schema responses are caught immediately rather than causing
subtle failures downstream.

**Testable gate**: Every function that accepts external input MUST
parse it through a Zod schema before use. Every Claude API call
site MUST include a `.parse()` or `.safeParse()` on the response.
Any boundary function lacking schema validation MUST be flagged.
Zod schemas MUST stay in sync with their corresponding TypeScript
types (prefer `z.infer<>` to derive types from schemas, or use
schema-first patterns).

### VIII. TypeScript Computes; Claude Interprets

TypeScript code owns all deterministic computation: data
transformation, validation, routing, state management, persistence,
and control flow. Claude (LLM) owns interpretation tasks:
natural-language understanding, content generation, classification,
summarization, and ambiguity resolution.

LLM output MUST NOT directly drive control flow, modify state, or
bypass TypeScript validation. Every LLM response MUST pass through
a TypeScript validation and transformation layer (see Principle VII)
before it affects application state or user-visible output.

**Rationale**: Deterministic logic in TypeScript is testable,
reproducible, and auditable. LLM output is probabilistic and
non-deterministic. Keeping a strict boundary ensures that the
application remains predictable and debuggable while still
leveraging Claude's interpretive capabilities where they add value.

**Testable gate**: No code path may allow raw LLM output to modify
application state or be rendered to the user without first passing
through a TypeScript function that validates and transforms it.
Code reviews MUST verify that Claude is used for interpretation
tasks only and that all computation remains in TypeScript.

## Technology Constraints

- **Runtime**: Node.js with pure ESM (`"type": "module"`)
- **Language**: TypeScript (strict mode, ES2022 target)
- **Monorepo**: Turborepo + pnpm workspaces
- **Build**: `tsc` to `./dist` with declarations and source maps
- **Database**: Supabase PostgreSQL with Drizzle ORM, RLS for
  user-scoped data
- **Validation**: Zod for all external data boundaries
- **AI**: Anthropic Claude API — Sonnet for batch, Opus for
  decisions
- **Linting**: ESLint 9 (flat config) with typescript-eslint
  type-checked rules
- **Formatting**: Prettier (single quotes, semicolons, trailing
  commas, 100 char width)
- **Shared types**: `packages/shared` (canonical type definitions,
  see Principle VI)
- **Future stack**: Hono API, SvelteKit dashboard
- **Prohibited**: Python, Ruby, or any non-TypeScript runtime
  language; CommonJS modules; unguarded `any` types

Adding a new runtime language or replacing a stack component
constitutes a constitutional amendment and MUST follow the governance
amendment procedure below.

## Development Workflow

1. **Branch from main**: Every feature or fix MUST start on a
   dedicated branch off `main`.
2. **Conventional commits**: All commits MUST follow the format
   `<type>[scope]: <description>` (e.g., `feat(web): add login`).
3. **Quality gates**: All code changes MUST pass `pnpm turbo build`,
   `pnpm turbo lint`, and `prettier --check .` before being
   considered complete.
4. **Tests before merge**: All existing and new tests MUST pass.
   New features MUST include tests when specified in the feature
   specification.
5. **Code review**: PRs MUST be reviewed against this constitution's
   principles before merge.
6. **No force-push to main**: Force-pushing to `main` is prohibited.
7. **Complete solutions** (Principle V): MUST NOT simplify
   implementations for expediency. Pursue complete, correct
   solutions even when they require more effort. MUST NOT pivot to
   alternative approaches without explicit discussion. Focus on the
   core issue at hand.
8. **Generated code** (Principle V): Langium-generated code MUST NOT
   be overwritten; fix generators instead. Mermaid diagrams are
   generated — fix the scripts, not the output.

## Governance

This constitution supersedes all other development practices within
the ActOne project. Amendments require:

1. Documentation of the proposed change and rationale.
2. Owner approval before implementation.
3. A migration plan if existing code is affected.
4. Version bump following semver: MAJOR for principle
   removal/redefinition, MINOR for new principles or material
   expansion, PATCH for clarifications.
5. Update any dependent templates or documentation flagged in the
   Sync Impact Report.

All code contributions MUST verify compliance with these principles.
Complexity beyond what is required for the current task MUST be
justified. Use `CLAUDE.md` for runtime development guidance that
supplements but does not contradict this constitution.

**Version**: 1.3.0 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-02-24
