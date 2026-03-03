# Contract: Guide HTML Structure

**Feature**: `007-eleventy-doc-panel`
**Date**: 2026-03-03

## Overview

The Eleventy guide produces static HTML pages with a consistent structure. The fly-out panel depends on this structure to extract content.

## Critical Extraction Point

The fly-out panel uses `DOMParser` to parse fetched HTML and extracts content using this priority:

1. `document.querySelector('article')` — primary extraction target
2. `document.querySelector('main')` — fallback
3. `document.querySelector('.content')` — second fallback
4. `document.body` — last resort

**Requirement**: Every guide page MUST wrap its main content in an `<article>` element.

## Master Layout Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Page Title} — {Site Title}</title>
  <link rel="stylesheet" href="/guide/css/main.css">
  <script>/* Theme initialization (prevent FOUC) */</script>
</head>
<body>
  <header class="site-header"><!-- Nav + theme toggle --></header>

  <div class="page-wrapper">
    <aside class="sidebar"><!-- Navigation --></aside>

    <main class="main-content">
      <nav class="breadcrumb"><!-- Breadcrumb trail --></nav>

      <article>              <!-- ⬅ EXTRACTION TARGET -->
        <h1>{Page Title}</h1>
        {Content}
      </article>

      <nav class="prev-next"><!-- Prev/Next links --></nav>
    </main>
  </div>

  <footer class="site-footer"><!-- Copyright --></footer>
</body>
</html>
```

## Content Features

The following HTML patterns may appear inside `<article>` and must be styled by `guide-panel.css`:

| Pattern | Class | Description |
|---------|-------|-------------|
| Headings | `h1`–`h6` | Standard markdown headings |
| Code blocks | `pre > code` | Fenced code blocks with optional language class |
| Inline code | `code` | Backtick-wrapped inline code |
| Tables | `table` | Markdown tables |
| Callout: tip | `.callout.callout-tip` | Best practice advice |
| Callout: info | `.callout.callout-info` | Important context |
| Callout: warning | `.callout.callout-warning` | Gotchas and common mistakes |
| Callout: danger | `.callout.callout-danger` | Destructive actions warnings |
| Formula | `.formula` | Mathematical or conceptual formulas |
| Definition list | `dt` / `dd` | Glossary-style definitions |
| Blockquote | `blockquote` | Quoted text |
| Lists | `ul`, `ol` | Ordered and unordered lists |
| Links | `a[href]` | Internal, external, and hash links |
| Images | `img` | Inline images |

## Theme Support

The guide supports two themes:

| Theme | Mechanism |
|-------|-----------|
| Light | Default (no attribute on `<html>`) |
| Dark | `data-theme="dark"` attribute on `<html>` |

Theme is persisted to localStorage under key `actone-guide-theme`.

For the fly-out panel, dark mode uses `:root.dark .guide-content` (matching the host app's Tailwind dark mode convention).
