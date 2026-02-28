# Research: Wire Studio Screens to Live Functions

**Feature Branch**: `004-wire-studio-screens`
**Date**: 2026-02-27
**Phase**: 0 (Research)

## R1: Project Creation Flow

**Decision**: Wire `File > New Project` to existing `POST /api/project/create` endpoint via a modal dialog in `+layout.svelte`.

**Rationale**: The API is fully implemented — validates auth, accepts `{ title, authorName?, genre?, compositionMode?, publishingMode? }`, creates project + entry file in a DB transaction, returns `{ id, title, entryFilePath }`. The `MenuBar.svelte` already dispatches `oncreateproject` callback but `+layout.svelte` never passes a handler. The missing piece is: (1) a dialog component, (2) a handler that calls the API, (3) loading the created project into `projectStore`.

**Alternatives considered**:
- Client-side-only creation (rejected: project must persist in Supabase for RLS and cross-device access)
- Redirect to a dedicated `/new-project` route (rejected: modal dialog is simpler and matches IDE conventions)

## R2: Syntax Highlighting via Langium Semantic Tokens

**Decision**: Syntax highlighting is already implemented in the previous feature (`003-actone-studio-tests` branch). The Langium web worker produces semantic tokens and the CodeMirror extension in `langium-extension.ts` applies them. This was wired in the LSP feature work (Steps 1-2 of the prior plan fixed the worker connection bug that prevented standard handlers from registering).

**Rationale**: The `main-browser.ts` worker now correctly passes the `connection` to `createActOneServices`, enabling `startLanguageServer` to register all default LSP handlers including `textDocument/semanticTokens`. The `langium-extension.ts` already has `refreshSemanticTokens()` and `changePlugin` that fetches tokens on a 500ms debounce.

**Alternatives considered**: N/A — existing implementation is correct once the worker connection fix is applied.

## R3: Menu Action Wiring in +layout.svelte

**Decision**: Wire all 5 missing `MenuBar` callbacks (`oncreateproject`, `onadvancestage`, `onsnapshot`, `ondiagram`, `ongenerate`) in `+layout.svelte` by adding handler functions that call the corresponding APIs.

**Rationale**: `MenuBar.svelte` accepts 6 callback props: `oncreateproject`, `onadvancestage`, `onsnapshot`, `ondiagram`, `ongenerate`, `onnavigate`. Currently only `onnavigate` is wired (line 224: `onnavigate={(path) => void goto(path)}`). The other 5 callbacks are declared but never passed, so clicking those menu items calls `undefined?.()` which silently no-ops.

Each callback maps to an existing API:
- `oncreateproject` → `POST /api/project/create` (modal dialog flow)
- `onadvancestage` → `POST /api/project/lifecycle` (confirmation dialog)
- `onsnapshot` → `POST /api/analytics/snapshot` (compute metrics from AST, call API)
- `ondiagram` → `goto('/diagram/' + view)` (navigation, similar to `onnavigate`)
- `ongenerate` → `window.dispatchEvent(new CustomEvent('actone:generate-prose'))` (triggers ProseGenerationPanel)

**Alternatives considered**:
- Dispatch custom events from MenuBar instead of callbacks (rejected: callbacks are already the pattern; changing would be unnecessary refactoring)
- Move all logic into MenuBar.svelte (rejected: MenuBar should remain a presentation component; business logic belongs in the layout)

## R4: Help > User's Guide — Coming Soon Treatment

**Decision**: Disable the Help > User's Guide menu item in `MenuBar.svelte` with `disabled` attribute and append a "Coming Soon" label. Remove the `onnavigate?.('/help')` call.

**Rationale**: Per spec FR-018, the `/help` route is explicitly deferred. The menu item should be visually disabled (opacity, cursor) with a "Coming Soon" badge so users understand it's planned but not yet available.

**Alternatives considered**: Hide the menu item entirely (rejected: showing it disabled communicates planned functionality)

## R5: Spread Preview — Real Content Loading

**Decision**: Replace hardcoded "Page N" placeholder text with content fetched from `GET /api/publishing/preview`.

**Rationale**: The publishing preview API is fully implemented. It accepts a `projectId` query parameter and returns HTML manuscript content. The Spread Preview page currently shows `<p class="placeholder">Page {n}</p>` text instead of calling this API. The fix is to: (1) fetch preview HTML on mount, (2) paginate it into spread-sized chunks, (3) render actual formatted content in each page panel.

**Alternatives considered**:
- Client-side-only rendering from source files (rejected: the publishing preview API already handles manuscript assembly, formatting, and prose draft merging)
- SSR the spread preview via `+page.server.ts` (rejected: the page needs dynamic trim size changes without full page reloads)

