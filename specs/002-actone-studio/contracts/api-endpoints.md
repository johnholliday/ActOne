# API Contracts: ActOne Studio Server Endpoints

**Branch**: `002-actone-studio` | **Date**: 2026-02-24

All endpoints are SvelteKit `+server.ts` files. Authentication is handled via `@supabase/ssr` hooks — all endpoints require an authenticated session unless noted. Request/response bodies are validated with Zod schemas from `@repo/shared`.

---

## 1. AI Text Generation

### POST /api/ai-text/generate

**Purpose**: Stream prose generation for a scene.

**Request**:
```typescript
{
  projectId: string;       // UUID
  sceneName: string;       // Scene to generate prose for
  backendId: string;       // Active text backend ID
  temperature: number;     // 0.0–2.0
  pacing: string;          // slow | moderate | fast | frantic
}
```

**Response**: `text/event-stream` (SSE)
```typescript
// Each event:
data: { type: 'chunk', text: string, tokenCount: number }
data: { type: 'done', fullText: string, totalTokens: number, durationMs: number }
data: { type: 'error', error: string }
data: { type: 'cost', actualCostUsd: number }
```

**Errors**: 400 (invalid scene), 401 (unauthenticated), 503 (backend unavailable)

---

### POST /api/ai-text/estimate

**Purpose**: Estimate generation cost before executing.

**Request**:
```typescript
{
  projectId: string;
  sceneName: string;
  backendId: string;
}
```

**Response**: `200 OK`
```typescript
{
  estimatedCostUsd: number;
  estimatedTokens: number;
  estimatedWords: number;
}
```

---

### GET /api/ai-text/backends

**Purpose**: List available text generation backends with status.

**Response**: `200 OK`
```typescript
{
  backends: Array<{
    id: string;
    name: string;
    available: boolean;
    active: boolean;
    capabilities: {
      maxContextTokens: number;
      streaming: boolean;
      concurrentRequests: number;
    };
  }>;
}
```

---

### PUT /api/ai-text/backends

**Purpose**: Switch active text backend.

**Request**:
```typescript
{ backendId: string; }
```

**Response**: `200 OK`
```typescript
{ activeBackendId: string; }
```

---

## 2. AI Image Generation

### POST /api/ai-image/generate

**Purpose**: Generate an image asset.

**Request**:
```typescript
{
  projectId: string;
  type: 'portrait' | 'cover' | 'scene' | 'style-board' | 'chapter-header' | 'panel';
  name: string;
  backendId: string;
  // Type-specific fields:
  characterName?: string;    // for portrait
  sceneName?: string;        // for scene
  panelIndex?: number;       // for panel
  pageIndex?: number;        // for panel
}
```

**Response**: `200 OK`
```typescript
{
  assetId: string;
  prompt: string;            // The generated prompt
  status: 'pending';
  storageUrl: string;        // Signed URL for the image
}
```

---

### GET /api/ai-image/backends

**Purpose**: List available image generation backends.

**Response**: Same structure as text backends.

---

### POST /api/ai-image/visual-dna

**Purpose**: Generate or update Visual DNA for a character.

**Request**:
```typescript
{
  projectId: string;
  characterName: string;
  referenceImageAssetId?: string;   // Existing approved portrait
  storyPoint?: number;              // 0–100 story progress
  storyPointLabel?: string;
}
```

**Response**: `200 OK`
```typescript
{
  characterName: string;
  physicalDescription: string;
  visualTraits: string[];
  mannerisms: string[];
  symbolMotifs: string[];
  versions: Array<{
    storyPoint: number;
    label: string;
    description: string;
    referenceImageUrl?: string;
  }>;
}
```

---

## 3. Draft Management

### GET /api/draft/list

**Purpose**: Get all draft versions for a project/scene.

**Query params**: `projectId`, `sceneName` (optional)

**Response**: `200 OK`
```typescript
{
  drafts: Array<{
    id: string;
    sceneName: string;
    paragraphIndex: number;
    content: string;
    status: 'pending' | 'accepted' | 'rejected' | 'editing';
    backend: string;
    model: string;
    temperature: number;
    tokenCount: number;
    costUsd: number;
    createdAt: string;
  }>;
}
```

---

### PUT /api/draft/update

**Purpose**: Accept, reject, or change status of a draft.

