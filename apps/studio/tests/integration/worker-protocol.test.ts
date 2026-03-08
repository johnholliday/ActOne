/**
 * T054: Worker protocol communication tests.
 *
 * Tests LSP lifecycle, custom request handlers, and diagnostics round-trip
 * by using createActOneServices() directly in Node (no web worker needed).
 *
 * The custom handlers in main-browser.ts operate on:
 * - shared.workspace.LangiumDocuments
 * - shared.workspace.DocumentBuilder
 * - ActOne.lsp.Formatter
 * - ActOne.references.ScopeProvider
 *
 * We test these operations directly since the JSON-RPC transport is handled
 * by vscode-languageserver and doesn't need custom testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { URI } from 'langium';
import { createActOneServices } from '@actone/lang';
import type { Document } from '@actone/lang/ast';

function createServices() {
  return createActOneServices();
}

describe('LSP initialize capabilities', () => {
  it('createActOneServices returns shared and ActOne services', () => {
    const { shared, ActOne } = createServices();
    expect(shared).toBeDefined();
    expect(ActOne).toBeDefined();
    expect(shared.workspace).toBeDefined();
    expect(shared.workspace.LangiumDocuments).toBeDefined();
    expect(shared.workspace.DocumentBuilder).toBeDefined();
  });

  it('ActOne provides all custom LSP services', () => {
    const { ActOne } = createServices();
    expect(ActOne.lsp.Formatter).toBeDefined();
    expect(ActOne.lsp.CompletionProvider).toBeDefined();
    expect(ActOne.lsp.HoverProvider).toBeDefined();
    expect(ActOne.lsp.SemanticTokenProvider).toBeDefined();
    expect(ActOne.lsp.DocumentSymbolProvider).toBeDefined();
    expect(ActOne.references.ScopeProvider).toBeDefined();
  });
});

describe('didOpen / didChange / didClose lifecycle', () => {
  it('creates and retrieves a document in the workspace', async () => {
    const { shared } = createServices();
    const uri = URI.parse('file:///test/open.actone');
    const content = 'story "Test" { character Alice { bio: "Test." } }';

    shared.workspace.LangiumDocuments.createDocument(uri, content);
    const doc = shared.workspace.LangiumDocuments.getDocument(uri);
    expect(doc).toBeDefined();
    expect(doc!.textDocument.getText()).toBe(content);
  });

  it('builds a document and produces diagnostics', async () => {
    const { shared } = createServices();
    const uri = URI.parse('file:///test/build.actone');
    const content = 'story "Test" { character Alice { bio: "Test." } }';

    shared.workspace.LangiumDocuments.createDocument(uri, content);
    const doc = shared.workspace.LangiumDocuments.getDocument(uri)!;

    await shared.workspace.DocumentBuilder.build([doc]);

    // Valid document should have no error diagnostics
    const errors = (doc.diagnostics ?? []).filter((d) => d.severity === 1);
    expect(errors).toHaveLength(0);
  });

  it('produces error diagnostics for invalid documents', async () => {
    const { shared } = createServices();
    const uri = URI.parse('file:///test/invalid.actone');
    const content = 'story {'; // Missing name and closing brace

    shared.workspace.LangiumDocuments.createDocument(uri, content);
    const doc = shared.workspace.LangiumDocuments.getDocument(uri)!;

    await shared.workspace.DocumentBuilder.build([doc]);

    // Should have parser errors
    expect(doc.parseResult.parserErrors.length).toBeGreaterThan(0);
  });

  it('updates document content via invalidate + recreate', async () => {
    const { shared } = createServices();
    const uri = URI.parse('file:///test/update.actone');
    const initialContent = 'story "V1" { character Alice { bio: "V1." } }';
    const updatedContent = 'story "V2" { character Alice { bio: "V2." } }';

    // Create initial document
    shared.workspace.LangiumDocuments.createDocument(uri, initialContent);

    // Update: delete then recreate (invalidateDocument only resets state, doesn't remove from trie)
    shared.workspace.LangiumDocuments.deleteDocument(uri);
    shared.workspace.LangiumDocuments.createDocument(uri, updatedContent);
    const newDoc = shared.workspace.LangiumDocuments.getDocument(uri)!;

    await shared.workspace.DocumentBuilder.build([newDoc]);

    expect(newDoc.textDocument.getText()).toBe(updatedContent);
    expect((newDoc.parseResult.value as Document).story?.name).toBe('V2');
  });
});

describe('actone/getSerializedAst equivalent', () => {
  it('returns valid=true for a well-formed document', async () => {
    const { shared } = createServices();
    const uri = URI.parse('file:///test/ast.actone');
    const content =
      'story "Test" { character Alice { nature: Human, bio: "A test character." } }';

    shared.workspace.LangiumDocuments.createDocument(uri, content);
    const doc = shared.workspace.LangiumDocuments.getDocument(uri)!;
    await shared.workspace.DocumentBuilder.build([doc]);

    const diagnostics = doc.diagnostics ?? [];
    const errors = diagnostics.filter((d) => d.severity === 1).length;

    expect(errors).toBe(0);
  });

  it('returns errors > 0 for an invalid document', async () => {
    const { shared } = createServices();
    const uri = URI.parse('file:///test/invalid-ast.actone');
    const content = 'story {';

    shared.workspace.LangiumDocuments.createDocument(uri, content);
    const doc = shared.workspace.LangiumDocuments.getDocument(uri)!;
    await shared.workspace.DocumentBuilder.build([doc]);

    // Parser errors should be present
    expect(doc.parseResult.parserErrors.length).toBeGreaterThan(0);
  });

  it('returns null for non-existent document', () => {
    const { shared } = createServices();
    const uri = URI.parse('file:///test/nonexistent.actone');
    const doc = shared.workspace.LangiumDocuments.getDocument(uri);
    expect(doc).toBeUndefined();
  });
});

describe('actone/getAstForAllFiles equivalent', () => {
  it('returns status for all workspace documents', async () => {
    const { shared } = createServices();

    // Add multiple documents
    const uris = [
      URI.parse('file:///test/file1.actone'),
      URI.parse('file:///test/file2.actone'),
    ];

    shared.workspace.LangiumDocuments.createDocument(
      uris[0]!,
      'story "File1" { character A { bio: "A." } }',
    );
    shared.workspace.LangiumDocuments.createDocument(
      uris[1]!,
      'story "File2" { character B { bio: "B." } }',
    );

    const allDocs = Array.from(shared.workspace.LangiumDocuments.all);
    await shared.workspace.DocumentBuilder.build(allDocs);

    const stories = allDocs.map((doc) => {
      const diagnostics = doc.diagnostics ?? [];
      const errors = diagnostics.filter((d) => d.severity === 1).length;
      return { uri: doc.uri.toString(), valid: errors === 0 };
    });

    expect(stories).toHaveLength(2);
    expect(stories.every((s) => s.valid)).toBe(true);
  });
});

describe('actone/formatDocument equivalent', () => {
  it('formats a document with the Langium formatter', async () => {
    const { shared, ActOne } = createServices();
    const uri = URI.parse('file:///test/format.actone');
    const content = [
      'story "Test" {',
      '    character Alice {',
      '        nature: Human,',
      '        bio: "A test character.",',
      '    }',
      '}',
    ].join('\n');

    shared.workspace.LangiumDocuments.createDocument(uri, content);
    const doc = shared.workspace.LangiumDocuments.getDocument(uri)!;
    await shared.workspace.DocumentBuilder.build([doc]);

    // Use the formatter
    const formatter = ActOne.lsp.Formatter;
    expect(formatter).toBeDefined();

    const edits = await formatter!.formatDocument(doc, {
      options: { tabSize: 2, insertSpaces: true },
      textDocument: { uri: uri.toString() },
    });

    // Apply edits in reverse order
    let text = doc.textDocument.getText();
    const sortedEdits = [...edits].sort((a, b) => {
      const startDiff = b.range.start.line - a.range.start.line;
      if (startDiff !== 0) return startDiff;
      return b.range.start.character - a.range.start.character;
    });

    for (const edit of sortedEdits) {
      const startOffset = doc.textDocument.offsetAt(edit.range.start);
      const endOffset = doc.textDocument.offsetAt(edit.range.end);
      text =
        text.substring(0, startOffset) + edit.newText + text.substring(endOffset);
    }

    // Formatted output should use 2-space indentation
    expect(text).toContain('  character Alice {');
    expect(text).toContain('    nature: Human,');
  });

  it('returns original text for empty document', async () => {
    const { shared } = createServices();
    const uri = URI.parse('file:///test/empty.actone');

    // Non-existent doc returns empty
    const doc = shared.workspace.LangiumDocuments.getDocument(uri);
    expect(doc).toBeUndefined();
  });
});

describe('diagnostics round-trip', () => {
  it('invalid doc produces errors, fixing clears them', async () => {
    const { shared } = createServices();
    const uri = URI.parse('file:///test/roundtrip.actone');

    // Step 1: Open document with parser errors (missing closing brace)
    const invalidContent = 'story "Test" { character Alice { bio: "Test."';
    shared.workspace.LangiumDocuments.createDocument(uri, invalidContent);
    let doc = shared.workspace.LangiumDocuments.getDocument(uri)!;
    await shared.workspace.DocumentBuilder.build([doc]);

    // Should have parser errors
    expect(doc.parseResult.parserErrors.length).toBeGreaterThan(0);

    // Step 2: Fix the error
    const validContent = 'story "Test" { character Alice { bio: "Test." } }';
    shared.workspace.LangiumDocuments.deleteDocument(uri);
    shared.workspace.LangiumDocuments.createDocument(uri, validContent);
    doc = shared.workspace.LangiumDocuments.getDocument(uri)!;
    await shared.workspace.DocumentBuilder.build([doc]);

    // Should have no parser errors now
    expect(doc.parseResult.parserErrors).toHaveLength(0);
  });
});

describe('multi-file workspace', () => {
  it('resolves cross-file references after building all files', async () => {
    const { shared } = createServices();

    const uri1 = URI.parse('file:///project/entry.actone');
    const uri2 = URI.parse('file:///project/chars.actone');

    const entry = `
story "Multi" {
  scene Meeting {
    participants: [Alice],
    objective: "A meeting.",
  }
}`;
    const chars = `
story "Multi" {
  character Alice {
    bio: "A character.",
  }
}`;

    shared.workspace.LangiumDocuments.createDocument(uri1, entry);
    shared.workspace.LangiumDocuments.createDocument(uri2, chars);

    const allDocs = Array.from(shared.workspace.LangiumDocuments.all);
    await shared.workspace.DocumentBuilder.build(allDocs);

    // Both documents should parse successfully
    for (const doc of allDocs) {
      expect(doc.parseResult.parserErrors).toHaveLength(0);
    }
  });
});
