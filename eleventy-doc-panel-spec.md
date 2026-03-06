# Eleventy Documentation with In-App Fly-out Panel — Implementation Specification

This specification describes how to add an Eleventy-powered documentation site to any SvelteKit + Tailwind project, served both as a standalone site and as an in-app fly-out panel. The system is production-proven and works across local development, Docker, and any Node-based deployment.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Eleventy Static Site](#2-eleventy-static-site)
3. [SvelteKit Integration — Development](#3-sveltekit-integration--development)
4. [SvelteKit Integration — Fly-out Panel](#4-sveltekit-integration--fly-out-panel)
5. [Production Build & Docker](#5-production-build--docker)
6. [File Inventory](#6-file-inventory)
7. [Step-by-Step Implementation Checklist](#7-step-by-step-implementation-checklist)
8. [Content Generation Instructions](#8-content-generation-instructions)
9. [Langium Grammar Language Reference](#9-langium-grammar-language-reference)

---

## 1. Architecture Overview

```text
┌──────────────────────────────────────────────────────────┐
│  Eleventy (guide/)                                       │
│  ┌──────────────┐    eleventy build    ┌──────────────┐  │
│  │ Markdown +   │ ──────────────────►  │ _site/       │  │
│  │ Nunjucks     │                      │ (static HTML)│  │
│  └──────────────┘                      └──────┬───────┘  │
└───────────────────────────────────────────────┼──────────┘
                                                │
                    ┌───────────────────────────┼────────┐
                    │  SvelteKit App            │        │
                    │                           ▼        │
                    │  ┌─── Vite Plugin ─── /guide/* ──┐ │
                    │  │  (dev: serve from _site/)     │ │
                    │  └───────────────────────────────┘ │
                    │                                    │
                    │  ┌─── DocPanel.svelte ───────────┐ │
                    │  │  fetch("/guide/{slug}/")      │ │
                    │  │  DOMParser → extract <article>│ │
                    │  │  render in resizable aside    │ │
                    │  └───────────────────────────────┘ │
                    │                                    │
                    │  ┌─── Production ────────────────┐ │
                    │  │  guide/_site/* copied into    │ │
                    │  │  build/client/guide/          │ │
                    │  │  (served as static assets)    │ │
                    │  └───────────────────────────────┘ │
                    └────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
| --- | --- |
| **Eleventy for docs** | Zero runtime overhead, pure static HTML, no framework lock-in |
| **Dual serving** | Guide works standalone (SEO, sharing) and in-app (contextual help) |
| **Fetch + DOMParser** | Panel extracts `<article>` from pre-built HTML; no SSR needed for docs |
| **CSS namespace isolation** | All panel styles scoped under `.guide-content` to prevent Tailwind conflicts |
| **localStorage persistence** | Panel width + last-viewed page survive page navigations and sessions |
| **Path prefix `/guide/`** | Clean subpath; configurable via Eleventy's `pathPrefix` |

---

## 2. Eleventy Static Site

### 2.1 Directory Structure

```text
guide/
├── eleventy.config.js
├── package.json
├── src/
│   ├── _data/
│   │   ├── navigation.json      # Section/page navigation tree
│   │   ├── site.json            # Site title + description
│   │   └── year.js              # Dynamic copyright year
│   ├── _includes/
│   │   ├── layouts/
│   │   │   └── base.njk         # Master HTML layout
│   │   └── partials/
│   │       ├── nav.njk          # Header with theme toggle
│   │       ├── sidebar.njk      # Left sidebar navigation
│   │       ├── breadcrumb.njk   # Breadcrumb trail
│   │       └── footer.njk       # Footer
│   ├── css/
│   │   ├── main.css             # Import orchestrator
│   │   ├── reset.css            # CSS reset
│   │   ├── variables.css        # CSS custom properties (100+ tokens)
│   │   ├── typography.css       # Text styles
│   │   ├── layout.css           # Header/sidebar/content grid
│   │   └── components.css       # Callouts, tables, prev/next nav
│   ├── index.md                 # Landing page
│   ├── {section-a}/             # Content sections (one directory each)
│   │   ├── {section-a}.json     # Front matter defaults for section
│   │   ├── 01-first-page.md
│   │   ├── 02-second-page.md
│   │   └── ...
│   └── {section-b}/
│       └── ...
└── _site/                       # Build output (gitignored)
```

### 2.2 Package Configuration

```json
{
  "name": "{project}-guide",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "eleventy --serve --port=8080",
    "build": "eleventy",
    "clean": "rm -rf _site"
  },
  "dependencies": {
    "@11ty/eleventy": "^3.1.0",
    "@11ty/eleventy-navigation": "^0.3.5"
  }
}
```

**Root package.json additions:**

```json
{
  "scripts": {
    "guide:dev": "npm --prefix guide run dev",
    "guide:build": "npm --prefix guide run build"
  }
}
```

If using pnpm workspaces, add `guide` to `pnpm-workspace.yaml`:

```yaml
packages:
  - 'guide'
```

### 2.3 Eleventy Configuration

```javascript
// guide/eleventy.config.js
import eleventyNavigationPlugin from '@11ty/eleventy-navigation';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Pass through CSS files unchanged
  eleventyConfig.addPassthroughCopy('src/css');

  // Custom filter: get pages in the same section, sorted by order
  eleventyConfig.addFilter('sectionPages', function (collection, section) {
    return collection
      .filter((item) => item.data.section === section)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  // Custom filter: get previous page in section
  eleventyConfig.addFilter('prevInSection', function (collection, section, order) {
    const pages = collection
      .filter((item) => item.data.section === section)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
    const idx = pages.findIndex((p) => p.data.order === order);
    return idx > 0 ? pages[idx - 1] : null;
  });

  // Custom filter: get next page in section
  eleventyConfig.addFilter('nextInSection', function (collection, section, order) {
    const pages = collection
      .filter((item) => item.data.section === section)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
    const idx = pages.findIndex((p) => p.data.order === order);
    return idx >= 0 && idx < pages.length - 1 ? pages[idx + 1] : null;
  });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
    pathPrefix: '/guide/',
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['md', 'njk', 'html'],
  };
}
```

**Key points:**

- `pathPrefix: '/guide/'` — all generated URLs are prefixed so the site can be hosted at `/guide/` as a subpath of the main app
- `markdownTemplateEngine: 'njk'` — enables Nunjucks expressions inside markdown files (for callouts, HTML divs, etc.)
- Custom `prevInSection`/`nextInSection` filters drive the prev/next page navigation

### 2.4 Data Files

**`src/_data/site.json`** — Global site metadata available as `{{ site.title }}`:

```json
{
  "title": "{Your Project} Guide",
  "description": "A comprehensive guide to {your project}."
}
```

**`src/_data/year.js`** — Dynamic copyright year:

```javascript
export default () => new Date().getFullYear();
```

**`src/_data/navigation.json`** — Defines the sidebar navigation tree. Each section has a key, display title, and ordered list of pages:

```json
{
  "sections": [
    {
      "key": "getting-started",
      "title": "Getting Started",
      "pages": [
        { "title": "Introduction", "url": "/getting-started/01-introduction/" },
        { "title": "Quick Start", "url": "/getting-started/02-quick-start/" }
      ]
    },
    {
      "key": "advanced",
      "title": "Advanced",
      "pages": [
        { "title": "Configuration", "url": "/advanced/01-configuration/" }
      ]
    },
    {
      "key": "reference",
      "title": "Reference",
      "pages": [
        { "title": "Glossary", "url": "/reference/glossary/" }
      ]
    }
  ]
}
```

### 2.5 Templates

#### Master Layout (`src/_includes/layouts/base.njk`)

The master layout renders the full standalone page: header, sidebar, breadcrumb, article content, prev/next navigation, and footer. It also includes the theme toggle script.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }} — {{ site.title }}</title>
  <meta name="description" content="{{ description | default(site.description) }}">
  <link rel="stylesheet" href="{{ '/css/main.css' | url }}">
  <script>
    // Apply saved theme before paint to prevent FOUC
    (function() {
      var theme = localStorage.getItem('{project}-guide-theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  </script>
</head>
<body>
  {% include "partials/nav.njk" %}

  <div class="page-wrapper">
    {% include "partials/sidebar.njk" %}

    <main class="main-content">
      {% include "partials/breadcrumb.njk" %}

      <article>
        <h1>{{ title }}</h1>
        {{ content | safe }}
      </article>

      {# Prev / Next navigation within the same section #}
      {% if section and order %}
        {% set prev = collections.all | prevInSection(section, order) %}
        {% set next = collections.all | nextInSection(section, order) %}
        {% if prev or next %}
        <nav class="prev-next" aria-label="Page navigation">
          {% if prev %}
          <a href="{{ prev.url | url }}" class="prev-next-link prev-next-link--prev">
            <span class="prev-next-label">&larr; Previous</span>
            <span class="prev-next-title">{{ prev.data.title }}</span>
          </a>
          {% endif %}
          {% if next %}
          <a href="{{ next.url | url }}" class="prev-next-link prev-next-link--next">
            <span class="prev-next-label">Next &rarr;</span>
            <span class="prev-next-title">{{ next.data.title }}</span>
          </a>
          {% endif %}
        </nav>
        {% endif %}
      {% endif %}
    </main>
  </div>

  {% include "partials/footer.njk" %}

  <script>
    document.getElementById('theme-toggle').addEventListener('click', function() {
      var html = document.documentElement;
      var isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('{project}-guide-theme', 'light');
      } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('{project}-guide-theme', 'dark');
      }
    });
  </script>
</body>
</html>
```

**Critical for fly-out integration:** The content is wrapped in `<article>` — the panel extracts `article.innerHTML` via DOMParser.

#### Header (`src/_includes/partials/nav.njk`)

```html
<header class="site-header">
  <nav class="header-nav">
    <a href="{{ '/' | url }}" class="header-brand">
      <strong>{Project}</strong>&nbsp; Guide
    </a>
  </nav>
  <div class="header-actions">
    <a href="{{ '/' | url }}" class="header-link header-link--active">Documentation</a>
    <button
      type="button"
      class="theme-toggle"
      id="theme-toggle"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      <svg class="theme-icon theme-icon--light" xmlns="http://www.w3.org/2000/svg"
           width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round"
           stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      <svg class="theme-icon theme-icon--dark" xmlns="http://www.w3.org/2000/svg"
           width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round"
           stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  </div>
</header>
```

#### Sidebar (`src/_includes/partials/sidebar.njk`)

```html
<aside class="sidebar">
  {% for section in navigation.sections %}
  <div class="sidebar-section">
    <div class="sidebar-section-title">{{ section.title }}</div>
    <ul class="sidebar-nav">
      {% for navPage in section.pages %}
      <li>
        <a href="{{ navPage.url | url }}"
           {% if page.url === navPage.url %} class="active"{% endif %}>
          {{ navPage.title }}
        </a>
      </li>
      {% endfor %}
    </ul>
  </div>
  {% endfor %}
</aside>
```

#### Breadcrumb (`src/_includes/partials/breadcrumb.njk`)

```html
{% if section %}
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="{{ '/' | url }}">Guide</a>
  <span class="breadcrumb-separator">/</span>
  {% for s in navigation.sections %}
    {% if s.key === section %}
      <span>{{ s.title }}</span>
      <span class="breadcrumb-separator">/</span>
      <span>{{ title }}</span>
    {% endif %}
  {% endfor %}
</nav>
{% endif %}
```

#### Footer (`src/_includes/partials/footer.njk`)

```html
<footer class="site-footer">
  <p>&copy; {{ year }} {Your Project}. All rights reserved.</p>
</footer>
```

### 2.6 Content Authoring

Each section directory contains a JSON file that provides front matter defaults for all pages in that section, plus individual markdown files.

**Section defaults (`src/{section}/{section}.json`):**

```json
{
  "layout": "layouts/base.njk",
  "tags": "{section}",
  "section": "{section}"
}
```

**Individual pages** only need `title`, `order`, and `description`:

```markdown
---
title: Page Title
order: 1
description: Brief description for meta tags.
---

Content goes here. Nunjucks expressions work inside markdown.

## Subheading

Regular markdown content.

<div class="callout callout-info">
<div class="callout-title">Note</div>

Callout content with **markdown** inside HTML divs.

</div>
```

**Content features supported:**

- Standard markdown (headings, lists, tables, code blocks, links, images)
- HTML callout blocks: `.callout-tip`, `.callout-info`, `.callout-warning`, `.callout-danger`
- Formula blocks: `<div class="formula">...</div>`
- Landing page sections: `.landing-hero`, `.landing-sections`, `.landing-section`
- Definition lists (`<dt>`/`<dd>`) for glossary pages
- Prev/next navigation auto-generated from `section` + `order` front matter

### 2.7 CSS Architecture

The guide uses plain CSS with CSS custom properties (no Tailwind, no preprocessors). This is intentional — the guide must be fully self-contained and its styles must not conflict with the host app.

**Import chain** (`main.css`):

```css
@import 'reset.css';      /* Box-sizing, margins, base resets */
@import 'variables.css';   /* 100+ CSS custom properties */
@import 'typography.css';  /* Body, headings, links, lists, code, blockquotes */
@import 'layout.css';      /* Header, sidebar, content grid, footer, responsive */
@import 'components.css';  /* Breadcrumb, callouts, tables, prev/next, landing, glossary */
```

**Design tokens** (defined in `variables.css`):

| Category | Examples |
| --- | --- |
| Colors | `--color-primary`, `--color-text`, `--color-bg`, `--color-link` |
| Typography | `--font-sans`, `--font-mono`, `--font-size-sm` through `--font-size-4xl` |
| Spacing | `--space-1` (0.25rem) through `--space-16` (4rem) |
| Layout | `--sidebar-width` (280px), `--header-height` (64px), `--content-max-width` (780px) |
| Shadows | `--shadow-sm`, `--shadow-md` |

**Dark mode** uses `[data-theme='dark']` on the root element, toggled by a button and persisted to localStorage. All semantic tokens are re-assigned in the dark selector.

**Layout structure:**

```text
┌─────────────────────────────────────────┐
│  .site-header (sticky, 64px)            │
├───────────────┬─────────────────────────┤
│  .sidebar     │  .main-content          │
│  (280px,      │  (max 780px,            │
│   sticky,     │   padding 2rem 3rem)    │
│   scroll-y)   │                         │
│               │  .breadcrumb            │
│  section-     │  <article>              │
│  title        │    <h1>                 │
│  nav links    │    content...           │
│               │  </article>             │
│               │  .prev-next             │
├───────────────┴─────────────────────────┤
│  .site-footer                           │
└─────────────────────────────────────────┘
```

**Responsive:** At `max-width: 900px`, the grid collapses to single column — sidebar becomes a horizontal band above content.

---

## 3. SvelteKit Integration — Development

### 3.1 Vite Plugin for Dev Server

During development, a custom Vite plugin intercepts requests starting with `/guide/` and serves files from the Eleventy build output directory (`guide/_site/`). This lets developers access the guide at `http://localhost:{port}/guide/` without running a separate server.

**Add to `apps/web/vite.config.ts` (or your SvelteKit app's vite config):**

```typescript
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveGuide(): Plugin {
  const guideDir = resolve(__dirname, '../../guide/_site');

  return {
    name: 'serve-guide',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/guide')) return next();

        let urlPath = req.url.replace(/^\/guide/, '') || '/';
        // Strip query string
        const qIdx = urlPath.indexOf('?');
        if (qIdx !== -1) urlPath = urlPath.slice(0, qIdx);
        // Directory → index.html
        if (urlPath.endsWith('/')) urlPath += 'index.html';

        const filePath = join(guideDir, urlPath);

        // Security: prevent path traversal
        if (!filePath.startsWith(guideDir)) return next();

        if (!existsSync(filePath) || !statSync(filePath).isFile()) return next();

        const ext = extname(filePath);
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        res.end(readFileSync(filePath));
      });
    },
  };
}
```

Register the plugin:

```typescript
export default defineConfig({
  plugins: [serveGuide(), /* ...other plugins */],
});
```

**Prerequisite:** The guide must be built before the dev server can serve it. Run `guide:build` before `dev`, or run `guide:dev` in a separate terminal for live-reload authoring.

---

## 4. SvelteKit Integration — Fly-out Panel

This is the core feature: a resizable sidebar panel that fetches guide pages and displays them inline within the app. Users never leave the app to read documentation.

### 4.1 State Management (`src/lib/sidebar-state.svelte.ts`)

A Svelte 5 runes singleton manages the panel's open/close state, current page, fetched HTML, width, and loading/error states. All state persists to localStorage.

```typescript
const STORAGE_KEY = '{project}-doc-panel';
const DEFAULT_DOC_PAGE = '{section}/01-{first-page}';
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 280;
const MAX_WIDTH = 800;

interface DocPanelPersisted {
  open: boolean;
  docSlug: string;
  width: number;
}

function createDocPanelState() {
  let open = $state(false);
  let docSlug = $state(DEFAULT_DOC_PAGE);
  let docHtml = $state('');
  let loading = $state(false);
  let error = $state('');
  let width = $state(DEFAULT_WIDTH);

  return {
    get open() { return open; },
    get docSlug() { return docSlug; },
    get docHtml() { return docHtml; },
    get loading() { return loading; },
    get error() { return error; },
    get width() { return width; },

    setWidth(value: number) {
      width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, value));
      persist();
    },

    async openDoc(slug: string) {
      if (open && docSlug === slug) return;

      docSlug = slug;
      open = true;
      loading = true;
      error = '';
      persist();

      try {
        const url = `/guide/${slug}/`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load page (${res.status})`);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const article =
          doc.querySelector('article') ??
          doc.querySelector('main') ??
          doc.querySelector('.content');
        docHtml = article ? article.innerHTML : doc.body.innerHTML;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load page';
        docHtml = '';
      } finally {
        loading = false;
      }
    },

    close() {
      open = false;
      persist();
    },

    toggle() {
      if (open) {
        open = false;
      } else {
        open = true;
        if (!docHtml && docSlug) {
          void this.openDoc(docSlug);
        }
      }
      persist();
    },

    urlToSlug(url: string): string {
      return url.replace(/^\/?(guide\/)?/, '').replace(/\/$/, '');
    },

    isActiveDoc(url: string): boolean {
      return open && docSlug === this.urlToSlug(url);
    },

    handleContentClick(e: MouseEvent, contentEl?: HTMLElement) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Hash links: smooth scroll within panel
      if (href.startsWith('#')) {
        e.preventDefault();
        const id = href.slice(1);
        const el = contentEl?.querySelector(`#${CSS.escape(id)}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Internal guide links: fetch and display in panel
      if (
        href.startsWith('/guide/') ||
        href.startsWith('/{section-a}/') ||
        href.startsWith('/{section-b}/') ||
        href.startsWith('/{section-c}/')
      ) {
        e.preventDefault();
        const slug = this.urlToSlug(href);
        if (slug) void this.openDoc(slug);
        return;
      }

      // Relative links: resolve against current page
      if (!href.startsWith('http') && !href.startsWith('mailto:')) {
        e.preventDefault();
        const currentDir = docSlug.substring(0, docSlug.lastIndexOf('/'));
        const resolved = new URL(href, `http://x/${currentDir}/`).pathname;
        const slug = this.urlToSlug(resolved);
        if (slug) void this.openDoc(slug);
        return;
      }

      // External links: open in new tab
      target.setAttribute('target', '_blank');
      target.setAttribute('rel', 'noopener noreferrer');
    },
  };

  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ open, docSlug, width } satisfies DocPanelPersisted),
      );
    } catch {
      // localStorage unavailable
    }
  }
}