**Request**:
```typescript
{
  draftId: string;
  status: 'accepted' | 'rejected' | 'editing';
}
```

**Response**: `200 OK`
```typescript
{ id: string; status: string; }
```

---

## 4. Publishing

### POST /api/publishing/export

**Purpose**: Generate manuscript exports.

**Request**:
```typescript
{
  projectId: string;
  formats: ('epub' | 'docx' | 'pdf' | 'kindle')[];
  trimSize?: string;       // For PDF: '6x9', '5.5x8.5', etc.
  paperType?: string;      // For PDF: 'offset', 'coated', 'bond', 'white'
}
```

**Response**: `200 OK`
```typescript
{
  exports: Array<{
    format: string;
    fileSize: number;
    storagePath: string;
    downloadUrl: string;       // Signed URL, expires in 1 hour
  }>;
}
```

**Note**: The `kindle` format generates EPUB 3 fixed-layout (`rendition:layout=pre-paginated`) with panel region metadata sidecar. Distinct from standard `epub` (reflowable). Only valid for projects in `graphic-novel` publishing mode.

---

### GET /api/publishing/preview

**Purpose**: Generate HTML preview of the manuscript.

**Query params**: `projectId`

**Response**: `200 OK` with `Content-Type: text/html`

---

### GET /api/publishing/dependencies

**Purpose**: Check if the project has sufficient content for publishing.

**Query params**: `projectId`

**Response**: `200 OK`
```typescript
{
  ready: boolean;
  acceptedSceneCount: number;
  totalSceneCount: number;
  wordCount: number;
  missingScenes: string[];     // Scene names without accepted drafts
  hasCoverImage: boolean;
}
```

---

## 5. Project Management

### POST /api/project/create

**Purpose**: Create a new project.

**Request**:
```typescript
{
  title: string;
  authorName?: string;
  genre?: string;
  compositionMode?: 'merge' | 'overlay' | 'sequential';
  publishingMode?: 'text' | 'graphic-novel';
}
```

**Response**: `201 Created`
```typescript
{
  id: string;
  title: string;
  entryFilePath: string;
}
```

---

### GET /api/project/manifest

**Purpose**: Get project metadata.

**Query params**: `projectId`

**Response**: `200 OK`
```typescript
{
  id: string;
  title: string;
  authorName: string;
  genre: string;
  grammarVersion: string;
  grammarFingerprint: string;
  compositionMode: string;
  lifecycleStage: string;
  publishingMode: string;
  fileCount: number;
  createdAt: string;
  modifiedAt: string;
}
```

---

### POST /api/project/lifecycle

**Purpose**: Advance lifecycle stage (captures snapshot).

**Request**:
```typescript
{
  projectId: string;
  targetStage: 'draft' | 'revision' | 'final' | 'published';
  notes?: string;
}
```

**Response**: `200 OK`
```typescript
{
  previousStage: string;
  currentStage: string;
  snapshotId: string;
}
```

**Errors**: 400 (invalid transition), 409 (already at target or published)

---

## 6. Analytics

### POST /api/analytics/snapshot

**Purpose**: Capture an analytics snapshot.

**Request**:
```typescript
{
  projectId: string;
  wordCount: number;
  sceneCount: number;
  characterCount: number;
  metrics: {
    sceneTypeDistribution: Record<string, number>;
    characterScreenTime: Record<string, number>;
    pacingRhythm: string[];
  };
}
```

**Response**: `201 Created`
```typescript
{ id: string; capturedAt: string; }
```

---

### GET /api/analytics/timeseries

**Purpose**: Get analytics history for a project.

**Query params**: `projectId`, `limit` (optional, default 50)

**Response**: `200 OK`
```typescript
{
  snapshots: Array<{
    id: string;
    wordCount: number;
    sceneCount: number;
    characterCount: number;
    metrics: Record<string, unknown>;
    capturedAt: string;
  }>;
}
```

---

## 7. File Operations (Service Role)

### POST /api/project/[id]/files

**Purpose**: Create or delete source files (requires service role for admin operations).

**Request**:
```typescript
{
  action: 'create' | 'delete';
  filePath: string;
  content?: string;          // For create
  isEntry?: boolean;         // For create
}
```

**Response**: `200 OK`
```typescript
{ filePath: string; action: string; }
```
