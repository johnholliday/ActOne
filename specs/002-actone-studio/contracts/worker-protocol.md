# Worker Protocol Contract: Langium Web Worker

**Branch**: `002-actone-studio` | **Date**: 2026-02-24

The Langium web worker communicates with the main thread using the LSP (Language Server Protocol) over `postMessage`. This document defines the custom extensions beyond standard LSP.

---

## Transport

- **Protocol**: LSP over `BrowserMessageReader`/`BrowserMessageWriter` (from `vscode-languageserver/browser.js`)
- **Direction**: Bidirectional — main thread sends requests/notifications, worker sends responses/notifications

---

## Standard LSP Methods (Used)

### Main Thread → Worker (Requests)

| Method | Purpose |
| ------ | ------- |
| `textDocument/completion` | Get completions at cursor position |
| `textDocument/hover` | Get hover info at position |
| `textDocument/definition` | Go to definition |
| `textDocument/references` | Find all references |
| `textDocument/rename` | Rename symbol |
| `textDocument/formatting` | Format document |
| `textDocument/documentSymbol` | Get outline/symbol tree |
| `textDocument/semanticTokens/full` | Get semantic tokens for highlighting |
| `textDocument/codeAction` | Get code actions (quick fixes) |

### Main Thread → Worker (Notifications)

| Method | Purpose |
| ------ | ------- |
| `textDocument/didOpen` | File opened in editor |
| `textDocument/didChange` | File content changed |
| `textDocument/didClose` | File closed in editor |

### Worker → Main Thread (Notifications)

| Method | Purpose |
| ------ | ------- |
| `textDocument/publishDiagnostics` | Validation errors/warnings |

---

## Custom Extensions

### `actone/openProject` (Request)

**Direction**: Main thread → Worker

**Purpose**: Load all project files into the worker's Langium workspace.

**Request params**:
```typescript
{
  projectId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  authToken: string;
  compositionMode: 'merge' | 'overlay' | 'sequential';
  fileOrder: Array<{ uri: string; priority: number }>;
}
```

**Response**:
```typescript
{
  loadedFiles: number;
  diagnosticsSummary: { errors: number; warnings: number };
}
```

---

### `actone/updateFile` (Notification)

**Direction**: Main thread → Worker

**Purpose**: Update a single file in the worker's cache (on save from another source).

**Params**:
```typescript
{
  filePath: string;
  content: string;
}
```

---

### `actone/getSerializedAst` (Request)

**Direction**: Main thread → Worker

**Purpose**: Get the full serialized AST for the active document (used by diagram transformers and AI context assembly on the main thread).

**Request params**:
```typescript
{
  uri: string;
}
```

**Response**:
```typescript
{
  ast: SerializedStory;   // Plain JSON-compatible AST (no Langium internals)
  valid: boolean;
  errors: number;
}
```

Note: The serialized AST strips Langium-internal properties (`$container`, `$document`, `$cstNode`) and resolves cross-references to plain name strings. This is the representation used by the main thread for diagram transformation, AI context assembly, and Story Bible generation.

---

### `actone/getAstForAllFiles` (Request)

**Direction**: Main thread → Worker

**Purpose**: Get merged AST across all project files (for multi-file projects).

**Request params**:
```typescript
{
  projectId: string;
}
```

**Response**:
```typescript
{
  stories: Array<{
    uri: string;
    ast: SerializedStory;
    valid: boolean;
  }>;
}
```

---

### `actone/formatDocument` (Request)

**Direction**: Main thread → Worker

**Purpose**: Format a document and return the formatted text (alternative to LSP formatting for direct text replacement).

**Request params**:
```typescript
{
  uri: string;
}
```

**Response**:
```typescript
{
  formattedText: string;
}
```
