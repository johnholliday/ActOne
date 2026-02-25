# ActOne Monorepo

## Stack
- TypeScript monorepo: pnpm workspaces + Turborepo
- Web: SvelteKit + Tailwind CSS
- Package manager: pnpm (strict)
- No Python

## Structure
- `apps/` — deployable applications
- `packages/` — shared libraries and configs

## Conventions
- All code in TypeScript (strict mode)
- ESLint + Prettier enforced
- Commit messages: conventional commits
- Tests required before merge

## Commands
- `pnpm build` — build all packages
- `pnpm dev` — dev server for all apps
- `turbo run build --filter=<package>` — build specific package
