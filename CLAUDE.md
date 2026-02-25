# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- TypeScript monorepo: pnpm workspaces + Turborepo
- Web: SvelteKit + Tailwind CSS (planned for apps)
- Package manager: pnpm (strict, v9) — do not use npm or yarn
- Node >= 18
- No Python

## Commands

- `pnpm build` — build all packages (via Turborepo)
- `pnpm dev` — dev server for all apps
- `pnpm lint` — lint all packages
- `pnpm format` — format all .ts/.tsx/.md files with Prettier
- `pnpm check-types` — typecheck all packages
- `turbo run build --filter=<package>` — build a specific package
- `turbo run lint --filter=<package>` — lint a specific package
- `turbo run dev --filter=<app>` — dev server for a specific app

## Architecture

### Monorepo Layout

- `apps/` — deployable applications (currently `web/` and `docs/`, both scaffolded but empty)
- `packages/` — shared libraries and configs:
  - `@repo/ui` — React component library (button, card, code). Exports via `@repo/ui/<component>` mapped to `src/<component>.tsx`.
  - `@repo/eslint-config` — shared ESLint flat configs. Exports `./base`, `./next-js`, `./react-internal`.
  - `@repo/typescript-config` — shared tsconfig presets. Provides `base.json`, `react-library.json`, `nextjs.json`.

### TypeScript Configuration

Base config (`packages/typescript-config/base.json`): strict mode, ES2022 target, NodeNext module resolution, `noUncheckedIndexedAccess` enabled. Packages extend from presets in `@repo/typescript-config`.

### ESLint Configuration

Uses ESLint 9 flat config format (`.mjs` files). Base config includes `typescript-eslint`, `eslint-config-prettier`, and `eslint-plugin-turbo`. All rules emit warnings only (`eslint-plugin-only-warn`). Packages import shared configs from `@repo/eslint-config`.

### Turborepo Pipeline

- `build` — depends on `^build` (dependencies build first), caches `.next/**`
- `lint` — depends on `^lint`
- `check-types` — depends on `^check-types`
- `dev` — not cached, persistent

## Conventions

- All code in TypeScript (strict mode)
- ESLint + Prettier enforced
- Commit messages: conventional commits
- Tests required before merge

## Active Technologies
- TypeScript 5.9 (strict mode, ES2022 target) + None at runtime; Vitest for testing (dev only) (001-string-utils)

## Recent Changes
- 001-string-utils: Added TypeScript 5.9 (strict mode, ES2022 target) + None at runtime; Vitest for testing (dev only)
