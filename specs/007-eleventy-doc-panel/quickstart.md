# Quickstart: Eleventy Documentation with In-App Fly-out Panel

**Feature**: `007-eleventy-doc-panel`
**Date**: 2026-03-03

## Prerequisites

- Node.js >= 18
- pnpm 9.x
- The ActOne monorepo cloned and dependencies installed (`pnpm install`)

## Quick Verification Steps

### 1. Build the Guide

```bash
# From repo root
pnpm --filter actone-guide build

# Verify output
ls guide/_site/index.html
```

### 2. Browse Standalone Guide

```bash
# Start Eleventy dev server
pnpm --filter actone-guide dev

# Open http://localhost:8080/guide/ in browser
```

### 3. Browse Guide via SvelteKit Dev Server

```bash
# Start the studio dev server (guide must be pre-built)
pnpm --filter studio dev

# Open http://localhost:54530/guide/ in browser
```

### 4. Test the In-App Panel

```bash
# Start the studio dev server
pnpm --filter studio dev

# Open http://localhost:54530/ in browser
# Click the documentation/help trigger in the app
# Verify: panel opens, content loads, links navigate in-panel
```

## Key Files

| File | Purpose |
|------|---------|
| `guide/eleventy.config.js` | Eleventy configuration with custom filters |
| `guide/src/_data/navigation.json` | Sidebar navigation structure |
| `guide/src/_data/site.json` | Site metadata |
| `guide/src/_includes/layouts/base.njk` | Master HTML layout (wraps content in `<article>`) |
| `guide/src/css/main.css` | CSS import orchestrator |
| `apps/studio/vite.config.ts` | Vite plugin for serving guide in dev |
| `apps/studio/src/lib/stores/doc-panel.svelte.ts` | Panel state singleton (Svelte 5 runes) |
| `apps/studio/src/lib/components/DocPanel.svelte` | Fly-out panel component |
| `apps/studio/src/lib/components/guide-panel.css` | Scoped panel styles |
| `apps/studio/src/routes/+layout.svelte` | Layout integration point |

## Adding a New Documentation Page

1. Create a markdown file in the appropriate section directory:

```bash
# Example: add a new page to the "getting-started" section
touch guide/src/getting-started/03-new-page.md
```

2. Add front matter:

```markdown
---
title: New Page Title
order: 3
description: Brief description for meta tags.
---

Your content here.
```

3. Add the page to `guide/src/_data/navigation.json`:

```json
{
  "title": "New Page Title",
  "url": "/getting-started/03-new-page/"
}
```

4. Rebuild the guide:

```bash
pnpm --filter actone-guide build
```

## Opening the Panel Programmatically

From any Svelte component in the studio app:

```typescript
import { getDocPanelState } from '$lib/stores/doc-panel.svelte.ts';

const docPanel = getDocPanelState();

// Open to a specific page
docPanel.openDoc('language-reference/02-syntax-reference');

// Toggle panel visibility
docPanel.toggle();

// Close panel
docPanel.close();
```
