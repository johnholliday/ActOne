# Data Model: Eleventy Documentation with In-App Fly-out Panel

**Feature**: `007-eleventy-doc-panel`
**Date**: 2026-03-03

## Entities

### 1. Documentation Page

Represents a single documentation page in the guide.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | yes | Display title of the page |
| order | number | yes | Sort order within the section (1-based) |
| section | string | yes | Section key (e.g., "getting-started", "language-reference") |
| description | string | no | Meta description for SEO and landing page |
| layout | string | yes (via section defaults) | Template layout to use |
| tags | string | yes (via section defaults) | Eleventy collection tag |

**Relationships**: Belongs to one Navigation Section (via `section` field). Has prev/next relationships with adjacent pages in the same section (derived from `order`).

### 2. Navigation Section

A logical grouping of documentation pages displayed in the sidebar.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key | string | yes | URL-safe section identifier |
| title | string | yes | Display title in sidebar |
| pages | array | yes | Ordered list of page entries |
| pages[].title | string | yes | Page display title |
| pages[].url | string | yes | Relative URL path for the page |

**Relationships**: Contains multiple Documentation Pages. Ordered by position in the `navigation.json` array.

### 3. Doc Panel State

Client-side singleton managing the fly-out panel's runtime state.

| Field | Type | Default | Persisted | Description |
|-------|------|---------|-----------|-------------|
| open | boolean | false | yes | Whether the panel is visible |
| docSlug | string | "getting-started/01-introduction" | yes | Current page slug |
| docHtml | string | "" | no | Fetched and extracted HTML content |
| loading | boolean | false | no | Whether a page is being fetched |
| error | string | "" | no | Error message from last fetch |
| width | number | 420 | yes | Panel width in pixels |

**Validation rules**:
- `width` must be between 280 and 800 (clamped on set)
- `docSlug` must be a non-empty string
- `open` defaults to false on initialization (panel never auto-opens on page load)

**Persistence format** (localStorage key: `actone-doc-panel`):

```json
{
  "open": false,
  "docSlug": "getting-started/01-introduction",
  "width": 420
}
```

### 4. Site Metadata

Global site configuration available to all templates.

| Field | Type | Required | Description |
|-------|------|---------|-------------|
| title | string | yes | Site title (e.g., "ActOne Guide") |
| description | string | yes | Site description for meta tags |

### 5. Guide Content Scope

CSS namespace isolating guide content from host app styles.

| Property | Description |
|----------|-------------|
| Container class | `.guide-content` |
| Custom property prefix | `--gc-*` (e.g., `--gc-color-text`, `--gc-font-size-base`) |
| Dark mode selector | `:root.dark .guide-content` |
| Base font size | 0.875rem (panel) / 1rem (standalone) |

## State Transitions

### Doc Panel Lifecycle

```
Closed → Opening (user triggers) → Loading (fetch in progress) → Open (content displayed)
Open → Navigating (internal link clicked) → Loading → Open (new content)
Open → Closed (Escape key or close button)
Open → Error (fetch failed) → Closed (user dismisses) or Open (retry/navigate)
```

### Page Content Fetch Flow

```
1. User triggers openDoc(slug)
2. Set loading=true, error=""
3. Fetch /guide/{slug}/
4. If response.ok:
   a. Parse HTML with DOMParser
   b. Extract <article> innerHTML
   c. Set docHtml=extracted, loading=false
5. If !response.ok:
   a. Set error=message, docHtml="", loading=false
```
