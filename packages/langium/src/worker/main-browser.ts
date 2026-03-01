import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
} from 'vscode-languageserver/browser.js';
import { startLanguageServer } from 'langium/lsp';
import { EmptyFileSystem, URI } from 'langium';
import { createActOneServices } from '../services/actone-module.js';
import { isStory } from '../generated/ast.js';
import { ActOneScopeProvider, type CompositionMode } from '../services/actone-scope.js';
import { serializeStory } from '../serializer/ast-serializer.js';

// Cast self for the web worker context — this file is only loaded as a Worker
const workerSelf = self as unknown as {
  postMessage: (msg: unknown) => void;
  onmessage: ((ev: MessageEvent) => void) | null;
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
};

/* ── Establish LSP connection over postMessage ───────────────────── */

const messageReader = new BrowserMessageReader(workerSelf as any);
const messageWriter = new BrowserMessageWriter(workerSelf as any);
const connection = createConnection(messageReader, messageWriter);

/* ── Create language services ────────────────────────────────────── */

const { shared, ActOne } = createActOneServices({
  ...EmptyFileSystem,
  connection,
});

/* ── Start standard LSP server ───────────────────────────────────── */

startLanguageServer(shared);

/* ── Debug: verify SemanticTokenProvider registration ──────────────── */
console.log('[Worker] SemanticTokenProvider registered:', !!ActOne.lsp?.SemanticTokenProvider);
console.log('[Worker] ServiceRegistry languages:', shared.ServiceRegistry.all.map(s => s.LanguageMetaData?.languageId).join(', '));

/* ── Helper: get scope provider for composition config ───────────── */

function getScopeProvider(): ActOneScopeProvider | null {
  const sp = ActOne.references.ScopeProvider;
  if (sp instanceof ActOneScopeProvider) return sp;
  return null;
}

/* ── Custom extension handlers ───────────────────────────────────── */

