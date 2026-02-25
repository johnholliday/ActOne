# Quickstart: @repo/string-utils

**Feature**: 001-string-utils
**Date**: 2026-02-24

## Prerequisites

- Node.js >= 18
- pnpm 9.x (monorepo package manager)
- Repository cloned and dependencies installed (`pnpm install` from repo root)

## Build the Package

```bash
# Build just string-utils
turbo run build --filter=@repo/string-utils

# Or build everything
pnpm build
```

## Run Tests

```bash
# Run string-utils tests
cd packages/string-utils && pnpm test

# Run tests in watch mode during development
cd packages/string-utils && pnpm test:watch
```

## Use in Another Package

1. Add the dependency to the consuming package's `package.json`:

```json
{
  "dependencies": {
    "@repo/string-utils": "workspace:*"
  }
}
```

2. Run `pnpm install` from the repo root.

3. Import and use:

```typescript
import { toCamelCase, slugify, truncate } from "@repo/string-utils";

const varName = toCamelCase("my-css-class");     // "myCssClass"
const slug = slugify("Hello World!");             // "hello-world"
const title = truncate("A very long title", 10);  // "A very lo…"
```

## Lint & Format

```bash
# Lint
turbo run lint --filter=@repo/string-utils

# Format check
prettier --check "packages/string-utils/**/*.ts"

# Format fix
prettier --write "packages/string-utils/**/*.ts"
```
