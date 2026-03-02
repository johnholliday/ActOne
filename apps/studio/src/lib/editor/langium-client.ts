/**
 * Main-thread LSP client for communicating with the Langium web worker.
 *
 * Implements a lightweight JSON-RPC 2.0 client over postMessage, translating
 * between CodeMirror extension calls and standard/custom LSP methods.
 */

import type { SerializedStory } from '@repo/shared';

/* ── JSON-RPC Types ──────────────────────────────────────────────── */

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

type JsonRpcMessage = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;

/* ── LSP Protocol Types (subset used by the client) ──────────────── */

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface TextEdit {
  range: Range;
  newText: string;
}

export interface Diagnostic {
  range: Range;
  severity?: DiagnosticSeverity;
  code?: number | string;
  source?: string;
  message: string;
}

export const enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export interface CompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: string | { kind: string; value: string };
  insertText?: string;
  textEdit?: TextEdit;
  sortText?: string;
  filterText?: string;
}

export interface CompletionList {
  isIncomplete: boolean;
  items: CompletionItem[];
}

export interface Hover {
  contents: string | { kind: string; value: string };
  range?: Range;
}

export interface Location {
  uri: string;
  range: Range;
}

export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: number;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}

export interface WorkspaceEdit {
  changes?: Record<string, TextEdit[]>;
}

export interface CodeAction {
  title: string;
  kind?: string;
  diagnostics?: Diagnostic[];
  edit?: WorkspaceEdit;
}

export interface SemanticTokens {
  data: number[];
}

export interface FoldingRange {
  startLine: number;
  startCharacter?: number;
  endLine: number;
  endCharacter?: number;
  kind?: string;
}

export type PrepareRenameResult =
  | Range
  | { range: Range; placeholder: string }
  | null;

/* ── Custom Extension Response Types ─────────────────────────────── */

export interface SerializedAstResponse {
  ast: SerializedStory | null;
  valid: boolean;
  errors: number;
}

export interface OpenProjectResponse {
  loadedFiles: number;
  diagnosticsSummary: { errors: number; warnings: number };
}

export interface FormatDocumentResponse {
  formattedText: string;
}

export interface AllFilesAstResponse {
  stories: Array<{ uri: string; ast: SerializedStory; valid: boolean }>;
}

/* ── Pending Request Tracking ────────────────────────────────────── */

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

/* ── Event Callbacks ─────────────────────────────────────────────── */

export interface LangiumClientCallbacks {
  onDiagnostics?: (uri: string, diagnostics: Diagnostic[]) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

/* ── LangiumClient ───────────────────────────────────────────────── */

export class LangiumClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private callbacks: LangiumClientCallbacks;
  private initialized = false;
  private documentVersions = new Map<string, number>();