/* T056: actone/openProject — Load all project files into workspace */
connection.onRequest(
  'actone/openProject',
  async (params: {
    projectId: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    authToken: string;
    compositionMode: string;
    fileOrder: Array<{ uri: string; priority: number }>;
  }) => {
    // Configure composition mode on the scope provider
    const scopeProvider = getScopeProvider();
    if (scopeProvider) {
      scopeProvider.compositionMode = params.compositionMode as CompositionMode;
      scopeProvider.filePriorities.clear();
      for (const entry of params.fileOrder) {
        scopeProvider.filePriorities.set(entry.uri, entry.priority);
      }
    }

    // Load each file into the Langium workspace as a text document
    let loadedFiles = 0;
    for (const entry of params.fileOrder) {
      try {
        // Extract the file path from the URI (strip file:/// prefix)
        const filePath = URI.parse(entry.uri).path.replace(/^\//, '');

        // Fetch file content from Supabase
        const supabaseUrl = `${params.supabaseUrl}/rest/v1/source_files?select=content&file_path=eq.${encodeURIComponent(filePath)}&project_id=eq.${params.projectId}`;
        const response = await fetch(supabaseUrl, {
          headers: {
            apikey: params.supabaseAnonKey,
            Authorization: `Bearer ${params.authToken}`,
          },
        });
        if (!response.ok) continue;

        const rows = (await response.json()) as Array<{ content: string }>;
        if (!rows || rows.length === 0) continue;

        const content = rows[0]!.content;
        const docUri = URI.parse(entry.uri);

        // Create a text document in the workspace
        shared.workspace.LangiumDocuments.createDocument(docUri, content);
        loadedFiles++;
      } catch {
        // Skip files that fail to load
      }
    }

    // Build workspace (parse all documents, compute scopes)
    const allDocs = Array.from(shared.workspace.LangiumDocuments.all);
    console.log('[Worker] openProject: building', allDocs.length, 'documents:', allDocs.map(d => d.uri.toString()));
    await shared.workspace.DocumentBuilder.build(allDocs);

    // Log document states after build
    for (const doc of shared.workspace.LangiumDocuments.all) {
      console.log('[Worker] doc:', doc.uri.toString(), 'state:', doc.state, 'parseErrors:', doc.parseResult?.parserErrors?.length ?? '?', 'astType:', doc.parseResult?.value?.$type ?? 'null');
    }

    // Collect diagnostics summary
    let errors = 0;
    let warnings = 0;
    for (const doc of shared.workspace.LangiumDocuments.all) {
      for (const diag of doc.diagnostics ?? []) {
        if (diag.severity === 1) errors++;
        else if (diag.severity === 2) warnings++;
      }
    }

    return { loadedFiles, diagnosticsSummary: { errors, warnings } };
  },
);

/* T056b: actone/updateFile — Sync external file changes */
connection.onNotification(
  'actone/updateFile',
  async (params: { filePath: string; content: string }) => {
    const docUri = URI.parse(params.filePath);
    const existingDoc = shared.workspace.LangiumDocuments.getDocument(docUri);

    if (existingDoc) {
      // Update existing document
      shared.workspace.LangiumDocuments.invalidateDocument(docUri);
      shared.workspace.LangiumDocuments.createDocument(docUri, params.content);

      // Rebuild just this document
      const newDoc = shared.workspace.LangiumDocuments.getDocument(docUri);
      if (newDoc) {
        await shared.workspace.DocumentBuilder.build([newDoc]);
      }
    } else {
      // New file — add to workspace
      shared.workspace.LangiumDocuments.createDocument(docUri, params.content);
      const newDoc = shared.workspace.LangiumDocuments.getDocument(docUri);
      if (newDoc) {
        await shared.workspace.DocumentBuilder.build([newDoc]);
      }
    }
  },
);

/* actone/getSerializedAst — Get serialized AST for a single file */
connection.onRequest('actone/getSerializedAst', async (params: { uri: string }) => {
  const docUri = URI.parse(params.uri);
  const document = shared.workspace.LangiumDocuments.getDocument(docUri);

  if (!document) {
    return { ast: null, valid: false, errors: 1 };
  }

  const diagnostics = document.diagnostics ?? [];
  const errors = diagnostics.filter((d) => d.severity === 1).length;

  const root = document.parseResult.value;
  const ast = isStory(root) ? serializeStory(root) : null;
  return { ast, valid: errors === 0, errors };
});

/* T056c: actone/getAstForAllFiles — Get merged AST across all files */
connection.onRequest(
  'actone/getAstForAllFiles',
  async (_params: { projectId: string }) => {
    const stories: Array<{ uri: string; ast: ReturnType<typeof serializeStory> | null; valid: boolean }> = [];

    for (const doc of shared.workspace.LangiumDocuments.all) {
      const diagnostics = doc.diagnostics ?? [];
      const errors = diagnostics.filter((d) => d.severity === 1).length;
      const root = doc.parseResult.value;
      const ast = isStory(root) ? serializeStory(root) : null;
      stories.push({
        uri: doc.uri.toString(),
        ast,
        valid: errors === 0,
      });
    }

    return { stories };
  },
);

/* actone/formatDocument — Format a document and return full text */
connection.onRequest(
  'actone/formatDocument',
  async (params: { uri: string }) => {
    const docUri = URI.parse(params.uri);
    const document = shared.workspace.LangiumDocuments.getDocument(docUri);

    if (!document) {
      return { formattedText: '' };
    }

    // Use the Langium formatter
    const formatter = ActOne.lsp.Formatter;
    if (!formatter) {
      return { formattedText: document.textDocument.getText() };
    }

    const edits = await formatter.formatDocument(document, {
      options: { tabSize: 2, insertSpaces: true },
      textDocument: { uri: params.uri },
    });

    // Apply text edits to get formatted text
    let text = document.textDocument.getText();
    // Apply edits in reverse order to preserve positions
    const sortedEdits = [...edits].sort((a, b) => {
      const startDiff = b.range.start.line - a.range.start.line;
      if (startDiff !== 0) return startDiff;
      return b.range.start.character - a.range.start.character;
    });

    for (const edit of sortedEdits) {
      const startOffset = document.textDocument.offsetAt(edit.range.start);
      const endOffset = document.textDocument.offsetAt(edit.range.end);
      text = text.substring(0, startOffset) + edit.newText + text.substring(endOffset);
    }

    return { formattedText: text };
  },
);
