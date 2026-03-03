# Feature Specification: Eleventy Documentation with In-App Fly-out Panel

**Feature Branch**: `007-eleventy-doc-panel`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Eleventy documentation site with in-app fly-out panel for SvelteKit"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Documentation in Standalone Site (Priority: P1)

A documentation author or end user navigates to `/guide/` in their browser and reads the full documentation site as a standalone experience. The site has a sidebar navigation, breadcrumb trail, dark/light theme toggle, and prev/next page navigation. Content is organized into sections (Getting Started, User Guide, Language Reference, Reference) with pages ordered for progressive learning.

**Why this priority**: The standalone documentation site is the foundation. It must exist and be fully functional before the in-app panel can fetch and display its content. It also serves SEO, external sharing, and users who prefer a dedicated documentation experience.

**Independent Test**: Can be fully tested by building the Eleventy site (`guide:build`) and browsing `http://localhost:8080/guide/` — delivers a complete, navigable documentation experience with all content sections, theme toggle, and prev/next navigation.

**Acceptance Scenarios**:

1. **Given** the guide has been built, **When** a user navigates to `/guide/`, **Then** the landing page loads with links to all documentation sections and a brief description of each
2. **Given** the user is on any documentation page, **When** they click a sidebar navigation link, **Then** the corresponding page loads with correct content, breadcrumb, and active sidebar state
3. **Given** the user is on a page within a section, **When** they reach the bottom of the page, **Then** prev/next navigation links appear pointing to the correct adjacent pages in the section
4. **Given** the user clicks the theme toggle, **When** the page re-renders, **Then** the theme switches between light and dark mode and the preference persists across page loads via localStorage

---

### User Story 2 - Access Documentation In-App via Fly-out Panel (Priority: P2)

While using the ActOne Studio application, an end user opens a contextual documentation panel without leaving the app. The panel slides in from the side, displays the requested documentation page, and allows the user to navigate between guide pages entirely within the panel. The panel is resizable and can be closed with Escape or a close button.

**Why this priority**: The in-app panel is the primary differentiating feature — it keeps users in their workflow while providing contextual help. It depends on the standalone site (P1) being built, as it fetches pre-rendered HTML from the guide's static output.

**Independent Test**: Can be tested by triggering the panel open (via a help/docs button or programmatic call), verifying it fetches and renders guide content, navigating between pages within the panel, resizing it, and closing it — all without leaving the main application view.

**Acceptance Scenarios**:

1. **Given** the user is in the ActOne Studio app, **When** they trigger the documentation panel (e.g., clicking a help/docs button), **Then** a resizable sidebar panel appears showing the requested documentation page
2. **Given** the panel is open and displaying a page, **When** the user clicks an internal guide link within the content, **Then** the panel navigates to that page in-place without opening a new browser tab
3. **Given** the panel is open, **When** the user clicks a hash link (e.g., `#section-heading`), **Then** the panel smooth-scrolls to that heading within the current page
4. **Given** the panel is open, **When** the user clicks an external link (http/https to a non-guide URL), **Then** the link opens in a new browser tab
5. **Given** the panel is open, **When** the user drags the resize handle, **Then** the panel width changes within the allowed range (280px to 800px) and the width persists across sessions via localStorage
6. **Given** the panel is open, **When** the user presses Escape or clicks the close button, **Then** the panel closes and the main app reclaims the full width

---

### User Story 3 - Serve Guide in Development via Vite Plugin (Priority: P2)

During local development, a developer accesses the guide at `http://localhost:{port}/guide/` through the SvelteKit dev server without running a separate Eleventy server. A Vite plugin intercepts `/guide/*` requests and serves files from the Eleventy build output directory.

**Why this priority**: Same priority as the panel because both depend on P1 and are required for a working development experience. Without the Vite plugin, the in-app panel cannot fetch guide pages during development.

**Independent Test**: Can be tested by building the guide once (`guide:build`), starting the SvelteKit dev server, and navigating to `http://localhost:{port}/guide/` — the guide renders correctly with all assets (CSS, images).

