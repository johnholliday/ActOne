# Contract: Vite Guide Serving Plugin

**Feature**: `007-eleventy-doc-panel`
**Date**: 2026-03-03

## Overview

A Vite plugin that serves the Eleventy guide's static output during SvelteKit development. Intercepts requests starting with `/guide/` and serves files from `guide/_site/`.

## Request Handling

### URL Resolution

| Request URL | Resolved File Path |
|-------------|-------------------|
| `/guide/` | `guide/_site/index.html` |
| `/guide/getting-started/01-introduction/` | `guide/_site/getting-started/01-introduction/index.html` |
| `/guide/css/main.css` | `guide/_site/css/main.css` |
| `/guide/css/variables.css?v=123` | `guide/_site/css/variables.css` (query stripped) |

### Rules

1. Only intercepts requests where `req.url` starts with `/guide`
2. Strips `/guide` prefix from URL to get the file path within `_site/`
3. Strips query string parameters before file resolution
4. Appends `index.html` to URLs ending with `/`
5. Validates the resolved absolute path starts with the guide output directory (path traversal prevention)
6. If file does not exist or is not a regular file, falls through to next middleware (`next()`)
7. Sets `Content-Type` header based on file extension

### MIME Type Mapping

| Extension | Content-Type |
|-----------|-------------|
| `.html` | `text/html; charset=utf-8` |
| `.css` | `text/css; charset=utf-8` |
| `.js` | `application/javascript; charset=utf-8` |
| `.json` | `application/json; charset=utf-8` |
| `.svg` | `image/svg+xml` |
| `.png` | `image/png` |
| `.ico` | `image/x-icon` |
| (other) | `application/octet-stream` |

### Security

- **Path traversal prevention**: The resolved file path MUST start with the guide output directory. Any path that resolves outside this directory (e.g., via `../`) is rejected by falling through to `next()`.
- The plugin operates in the Vite dev server only; it does not affect production builds.

## Plugin Registration

The plugin is added to the `plugins` array in `apps/studio/vite.config.ts`, before the SvelteKit plugin.

## Prerequisites

The guide must be pre-built (`guide/_site/` must exist) before the dev server can serve it. If not built, all `/guide/*` requests fall through to SvelteKit (which returns 404).
