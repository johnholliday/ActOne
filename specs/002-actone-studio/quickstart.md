# Quickstart: ActOne Studio

**Branch**: `002-actone-studio` | **Date**: 2026-02-24

## Prerequisites

- Node.js >= 20.10 (required by Langium 4.x)
- pnpm 9.x (`corepack enable && corepack prepare pnpm@latest --activate`)
- A Supabase project (free tier works for development)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create `apps/studio/.env`:

```env
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# AI Backends (optional — configure as needed)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 3. Initialize database

```bash
# Push schema to Supabase
cd apps/studio
npx drizzle-kit push
```

### 4. Generate Langium types

```bash
# Generate AST types from grammar
turbo run build --filter=@repo/langium
```

### 5. Build shared packages

```bash
turbo run build --filter=@repo/shared
```

### 6. Start development server

```bash
turbo run dev --filter=studio
```

The app will be available at `http://localhost:5173`.

## Package Structure

| Package | Path | Purpose |
| ------- | ---- | ------- |
| `@repo/shared` | `packages/shared` | Shared types, Zod schemas, DB schema, constants |
| `@repo/langium` | `packages/langium` | Langium grammar, parser, LSP services |
| `studio` | `apps/studio` | SvelteKit web application |

## Key Commands

| Command | Purpose |
| ------- | ------- |
| `pnpm build` | Build all packages |
| `pnpm dev` | Start all dev servers |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files |
| `pnpm check-types` | Type-check all packages |
| `turbo run build --filter=@repo/langium` | Build Langium package (generates AST types) |
| `turbo run dev --filter=studio` | Start studio dev server |
| `turbo run test --filter=@repo/langium` | Run Langium tests |
| `cd apps/studio && npx drizzle-kit push` | Push schema to database |
| `cd apps/studio && npx drizzle-kit generate` | Generate migration SQL |

## Development Workflow

1. **Edit grammar**: Modify `packages/langium/src/actone.langium`
2. **Regenerate**: `turbo run build --filter=@repo/langium` (runs `langium-cli generate`)
3. **Update shared types**: If AST shape changes, update re-exports in `packages/shared`
4. **Run studio**: `turbo run dev --filter=studio`
5. **Test**: Write `.actone` content in the editor, verify language intelligence