**Acceptance Scenarios**:

1. **Given** the guide has been built to `guide/_site/`, **When** the SvelteKit dev server is running, **Then** requests to `/guide/*` return the correct static files from the Eleventy build output
2. **Given** a request to `/guide/getting-started/01-introduction/`, **When** the Vite plugin resolves the path, **Then** it serves `guide/_site/getting-started/01-introduction/index.html` with the correct Content-Type header
3. **Given** a request to a path that traverses outside the guide directory (e.g., `/guide/../../etc/passwd`), **When** the Vite plugin processes it, **Then** the request is rejected (path traversal prevention)

---

### User Story 4 - Include Guide in Production Build (Priority: P3)

When the application is built for production (Docker or standalone), the guide's static files are included in the build output so that `/guide/*` routes work in production without a separate server.

**Why this priority**: Production deployment is essential but comes after the core functionality is working in development. The pattern is straightforward — copy static files into the SvelteKit build output.

**Independent Test**: Can be tested by running the full production build pipeline and verifying that `/guide/` pages load correctly from the deployed application.

**Acceptance Scenarios**:

1. **Given** the production build runs, **When** the build completes, **Then** all guide static files exist in the SvelteKit build output under the `/guide/` path
2. **Given** the production app is running, **When** a user navigates to `/guide/`, **Then** the documentation loads and functions identically to the standalone site
3. **Given** the production app is running, **When** the in-app panel fetches a guide page, **Then** the content loads successfully from the production-served static files

---

### User Story 5 - ActOne Language Reference Documentation (Priority: P3)

An end user writing ActOne DSL files reads a comprehensive language reference section within the guide. This section documents every grammar element, keyword, data type, cross-reference pattern, and validation rule — derived from the actual Langium grammar. It includes realistic use-case examples across multiple domains.

**Why this priority**: The language reference is high-value content but depends on the documentation infrastructure (P1/P2) being in place. It is the most content-heavy section and can be authored incrementally.

**Independent Test**: Can be tested by verifying the language reference section has pages for language overview, syntax reference, element reference, use cases, and best practices — each with valid ActOne code examples that parse without errors.

**Acceptance Scenarios**:

1. **Given** the language reference section exists, **When** a user navigates to it, **Then** they find pages covering language overview, syntax reference, element reference, use cases, and best practices
2. **Given** the syntax reference page, **When** a user looks up any keyword or element type from the ActOne grammar, **Then** they find its documentation with syntax, properties, and examples
3. **Given** the use cases page, **When** a user reads the examples, **Then** each example is a complete, valid ActOne document that demonstrates the language in a realistic domain context

---

### Edge Cases

