# UI Contracts: Wire Studio Screens to Live Functions

**Feature Branch**: `004-wire-studio-screens`
**Date**: 2026-02-27

## Overview

This feature is a UI wiring effort — it connects existing frontend screens to existing backend APIs. The contracts below document the expected interfaces between UI components and the APIs they consume. No new API endpoints are created (all endpoints already exist); these contracts formalize the integration points.

---

## C1: New Project Dialog → Project Create API

**Trigger**: `File > New Project` menu item click
**UI Component**: New Project dialog (modal) in `+layout.svelte`
**API**: `POST /api/project/create`

### Request

```typescript
{
  title: string;           // 1-200 chars, required
  authorName?: string;     // max 200 chars
  genre?: string;          // max 100 chars
  compositionMode?: 'merge' | 'overlay' | 'sequential';  // default: 'merge'
  publishingMode?: 'text' | 'graphic-novel';              // default: 'text'
}
```

### Response (201)

```typescript
{
  id: string;              // UUID of created project
  title: string;
  entryFilePath: string;   // path to the generated entry .actone file
}
```

### Error Responses

- `401` — Not authenticated
- `400` — Validation error (Zod)

### Post-Action

1. Call `projectStore.load()` with project metadata and files
2. Navigate to `/` (editor view)
3. Open entry file in CodeMirror editor

---

## C2: Advance Stage → Project Lifecycle API

**Trigger**: `File > Advance Stage > {target}` menu item click
**UI Component**: Stage advancement handler in `+layout.svelte`
**API**: `POST /api/project/lifecycle`

### Request

```typescript
{
  projectId: string;       // UUID
  targetStage: 'draft' | 'revision' | 'final' | 'published';
  notes?: string;          // max 500 chars, optional
}
```

### Response (200)

```typescript
{
  previousStage: string;
  currentStage: string;
  snapshotId: string;      // UUID of the created lifecycle snapshot
}
```

### Error Responses

- `401` — Not authenticated
- `403` — Not project owner
- `400` — Invalid transition
- `409` — Already at target stage

### Post-Action

1. Call `projectStore.updateStage(response.currentStage)`
2. Show success toast/inline confirmation

---

## C3: Take Snapshot → Analytics Snapshot API

**Trigger**: `File > Take Snapshot` menu item click
**UI Component**: Snapshot handler in `+layout.svelte`
**API**: `POST /api/analytics/snapshot`

### Request

```typescript
{
  projectId: string;       // UUID
  wordCount: number;
  sceneCount: number;
  characterCount: number;
  metrics: {
    sceneTypeDistribution: Record<string, number>;
    characterScreenTime: Record<string, number>;
    pacingRhythm: string[];
  }
}
```

Metrics are computed client-side from the active AST using `lib/project/analytics.ts`.

### Response (201)

```typescript
{
  id: string;              // UUID of snapshot
  capturedAt: string;      // ISO timestamp
}
```

### Post-Action

1. Show success confirmation with timestamp

---

## C4: Spread Preview → Publishing Preview API

**Trigger**: Navigate to `/spread-preview`
**UI Component**: Spread Preview page
**API**: `GET /api/publishing/preview?projectId={id}`

### Response (200)

```typescript
{
  html: string;            // Formatted manuscript HTML
  wordCount: number;
  pageEstimate: number;
}
```

### Post-Action

1. Parse HTML into page-sized chunks based on selected trim size
2. Render content in spread panels replacing placeholder text

---

## C5: Gallery → Asset Listing

**Trigger**: Navigate to `/gallery`
**UI Component**: Gallery page
**Data Source**: Drizzle query via `+page.server.ts` load function

### Load Function Returns

```typescript
{
  assets: Array<{
    id: string;
    type: 'portrait' | 'cover' | 'scene' | 'style-board' | 'chapter-header' | 'panel';
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    prompt: string;
    backend: string;
    metadata: Record<string, unknown>;  // includes storageUrl
    createdAt: string;
  }>
}
```

### Asset Status Update

**API**: Direct Supabase client update or new server action
**Action**: Approve/Reject buttons update `assets.status`

---

## C6: Export Page → Publishing Export API

**Trigger**: Navigate to `/export` (via `File > Export Manuscript`)
**UI Component**: Export page (new route)
**API**: `POST /api/publishing/export`

### Request

```typescript
{
  projectId: string;       // UUID
  format: 'docx' | 'epub' | 'pdf';
}
```

### Response (200)

Binary file download with appropriate `Content-Type` and `Content-Disposition` headers.

### Post-Action

1. Browser initiates file download

---

## C7: User Profile → Supabase Auth

**Trigger**: Click user profile section in sidebar
**UI Component**: Profile popup menu + settings pages

### Sign Out

```typescript
await supabase.auth.signOut();
// → Redirect to /auth
```

### Update Profile

```typescript
await supabase.auth.updateUser({
  data: { full_name: newName, avatar_url: newUrl }
});
```

### Change Password

```typescript
await supabase.auth.updateUser({
  password: newPassword
});
```

### Get Linked Accounts

```typescript
const { data: { user } } = await supabase.auth.getUser();
const identities = user?.identities ?? [];
// Each identity has: { provider: 'google' | 'github', ... }
```

---

## C8: Project Context → All Data-Dependent Screens

**Contract**: Every screen that displays project data MUST read from `projectStore.project?.id` rather than using a hardcoded identifier.

**Affected screens**: All 5 diagram routes, Story Bible, Statistics, Gallery, Reading Mode, Spread Preview.

**Empty state contract**: When `projectStore.project` is `null`, each screen MUST display a "No project loaded" message with a call-to-action to create or open a project.
