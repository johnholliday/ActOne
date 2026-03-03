# Contract: Doc Panel State API

**Feature**: `007-eleventy-doc-panel`
**Date**: 2026-03-03

## Overview

The Doc Panel State is a Svelte 5 runes-based singleton that manages the fly-out documentation panel. Any component in the ActOne Studio app can import it to open, close, or navigate the panel.

## Public Interface

### State Properties (read-only)

| Property | Type | Description |
|----------|------|-------------|
| `open` | `boolean` | Whether the panel is currently visible |
| `docSlug` | `string` | Current documentation page slug (e.g., "getting-started/01-introduction") |
| `docHtml` | `string` | Extracted HTML content from the fetched guide page |
| `loading` | `boolean` | Whether a page fetch is in progress |
| `error` | `string` | Error message from the last failed fetch (empty if no error) |
| `width` | `number` | Current panel width in pixels (280–800 range, default: 420) |

### Methods

#### `openDoc(slug: string): Promise<void>`

Opens the panel and navigates to the specified documentation page.

- If the panel is already open to the same slug, does nothing
- Sets `loading=true`, fetches `/guide/{slug}/`, extracts `<article>` content
- On success: sets `docHtml`, `loading=false`
- On failure: sets `error`, clears `docHtml`, `loading=false`
- Persists state to localStorage

#### `close(): void`

Closes the panel. Persists closed state to localStorage.

#### `toggle(): void`

Toggles the panel open/closed. If opening and no content is cached, fetches the current `docSlug`.

#### `setWidth(value: number): void`

Sets the panel width, clamped to [280, 800]. Persists to localStorage.

#### `handleContentClick(e: MouseEvent, contentEl?: HTMLElement): void`

Click handler for the panel content area. Intercepts link clicks:

| Link Type | Behavior |
|-----------|----------|
| Hash link (`#id`) | Smooth-scrolls to element within panel |
| Internal guide link (`/guide/*`) | Navigates in-panel via `openDoc()` |
| Relative link | Resolves against current page, navigates in-panel |
| External link (`http*`, `mailto:`) | Opens in new tab with `target="_blank" rel="noopener noreferrer"` |

#### `urlToSlug(url: string): string`

Converts a full URL path to a doc slug by stripping `/guide/` prefix and trailing slash.

#### `isActiveDoc(url: string): boolean`

Returns true if the panel is open and showing the page at the given URL.

### Singleton Access

```typescript
import { getDocPanelState } from '$lib/stores/doc-panel.svelte.ts';

const docPanel = getDocPanelState();
```

- `getDocPanelState()` — returns the singleton instance (creates it on first call)
- `initDocPanelState()` — restores persisted width from localStorage (call once on mount)

## localStorage Contract

**Key**: `actone-doc-panel`

**Schema**:
```json
{
  "open": boolean,
  "docSlug": string,
  "width": number
}
```

**Behavior**:
- Written on every state change (open/close, navigate, resize)
- Read once on `initDocPanelState()` — restores width and slug only (panel does NOT auto-open)
- Silently catches and ignores all localStorage errors (storage unavailable, quota exceeded, malformed data)