  constructor(callbacks: LangiumClientCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /* ── Lifecycle ─────────────────────────────────────────────────── */

  /**
   * Attach to an existing Worker and perform LSP initialize/initialized handshake.
   *
   * IMPORTANT: The Worker must be created inline in the calling code using
   * `new Worker(new URL('...', import.meta.url), { type: 'module' })`
   * so that Vite can statically detect and bundle the worker entry point.
   */
  async start(worker: Worker): Promise<void> {
    if (this.worker) {
      throw new Error('LangiumClient already started');
    }

    this.worker = worker;
    this.worker.onmessage = (ev: MessageEvent) => this.handleMessage(ev.data);
    this.worker.onerror = (ev: ErrorEvent) => {
      this.callbacks.onError?.(new Error(`Worker error: ${ev.message}`));
    };

    // LSP initialize handshake
    await this.sendRequest('initialize', {
      capabilities: {
        textDocument: {
          semanticTokens: {
            dynamicRegistration: false,
            requests: { full: true },
            tokenTypes: [
              'class', 'comment', 'enum', 'enumMember', 'event',
              'function', 'interface', 'keyword', 'macro', 'method',
              'modifier', 'namespace', 'number', 'operator', 'parameter',
              'property', 'regexp', 'string', 'struct', 'type',
              'typeParameter', 'variable', 'decorator',
            ],
            tokenModifiers: [
              'abstract', 'async', 'declaration', 'defaultLibrary',
              'definition', 'deprecated', 'documentation', 'modification',
              'readonly', 'static',
            ],
            formats: ['relative'],
          },
          publishDiagnostics: {
            relatedInformation: true,
          },
          completion: {
            completionItem: {
              snippetSupport: false,
            },
          },
          hover: {
            contentFormat: ['plaintext'],
          },
          foldingRange: {
            lineFoldingOnly: true,
          },
          documentSymbol: {
            hierarchicalDocumentSymbolSupport: true,
          },
        },
      },
      processId: null,
      rootUri: null,
    });

    // Notify initialized
    this.sendNotification('initialized', {});
    this.initialized = true;
    this.callbacks.onReady?.();
  }

  /** Shut down the worker gracefully. */
  async stop(): Promise<void> {
    if (!this.worker) return;

    try {
      await this.sendRequest('shutdown', null);
      this.sendNotification('exit', null);
    } catch {
      // Worker may already be dead
    }

    this.worker.terminate();
    this.worker = null;
    this.initialized = false;
    this.pending.clear();
    this.documentVersions.clear();
  }

  get isReady(): boolean {
    return this.initialized && this.worker !== null;
  }

  /* ── Document Lifecycle ────────────────────────────────────────── */

  didOpen(uri: string, languageId: string, text: string): void {
    this.documentVersions.set(uri, 1);
    this.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId,
        version: 1,
        text,
      },
    });
  }

  didChange(uri: string, text: string): void {
    const version = (this.documentVersions.get(uri) ?? 0) + 1;
    this.documentVersions.set(uri, version);
    this.sendNotification('textDocument/didChange', {
      textDocument: { uri, version },
      contentChanges: [{ text }],
    });
  }

  didClose(uri: string): void {
    this.documentVersions.delete(uri);
    this.sendNotification('textDocument/didClose', {
      textDocument: { uri },
    });
  }

  /* ── Standard LSP Requests ─────────────────────────────────────── */

  async completion(
    uri: string,
    position: Position,
  ): Promise<CompletionList | CompletionItem[] | null> {
    return this.sendRequest('textDocument/completion', {
      textDocument: { uri },
      position,
    }) as Promise<CompletionList | CompletionItem[] | null>;
  }

  async hover(uri: string, position: Position): Promise<Hover | null> {
    return this.sendRequest('textDocument/hover', {
      textDocument: { uri },
      position,
    }) as Promise<Hover | null>;
  }

  async definition(uri: string, position: Position): Promise<Location | Location[] | null> {
    return this.sendRequest('textDocument/definition', {
      textDocument: { uri },
      position,
    }) as Promise<Location | Location[] | null>;
  }

  async references(uri: string, position: Position): Promise<Location[] | null> {
    return this.sendRequest('textDocument/references', {
      textDocument: { uri },
      position,
      context: { includeDeclaration: true },
    }) as Promise<Location[] | null>;
  }

  async rename(uri: string, position: Position, newName: string): Promise<WorkspaceEdit | null> {
    return this.sendRequest('textDocument/rename', {
      textDocument: { uri },
      position,
      newName,
    }) as Promise<WorkspaceEdit | null>;
  }

  async formatting(uri: string): Promise<TextEdit[] | null> {
    return this.sendRequest('textDocument/formatting', {
      textDocument: { uri },
      options: { tabSize: 2, insertSpaces: true },
    }) as Promise<TextEdit[] | null>;
  }

  async documentSymbol(uri: string): Promise<DocumentSymbol[] | null> {
    return this.sendRequest('textDocument/documentSymbol', {
      textDocument: { uri },
    }) as Promise<DocumentSymbol[] | null>;
  }

  async semanticTokensFull(uri: string): Promise<SemanticTokens | null> {
    return this.sendRequest('textDocument/semanticTokens/full', {
      textDocument: { uri },
    }) as Promise<SemanticTokens | null>;
  }

  async codeAction(
    uri: string,
    range: Range,
    diagnostics: Diagnostic[],
  ): Promise<CodeAction[] | null> {
    return this.sendRequest('textDocument/codeAction', {
      textDocument: { uri },
      range,
      context: { diagnostics },
    }) as Promise<CodeAction[] | null>;
  }

  async foldingRange(uri: string): Promise<FoldingRange[] | null> {
    return this.sendRequest('textDocument/foldingRange', {
      textDocument: { uri },
    }) as Promise<FoldingRange[] | null>;
  }

  async prepareRename(
    uri: string,
    position: Position,
  ): Promise<PrepareRenameResult> {
    return this.sendRequest('textDocument/prepareRename', {
      textDocument: { uri },
      position,
    }) as Promise<PrepareRenameResult>;
  }

  /* ── Custom ActOne Extensions ──────────────────────────────────── */

  async getSerializedAst(uri: string): Promise<SerializedAstResponse> {
    return this.sendRequest('actone/getSerializedAst', {
      uri,
    }) as Promise<SerializedAstResponse>;
  }

  async getAstForAllFiles(projectId: string): Promise<AllFilesAstResponse> {
    return this.sendRequest('actone/getAstForAllFiles', {
      projectId,
    }) as Promise<AllFilesAstResponse>;
  }

  async openProject(params: {
    projectId: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    authToken: string;
    compositionMode: string;
    fileOrder: Array<{ uri: string; priority: number }>;
  }): Promise<OpenProjectResponse> {
    return this.sendRequest(
      'actone/openProject',
      params,
    ) as Promise<OpenProjectResponse>;
  }

  updateFile(filePath: string, content: string): void {
    this.sendNotification('actone/updateFile', { filePath, content });
  }

  async formatDocument(uri: string): Promise<FormatDocumentResponse> {
    return this.sendRequest('actone/formatDocument', {
      uri,
    }) as Promise<FormatDocumentResponse>;
  }

  /* ── JSON-RPC Transport ────────────────────────────────────────── */

  private sendRequest(method: string, params: unknown): Promise<unknown> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not started'));
    }

    const id = this.nextId++;
    const message: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params: params ?? undefined,
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage(message);
    });
  }

  private sendNotification(method: string, params: unknown): void {
    if (!this.worker) return;

    const message: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params: params ?? undefined,
    };

    this.worker.postMessage(message);
  }

  private handleMessage(data: unknown): void {
    const message = data as JsonRpcMessage;

    // Response to a pending request
    if ('id' in message && message.id !== undefined) {
      const pending = this.pending.get(message.id);
      if (pending) {
        this.pending.delete(message.id);
        const response = message as JsonRpcResponse;
        if (response.error) {
          pending.reject(
            new Error(`LSP error [${response.error.code}]: ${response.error.message}`),
          );
        } else {
          pending.resolve(response.result);
        }
      }
      return;
    }

    // Server-initiated notification
    if ('method' in message) {
      this.handleNotification(message as JsonRpcNotification);
    }
  }

  private handleNotification(notification: JsonRpcNotification): void {
    switch (notification.method) {
      case 'textDocument/publishDiagnostics': {
        const params = notification.params as {
          uri: string;
          diagnostics: Diagnostic[];
        };
        this.callbacks.onDiagnostics?.(params.uri, params.diagnostics);
        break;
      }
      default:
        break;
    }
  }
}