let docPanelState: ReturnType<typeof createDocPanelState> | undefined;

export function getDocPanelState() {
  docPanelState ??= createDocPanelState();
  return docPanelState;
}

export function initDocPanelState() {
  const state = getDocPanelState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as DocPanelPersisted;
      if (typeof saved.width === 'number' && saved.width >= MIN_WIDTH) {
        state.setWidth(saved.width);
      }
      if (typeof saved.docSlug === 'string' && saved.docSlug) {
        // Remember the slug but don't auto-open on page load
      }
    }
  } catch {
    // ignore malformed data
  }
}
```

**Key behaviors:**

- `openDoc(slug)` fetches `/guide/{slug}/`, parses the HTML, and extracts `<article>` content
- `handleContentClick` intercepts all clicks inside the panel: guide links navigate in-panel, hash links smooth-scroll, external links open in new tabs
- `initDocPanelState()` restores width from localStorage but does NOT auto-open the panel
- The singleton pattern (`getDocPanelState()`) ensures one instance shared across all components

### 4.2 Panel Component (`src/lib/components/doc-panel.svelte`)

```svelte
<script lang="ts">
  import { getDocPanelState, initDocPanelState } from '$lib/sidebar-state.svelte.ts';
  import { onMount } from 'svelte';
  import X from '@lucide/svelte/icons/x';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import './guide-panel.css';

  const docPanel = getDocPanelState();

  let contentEl: HTMLElement | undefined = $state();
  let dragging = $state(false);

  onMount(() => {
    initDocPanelState();
  });

  // Scroll to top when doc content changes
  $effect(() => {
    if (docPanel.docHtml && contentEl) {
      contentEl.scrollTop = 0;
    }
  });

  // --- Resize drag on RIGHT edge ---
  function onResizePointerDown(e: PointerEvent) {
    e.preventDefault();
    dragging = true;
    const startX = e.clientX;
    const startWidth = docPanel.width;

    function onPointerMove(ev: PointerEvent) {
      const delta = ev.clientX - startX;
      docPanel.setWidth(startWidth + delta);
    }

    function onPointerUp() {
      dragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  $effect(() => {
    if (dragging) {
      document.body.classList.add('select-none', 'cursor-col-resize');
      return () => {
        document.body.classList.remove('select-none', 'cursor-col-resize');
      };
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && docPanel.open) {
      docPanel.close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if docPanel.open}
  <aside
    class="bg-background relative flex min-h-0 shrink-0 flex-col overflow-hidden border-r"
    style:width="{docPanel.width}px"
    aria-label="Documentation panel"
  >
    <!-- Header -->
    <div class="flex shrink-0 items-center justify-between border-b px-4 py-3">
      <h2 class="text-foreground text-sm font-semibold">Documentation</h2>
      <div class="flex items-center gap-2">
        <a
          href="/guide/"
          class="text-muted-foreground hover:text-foreground text-xs"
          target="_blank"
          rel="noopener noreferrer"
          title="Open full guide in new tab"
        >
          <ExternalLink class="size-3.5" />
        </a>
        <button
          type="button"
          onclick={() => docPanel.close()}
          class="text-muted-foreground hover:text-foreground flex h-6 w-6 items-center
                 justify-center rounded"
          aria-label="Close documentation panel"
        >
          <X class="size-4" />
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div
      class="guide-content flex-1 overflow-y-auto px-5 py-4"
      bind:this={contentEl}
      onclick={(e) => docPanel.handleContentClick(e, contentEl)}
    >
      {#if docPanel.loading}
        <div class="flex items-center justify-center py-12">
          <div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300
                      border-t-green-600"></div>
        </div>
      {:else if docPanel.error}
        <div class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700
                    dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {docPanel.error}
        </div>
      {:else}
        {@html docPanel.docHtml}
      {/if}
    </div>

    <!-- Resize handle on RIGHT edge -->
    <div
      class="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize select-none"
      class:bg-green-500={dragging}
      class:hover:bg-gray-300={!dragging}
      class:dark:hover:bg-gray-600={!dragging}
      onpointerdown={onResizePointerDown}
    ></div>
  </aside>
{/if}
```

**Features:**

- Conditionally rendered when `docPanel.open` is true
- Fixed header with title, external-link icon (opens full guide), and close button
- Scrollable content area with `.guide-content` class for CSS isolation
- Right-edge resize handle using pointer events (280–800px range)
- Loading spinner and error state
- `Escape` key closes the panel
- During drag, `select-none` and `cursor-col-resize` are applied to `<body>` to prevent text selection

### 4.3 Layout Integration

In the root `+layout.svelte`, the DocPanel sits alongside the main content in a flex container. Each panel scrolls independently.

```svelte
<div class="flex min-h-0 flex-1">
  <DocPanel />
  <div class="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
    <div class="mx-auto max-w-7xl px-4 py-8">
      {@render children()}
    </div>
  </div>
  <!-- Other panels (chat, details, etc.) go here -->
</div>
```

**Layout requirements:**

- Parent must be `flex` with `min-h-0` (prevents flex children from overflowing)
- DocPanel is `shrink-0` with explicit width — it doesn't grow/shrink with the viewport
- Main content is `flex-1 min-w-0` — it takes remaining space and can shrink below intrinsic width
- Each section scrolls independently (`overflow-y-auto`)

### 4.4 Opening the Panel from Anywhere

Any component can trigger the panel by importing the singleton state:

```typescript
import { getDocPanelState } from '$lib/sidebar-state.svelte.ts';

const docPanel = getDocPanelState();

// Open a specific page
docPanel.openDoc('getting-started/01-introduction');

// Toggle panel
docPanel.toggle();
```

Common trigger points:

- Sidebar navigation items (help/docs link)
- Contextual help icons next to features
- Keyboard shortcuts
- Chat responses that reference documentation

### 4.5 Scoped Panel CSS (`src/lib/components/guide-panel.css`)

All styles for guide content rendered inside the panel are scoped under the `.guide-content` class. This prevents the guide's typography, colors, and layout from leaking into or conflicting with the host app's Tailwind styles.

**Structure:**

- CSS custom properties prefixed `--gc-` (guide content) to avoid collisions
- Light mode defaults set on `.guide-content`
- Dark mode overrides on `:root.dark .guide-content`
- Every element selector prefixed: `.guide-content h1`, `.guide-content a`, `.guide-content table`, etc.
- Smaller font sizes than the standalone guide (0.875rem base for panel vs 1rem standalone)
- Breadcrumb hidden in panel (`.guide-content .breadcrumb { display: none; }`)
- Prev/next navigation, callouts, code blocks, tables, definition lists, formula blocks all styled
- Responsive: single-column prev/next at narrow widths

The full CSS file is ~470 lines. It mirrors the standalone guide's styles but at reduced scale and with proper namespace isolation.

---

## 5. Production Build & Docker

### 5.1 Dockerfile Integration

The guide is built during the Docker image build and copied into SvelteKit's static client assets:

```dockerfile
# In the build stage, after building the SvelteKit app:

# Build the guide (Eleventy static site)
RUN pnpm --filter {project}-guide build \
 && mkdir -p apps/web/build/client/guide \
 && cp -r guide/_site/* apps/web/build/client/guide/

# In the production stage, the guide is already inside:
COPY --from=build /app/apps/web/build ./apps/web/build
```

**Flow:**

1. Turborepo builds all packages including the SvelteKit app
2. Eleventy builds the guide to `guide/_site/`
3. The static guide files are copied into `apps/web/build/client/guide/`
4. SvelteKit's adapter-node serves everything under `build/client/` as static assets
5. Requests to `/guide/*` are served directly from the filesystem — no middleware needed

### 5.2 Non-Docker Production

For non-Docker deployments:

1. Build the guide: `npm --prefix guide run build`
2. Build the SvelteKit app
3. Copy `guide/_site/*` into the SvelteKit build output's static directory (e.g., `build/client/guide/`)
4. Deploy the combined output

---

## 6. File Inventory

### Eleventy Guide (new directory)

| File | Purpose |
| --- | --- |
| `guide/package.json` | Eleventy 3.1.0 + navigation plugin |
| `guide/eleventy.config.js` | Config with custom filters, pathPrefix `/guide/` |
| `guide/src/_data/site.json` | Site title + description |
| `guide/src/_data/navigation.json` | Section/page navigation tree |
| `guide/src/_data/year.js` | Dynamic copyright year |
| `guide/src/_includes/layouts/base.njk` | Master layout (header, sidebar, content, prev/next, footer) |
| `guide/src/_includes/partials/nav.njk` | Header with theme toggle |
| `guide/src/_includes/partials/sidebar.njk` | Sidebar navigation |
| `guide/src/_includes/partials/breadcrumb.njk` | Breadcrumb trail |
| `guide/src/_includes/partials/footer.njk` | Footer |
| `guide/src/css/main.css` | Import orchestrator |
| `guide/src/css/reset.css` | CSS reset |
| `guide/src/css/variables.css` | CSS custom properties (100+ tokens, light + dark) |
| `guide/src/css/typography.css` | Text styles |
| `guide/src/css/layout.css` | Grid layout, header, sidebar, responsive |
| `guide/src/css/components.css` | Callouts, tables, prev/next, landing, glossary |
| `guide/src/index.md` | Landing page |
| `guide/src/{section}/{section}.json` | Section front matter defaults |
| `guide/src/{section}/NN-{page}.md` | Content pages |

### SvelteKit App (modifications to existing)

| File | Purpose |
| --- | --- |
| `apps/web/vite.config.ts` | Add `serveGuide()` plugin |
| `apps/web/src/lib/sidebar-state.svelte.ts` | New: doc panel state singleton |
| `apps/web/src/lib/components/doc-panel.svelte` | New: fly-out panel component |
| `apps/web/src/lib/components/guide-panel.css` | New: scoped panel styles (~470 lines) |
| `apps/web/src/routes/+layout.svelte` | Modified: add `<DocPanel />` to layout |

### Build/Deploy

| File | Purpose |
| --- | --- |
| `package.json` (root) | Add `guide:dev` + `guide:build` scripts |
| `pnpm-workspace.yaml` | Add `guide` to workspace packages |
| `Dockerfile` | Add guide build + copy step |
| `.gitignore` | Add `guide/_site/` |

---

## 7. Step-by-Step Implementation Checklist

### Phase 1: Eleventy Guide Scaffold

- [ ] Create `guide/` directory with `package.json` (Eleventy 3.1.0 + navigation plugin)
- [ ] Add `guide` to `pnpm-workspace.yaml` and root `package.json` scripts
- [ ] Create `guide/eleventy.config.js` with pathPrefix, custom filters
- [ ] Create data files: `site.json`, `navigation.json`, `year.js`
- [ ] Create layout: `base.njk` with article wrapper (critical for panel extraction)
- [ ] Create partials: `nav.njk`, `sidebar.njk`, `breadcrumb.njk`, `footer.njk`
- [ ] Create CSS files: `main.css`, `reset.css`, `variables.css`, `typography.css`, `layout.css`, `components.css`
- [ ] Add `guide/_site/` to `.gitignore`
- [ ] Create landing page `index.md` and at least one content section with pages
- [ ] Verify: `cd guide && npm run build && npm run dev` serves at `http://localhost:8080`

### Phase 2: Vite Dev Integration

- [ ] Add `serveGuide()` plugin to `vite.config.ts`
- [ ] Build guide once: `npm --prefix guide run build`
- [ ] Verify: SvelteKit dev server serves guide at `http://localhost:{port}/guide/`

### Phase 3: Fly-out Panel

- [ ] Install `@lucide/svelte` (for X and ExternalLink icons) if not already present
- [ ] Create `sidebar-state.svelte.ts` with state singleton
- [ ] Create `guide-panel.css` with scoped styles under `.guide-content`
- [ ] Create `doc-panel.svelte` component
- [ ] Add `<DocPanel />` to root `+layout.svelte` in the flex container
- [ ] Add a trigger (sidebar link, button, etc.) that calls `docPanel.openDoc(slug)`
- [ ] Verify: clicking trigger opens panel, links navigate within panel, resize works, Escape closes

### Phase 4: Production

- [ ] Add guide build + copy step to Dockerfile (or deployment script)
- [ ] Verify: production build serves guide at `/guide/` and panel works

### Customization Points

When adapting to a new project, update these values:

| Value | Where | Example |
| --- | --- | --- |
| Project name | `site.json`, `nav.njk`, `footer.njk` | `"Acme Platform Guide"` |
| Path prefix | `eleventy.config.js` | `/guide/` or `/docs/` |
| localStorage keys | `sidebar-state.svelte.ts`, `base.njk` | `acme-doc-panel`, `acme-guide-theme` |
| Color palette | `variables.css`, `guide-panel.css` | Change green to blue/indigo/etc. |
| Navigation sections | `navigation.json` | Your own section structure |
| Section directories | `guide/src/` | Match `navigation.json` keys |
| Default doc page | `sidebar-state.svelte.ts` | First page slug |
| Guide link patterns | `handleContentClick` in state | Match your section key names |
| Vite plugin path | `vite.config.ts` | Adjust `../../guide/_site` relative path |
| Docker copy path | `Dockerfile` | Match your app's build output location |

---

## 8. Content Generation Instructions

The guide's documentation content targets **end users** of the application, not developers building it. When implementing this specification via `/speckit.specify` or equivalent, Claude must generate all markdown content by analyzing the project's source code, types, UI components, and domain logic.

### 8.1 Audience and Voice

- **Primary audience:** End users who interact with the application's UI, not developers or contributors
- **Voice:** Clear, friendly, authoritative. Explain concepts from the user's perspective — what they see, what they can do, why it matters
- **Assumed knowledge:** Users understand their own domain (e.g., finance, data modeling, language design) but may not understand the application's specific terminology or workflows
- **Never expose:** Internal architecture, implementation details, API internals, database schemas, or code structure. The documentation describes the product as a black box

### 8.2 Content Discovery Process

Claude must analyze the project to derive documentation content. The discovery process follows this priority order:

1. **UI routes and pages** — Examine SvelteKit routes (`src/routes/`), page components, and layouts to identify every user-facing screen. Each distinct screen or workflow deserves at least one documentation page

2. **Domain types and models** — Read TypeScript interfaces, Zod schemas, and database schemas to understand the data model from the user's perspective. Translate technical field names into user-friendly concepts

3. **Features and capabilities** — Identify what users can do: CRUD operations, searches, filters, visualizations, exports, integrations. Map these to documentation pages organized by workflow

4. **Configuration and settings** — Find user-configurable options, preferences, environment toggles. Document what each setting controls and when users should change it

5. **Existing documentation** — Check for README files, inline comments, specification documents (`docs/`, `.specify/`), and any existing user-facing text (onboarding flows, tooltips, empty states) to harvest domain vocabulary and feature descriptions

6. **Error states and edge cases** — Identify error handling patterns, validation rules, and common failure modes. Document troubleshooting steps users might need

### 8.3 Required Documentation Sections

Every project's guide must include these minimum sections, adapted to the project's domain:

**Getting Started (section: `getting-started`)**

- **Welcome / Introduction** — What the application does, who it's for, and how the guide is organized
- **Core Concepts** — 2-4 pages explaining the fundamental domain concepts users must understand before using the application. Derive these from the project's type definitions, domain models, and specification documents
- **Quick Tour / Dashboard Walkthrough** — A visual tour of the main UI, explaining what each area shows and how to navigate
- **First Workflow** — A step-by-step walkthrough of the most common end-to-end task (e.g., "Your First Report", "Creating Your First Project", "Running Your First Analysis")

**User Guide (section: `guide` or domain-specific name)**

- One page per major feature or workflow area
- Each page follows the pattern: what it is, why you'd use it, how to use it (step-by-step), tips and best practices
- Include screenshots or descriptions of what users will see at each step
- Use callout blocks for tips (`.callout-tip`), warnings (`.callout-warning`), and important notes (`.callout-info`)

**Reference (section: `reference`)**

- **Glossary** — Every domain-specific term used in the application, defined in plain language. Use definition lists (`<dt>`/`<dd>`) for proper formatting. Derive terms from type names, UI labels, specification documents, and inline comments
- **Keyboard Shortcuts** — If the application has any keyboard shortcuts or hotkeys
- **FAQ / Troubleshooting** — Common questions and solutions, derived from error handling code and validation rules

### 8.4 Content Quality Standards

- **Every page must be substantial** — Minimum 300 words of meaningful content. No stub pages or placeholder text
- **Use concrete examples** — Don't just describe features abstractly. Show specific scenarios with realistic values from the domain
- **Progressive disclosure** — Getting Started pages assume zero prior knowledge. Guide pages assume the user completed Getting Started. Reference pages are lookup-oriented
- **Cross-reference liberally** — Link between pages using relative markdown links. The fly-out panel intercepts these links and navigates in-panel
- **Tables for structured comparisons** — Use markdown tables to compare options, list supported values, or show feature matrices
- **Callouts for important information** — Use the four callout types consistently:
  - `.callout-tip` — Best practices, pro tips, efficiency suggestions
  - `.callout-info` — Important context that isn't a warning
  - `.callout-warning` — Gotchas, common mistakes, things that could cause confusion
  - `.callout-danger` — Actions that could cause data loss, irreversible operations, or security concerns

### 8.5 Navigation Structure Generation

When generating `navigation.json`, follow these rules:

- Sections appear in learning order: introductory first, advanced last, reference at the end
- Pages within sections are numbered (`01-`, `02-`, etc.) and ordered from foundational to specialized
- Page titles are concise (2-6 words) and action-oriented where possible
- Every page listed in `navigation.json` must have a corresponding markdown file
- The landing page (`index.md`) must link to every page with a one-line description

---

## 9. Langium Grammar Language Reference

If the target project includes a Langium grammar definition (`.langium` files), the documentation **must** include a comprehensive language reference section. This section serves end users who write or read documents in the DSL, not developers who maintain the grammar.

### 9.1 Detection

Check for Langium grammar files:

- `**/*.langium` — grammar definition files
- `langium-config.json` or `langium` key in `package.json` — Langium project configuration
- `src/language/` or `src/grammar/` directories — common Langium source locations

If any of these exist, the language reference section is **mandatory**.

### 9.2 Grammar Analysis Process

Claude must read and fully understand the Langium grammar to generate the language reference:

1. **Parse the `.langium` file(s)** — Identify all grammar rules, terminals, keywords, cross-references, and data types

2. **Identify the rule hierarchy** — Determine the entry rule (typically the first parser rule), container rules, and leaf rules. Map out the containment hierarchy

3. **Extract keywords and operators** — Catalog every keyword (`'keyword'`), operator, and punctuation symbol used in the grammar

4. **Identify cross-references** — Find all `[ReferenceType:ID]` patterns to understand how elements reference each other

5. **Read validators and scoping** — Check TypeScript validation files and scoping providers to understand semantic rules that aren't expressed in the grammar syntax alone

6. **Check existing examples** — Look for test fixtures, example files, or sample documents in the project that demonstrate the DSL in use

### 9.3 Required Language Reference Pages

Add a dedicated section (e.g., `language-reference`) with the following pages:

**Language Overview (`01-language-overview.md`)**

- What the language is for and what problems it solves
- Who uses it and in what contexts
- A complete "hello world" equivalent — the simplest valid document
- A more realistic example showing the language's key features
- How documents are structured at a high level (what goes at the top, what's nested inside what)

**Syntax Reference (`02-syntax-reference.md`)**

- **Document structure** — The top-level structure, required vs optional elements
- **Keywords** — Every keyword in the grammar, grouped logically (declarations, modifiers, types, control flow, etc.), with a brief explanation of each
- **Data types** — All supported literal types (strings, numbers, booleans, identifiers, etc.) with syntax examples
- **Operators** — All operators with precedence and associativity if applicable
- **Comments** — How to write single-line and multi-line comments
- **Naming rules** — What constitutes a valid identifier, naming conventions

**Element Reference (`03-element-reference.md` and additional pages as needed)**

One subsection or page per major grammar rule/concept. For each element:

- **Purpose** — What it represents and when to use it
- **Syntax** — The exact syntax pattern, using a clear notation (railroad diagrams described textually, or BNF-like notation)
- **Properties/attributes** — All configurable fields with their types and whether they're required or optional
- **Relationships** — What it can contain, what can contain it, what it can reference
- **Example** — A complete, realistic example showing the element in context
- **Validation rules** — Any constraints enforced beyond syntax (uniqueness, required combinations, value ranges)

**Domain Use Cases (`04-use-cases.md`)**

This page demonstrates the language's versatility with **at least 4 complete, realistic examples** targeting different domains or scenarios:

- Each use case must include:
  - A brief scenario description (2-3 sentences explaining the problem being solved)
  - The complete DSL document (fully valid, ready to use)
  - Annotations explaining key design choices in the example
  - Expected output or behavior (what happens when this document is processed)

- Examples should be diverse and cover:
  - **Simple case** — Minimal but realistic, showing the most common usage pattern
  - **Complex case** — Demonstrates advanced features, nesting, cross-references
  - **Domain A** — A specific industry or use case (e.g., e-commerce, healthcare, education)
  - **Domain B** — A contrasting domain to show the language's generality

- Use domain-appropriate names, values, and relationships — not generic `foo`/`bar` placeholders

**Best Practices (`05-best-practices.md`)**

- Naming conventions for different element types
- Document organization patterns (how to structure large documents)
- Common patterns and idioms
- Anti-patterns and what to do instead
- Performance considerations (if applicable — e.g., avoid deeply nested structures)

### 9.4 Language Reference Quality Standards

- **Every grammar rule must be documented** — No undocumented syntax. If a user can write it, they must be able to look it up
- **Examples must be valid** — Every code example in the language reference must be syntactically and semantically valid according to the grammar and validators
- **Use the project's actual grammar** — Don't generalize or simplify. Document the exact syntax the grammar accepts
- **Format DSL examples with fenced code blocks** — Use the language name as the code fence language identifier (e.g., ` ```mydsl `) for visual distinction, even if no syntax highlighter exists
- **Cross-reference between pages** — Link from use cases back to syntax reference, from element reference to related elements
- **Include the grammar's error messages** — If validators produce specific error messages, document what triggers them and how to fix them

### 9.5 Navigation Structure for Language Reference

Add to `navigation.json`:

```json
{
  "key": "language-reference",
  "title": "Language Reference",
  "pages": [
    { "title": "Language Overview", "url": "/language-reference/01-language-overview/" },
    { "title": "Syntax Reference", "url": "/language-reference/02-syntax-reference/" },
    { "title": "Element Reference", "url": "/language-reference/03-element-reference/" },
    { "title": "Use Cases & Examples", "url": "/language-reference/04-use-cases/" },
    { "title": "Best Practices", "url": "/language-reference/05-best-practices/" }
  ]
}
```

Add corresponding section defaults (`guide/src/language-reference/language-reference.json`):

```json
{
  "layout": "layouts/base.njk",
  "tags": "language-reference",
  "section": "language-reference"
}
```
