import type { Connection } from 'vscode-languageserver';
import type { LangiumSharedServices } from 'langium/lsp';
import { URI } from 'langium';
import type { ActOneServices } from '../services/actone-module.js';
import { isDocument } from '../generated/ast.js';
import { ActOneScopeProvider, type CompositionMode } from '../services/actone-scope.js';
import { serializeDocument } from '../serializer/ast-serializer.js';
import type { SerializedStoryElement } from '@actone/shared';

function getScopeProvider(services: ActOneServices): ActOneScopeProvider | null {
  const sp = services.references.ScopeProvider;
  if (sp instanceof ActOneScopeProvider) return sp;
  return null;
}

export function registerActOneHandlers(
  connection: Connection,
  shared: LangiumSharedServices,
  language: ActOneServices,
): void {
  /* ── Workspace management ──────────────────────────────────────── */

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
      const scopeProvider = getScopeProvider(language);
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
          const filePath = URI.parse(entry.uri).path.replace(/^\//, '');

          const supabaseUrl = `${params.supabaseUrl}/rest/v1/project_files?select=content&file_path=eq.${encodeURIComponent(filePath)}&project_id=eq.${params.projectId}`;
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

          shared.workspace.LangiumDocuments.createDocument(docUri, content);
          loadedFiles++;
        } catch {
          // Skip files that fail to load
        }
      }

      // Trigger a full workspace rebuild using update()
      const allUris = Array.from(shared.workspace.LangiumDocuments.all).map(d => d.uri);
      console.log('[Worker] openProject: rebuilding', allUris.length, 'documents via update()');
      await shared.workspace.DocumentBuilder.update(allUris, []);

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
        shared.workspace.LangiumDocuments.deleteDocument(docUri);
        shared.workspace.LangiumDocuments.createDocument(docUri, params.content);
      } else {
        shared.workspace.LangiumDocuments.createDocument(docUri, params.content);
      }

      const allUris = Array.from(shared.workspace.LangiumDocuments.all).map(d => d.uri);
      await shared.workspace.DocumentBuilder.update(allUris, []);
    },
  );

  /* actone/removeFile — Remove a file from the workspace */
  connection.onNotification(
    'actone/removeFile',
    async (params: { filePath: string }) => {
      const docUri = URI.parse(params.filePath);
      const existingDoc = shared.workspace.LangiumDocuments.getDocument(docUri);
      if (existingDoc) {
        await shared.workspace.DocumentBuilder.update([], [docUri]);
      }
    },
  );

  /* ── AST serialization (uses local 545-line domain serializer) ── */

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
    let ast = null;
    try {
      ast = isDocument(root) ? serializeDocument(root) : null;
    } catch {
      // Partial AST from error recovery
    }
    return { ast, valid: errors === 0, errors };
  });

  /* T056c: actone/getAstForAllFiles — Get per-file AST array */
  connection.onRequest(
    'actone/getAstForAllFiles',
    async (_params: { projectId: string }) => {
      const stories: Array<{ uri: string; ast: ReturnType<typeof serializeDocument> | null; valid: boolean }> = [];

      for (const doc of shared.workspace.LangiumDocuments.all) {
        const diagnostics = doc.diagnostics ?? [];
        const errors = diagnostics.filter((d) => d.severity === 1).length;
        const root = doc.parseResult.value;
        let ast = null;
        try {
          ast = isDocument(root) ? serializeDocument(root) : null;
        } catch {
          // Partial AST from error recovery
        }
        stories.push({
          uri: doc.uri.toString(),
          ast,
          valid: errors === 0,
        });
      }

      return { stories };
    },
  );

  /* actone/getMergedAst — Get a single consolidated AST across all workspace files */
  connection.onRequest('actone/getMergedAst', async () => {
    let storyName = '';
    let totalErrors = 0;
    let allValid = true;
    const mergedElements: SerializedStoryElement[] = [];

    for (const doc of shared.workspace.LangiumDocuments.all) {
      const diagnostics = doc.diagnostics ?? [];
      const errors = diagnostics.filter((d) => d.severity === 1).length;
      if (errors > 0) {
        allValid = false;
        totalErrors += errors;
      }

      const root = doc.parseResult.value;
      if (!isDocument(root)) continue;

      try {
        const serialized = serializeDocument(root);
        mergedElements.push(...serialized.elements);

        if (serialized.name && !storyName) {
          storyName = serialized.name;
        }
      } catch {
        // Partial AST from error recovery — skip this document
      }
    }

    return {
      ast: mergedElements.length > 0 || storyName
        ? { name: storyName, elements: mergedElements }
        : null,
      valid: allValid,
      errors: totalErrors,
    };
  });

  /* ── Formatting ────────────────────────────────────────────────── */

  /* actone/formatDocument — Apply Langium formatter, return full text */
  connection.onRequest(
    'actone/formatDocument',
    async (params: { uri: string }) => {
      const docUri = URI.parse(params.uri);
      const document = shared.workspace.LangiumDocuments.getDocument(docUri);

      if (!document) {
        return { formattedText: '' };
      }

      const formatter = language.lsp.Formatter;
      if (!formatter) {
        return { formattedText: document.textDocument.getText() };
      }

      const edits = await formatter.formatDocument(document, {
        options: { tabSize: 2, insertSpaces: true },
        textDocument: { uri: params.uri },
      });

      let text = document.textDocument.getText();
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
}