- What happens when the guide has not been built yet and the Vite plugin receives a `/guide/*` request? The plugin falls through to the next middleware (SvelteKit returns 404).
- What happens when the panel fetches a guide page that doesn't exist (404)? The panel displays a user-friendly error message.
- What happens when the panel is open and the browser window is resized to a very narrow width? The panel respects its minimum width (280px) and the main content area shrinks; at extremely narrow viewports the user should close the panel.
- What happens when localStorage is unavailable (private browsing, storage full)? The panel uses default settings (closed, default width, default page) and silently ignores persistence failures.
- What happens when the guide's CSS conflicts with the host app's Tailwind styles? All panel styles are scoped under a `.guide-content` class with namespaced CSS custom properties (`--gc-*`) to prevent leakage in both directions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a static documentation site served at the `/guide/` URL path prefix
- **FR-002**: System MUST include a master HTML layout that wraps page content in an `<article>` element (required for panel content extraction)
- **FR-003**: System MUST provide sidebar navigation driven by a `navigation.json` data file with sections and ordered pages
- **FR-004**: System MUST provide a light/dark theme toggle that persists the user's preference to localStorage
- **FR-005**: System MUST provide prev/next page navigation within each section, driven by `section` and `order` front matter
- **FR-006**: System MUST provide a breadcrumb trail showing the current section and page
- **FR-007**: System MUST serve guide static files during development by intercepting `/guide/*` requests in the dev server
- **FR-008**: The dev server integration MUST prevent path traversal attacks by validating resolved file paths stay within the guide output directory
- **FR-009**: System MUST provide an in-app fly-out panel component that fetches guide HTML, extracts `<article>` content, and renders it in a resizable sidebar
- **FR-010**: The fly-out panel MUST intercept clicks on internal guide links and navigate within the panel (not open new tabs)
- **FR-011**: The fly-out panel MUST intercept hash links and smooth-scroll to the target element within the panel
- **FR-012**: The fly-out panel MUST open external links in a new browser tab with appropriate security attributes
- **FR-013**: The fly-out panel MUST be resizable via a drag handle within a defined range (minimum 280px, maximum 800px)
- **FR-014**: The fly-out panel MUST persist its open/closed state, current page slug, and width to localStorage
- **FR-015**: The fly-out panel MUST be closable via Escape key or a close button
- **FR-016**: The fly-out panel's rendered content MUST be styled with scoped CSS to prevent style conflicts with the host application
- **FR-017**: System MUST include the guide's static output in the production build so `/guide/*` routes work without a separate server
- **FR-018**: The guide MUST include a language reference section documenting all ActOne grammar elements, keywords, cross-references, and validation rules with valid code examples
- **FR-019**: System MUST provide a singleton state manager that any component can import to open the panel to a specific documentation page
- **FR-020**: The guide's CSS MUST use plain CSS with CSS custom properties (no utility-first CSS framework, no preprocessors) to remain self-contained and conflict-free

### Key Entities

- **Guide Site**: The static documentation site containing all content, templates, and CSS. Lives in a `guide/` directory at the project root.
- **Documentation Page**: A content file with metadata (`title`, `order`, `section`, `description`) rendered into a static HTML page within a section.
- **Navigation Section**: A logical grouping of documentation pages (e.g., "Getting Started", "Language Reference") defined in a navigation data file and rendered in the sidebar.
- **Doc Panel State**: A client-side singleton managing the fly-out panel's open/closed state, current page slug, fetched HTML content, width, loading state, and error state. Persisted to localStorage.
- **Guide Content Scope**: The CSS namespace (`.guide-content` class with `--gc-*` custom properties) that isolates guide typography and layout from the host application's styles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can access any documentation page within 2 clicks from the guide landing page (sidebar navigation provides direct access to all pages)
- **SC-002**: The in-app panel opens and displays content within 1 second of the user triggering it (for pre-built guide content served locally)
- **SC-003**: 100% of guide links clicked within the fly-out panel navigate correctly — internal links stay in-panel, hash links scroll, external links open new tabs
- **SC-004**: The guide renders correctly in both light and dark themes with no visual artifacts or readability issues
- **SC-005**: Zero style conflicts between the guide panel content and the host application's UI — guide styles do not leak out and app styles do not leak in
- **SC-006**: The language reference section documents every grammar element, keyword, and validation rule present in the ActOne grammar
- **SC-007**: All code examples in the language reference are syntactically and semantically valid ActOne documents
- **SC-008**: The standalone guide site scores 90+ on Lighthouse accessibility audit
- **SC-009**: Panel width preference and theme preference persist correctly across browser sessions (localStorage round-trip)
- **SC-010**: The production build includes the guide and serves it without any additional server configuration

## Assumptions

- The guide directory will be added to the monorepo workspace as a workspace package
- The host application is ActOne Studio (SvelteKit + Tailwind CSS + Svelte 5 runes)
- The icon library is `lucide-svelte` with individual icon imports
- The layout system uses dockview-core; the panel will integrate alongside existing panels or as a standalone fly-out
- Content targets end users of the ActOne Studio application, not developers
- The guide uses plain CSS (not Tailwind) to maintain independence from the host app's styling system
- Font sizes in the fly-out panel are slightly smaller than the standalone site (0.875rem vs 1rem base) for space efficiency
- The default panel width is 420px
- The panel appears on the left side of the layout (matching the reference specification's positioning)