## R6: Gallery — Asset Loading and Management

**Decision**: Fetch assets from the database on page mount and wire action buttons to appropriate APIs.

**Rationale**: The `assets` table in the schema has all fields needed (id, projectId, type, name, status, prompt, backend, metadata, createdAt). The Gallery page initializes `assets = $state<Asset[]>([])` but never populates it. A new API endpoint or direct Supabase query is needed to list assets for the active project. The approval/rejection buttons need handlers that update the `assets.status` column.

**Alternatives considered**:
- Direct Supabase client query from the page (viable, simpler, but breaks the pattern of using API routes)
- New dedicated API route `GET /api/assets/list` (consistent with existing API patterns but adds a new endpoint)

**Decision**: Use a SvelteKit `+page.server.ts` load function to query assets via Drizzle, consistent with how other server-side data loading works in SvelteKit.

## R7: Project Context Propagation to All Screens

**Decision**: Populate `projectStore` on app load from the user's most recent project (or prompt to create one). Pass `projectStore.project.id` to all data-dependent screens.

**Rationale**: Multiple screens use hardcoded data or empty arrays because `projectStore.project` is never loaded. The diagram pages have `const projectId = 'default'` comments. The fix requires: (1) a project loader in `+layout.svelte` or `+layout.server.ts` that fetches the user's projects and loads the most recent one, (2) replacing hardcoded `projectId` with `projectStore.project?.id` in all diagram pages, (3) adding "no project loaded" empty states on data-dependent screens.

**Alternatives considered**:
- URL-based project selection (`/project/:id/editor`) (rejected: current app structure uses flat routes; URL-based would require restructuring all routes)
- Local storage project ID persistence (partial: useful for remembering last project, but primary source must be the database)

## R8: User Profile Menu and Settings Pages

**Decision**: Add a click handler to the user profile footer in `+layout.svelte` that shows a popup menu with 4 options. Create 3 new settings routes (`/settings/profile`, `/settings/account`, `/settings/appearance`) and implement Sign Out.

**Rationale**: The user profile section at the bottom of the sidebar (lines 198-207 in `+layout.svelte`) renders user initials, name, and email but has no click handler or popup menu. Supabase client supports all needed auth operations:
- `signOut()` — ends session, clears cookies
- `updateUser({ data: { full_name, avatar_url } })` — profile metadata updates
- `updateUser({ password })` — password changes
- OAuth accounts visible via `user.identities` array

**Alternatives considered**:
- Modal settings dialog instead of dedicated pages (rejected: spec requires "dedicated settings page" for each area)
- Single `/settings` page with tabs (viable, reduces route count, but spec lists 3 distinct pages)

## R9: Export Route

**Decision**: Create an `/export` route that presents format options (DOCX, EPUB, PDF) and calls `POST /api/publishing/export`.

**Rationale**: The publishing export API is fully implemented — accepts `{ projectId, format }` and returns the exported file. The `MenuBar.svelte` already navigates to `/export` via `onnavigate?.('/export')`. The missing piece is the route itself with a format selection UI and download trigger.

**Alternatives considered**:
- In-editor export panel (rejected: spec says "export page opens with format options")
- Direct download without preview (rejected: users need to choose format before exporting)

## R10: Inline Loading Indicators

**Decision**: Use Svelte `{#await}` blocks with spinner/skeleton components for all async operations.

**Rationale**: Per spec FR-019 and SC-008, all async operations must show inline loading indicators within 200ms. SvelteKit's reactive patterns support this naturally: use `$state` for loading flags, show a spinner component in the loading area, and clear it when the async operation resolves.

**Alternatives considered**:
- Global loading bar (rejected: spec requires "inline" indicators within the loading area)
- Toast-based progress notifications (rejected: not "inline" per spec)

## R11: Supabase Auth Capabilities

**Decision**: Use `@supabase/supabase-js` client methods for all auth operations.

**Rationale**: Research confirmed Supabase supports all needed operations:
- `supabase.auth.signOut()` — ends session
- `supabase.auth.updateUser({ data: { full_name, avatar_url } })` — profile updates
- `supabase.auth.updateUser({ password: newPassword })` — password change
- `supabase.auth.getUser()` returns `user.identities` — linked OAuth providers
- Google and GitHub OAuth are already configured (confirmed in auth/+page.svelte)
- Session management via `@supabase/ssr` cookies is already working

**Alternatives considered**: N/A — Supabase is already the auth provider; no alternative needed.
