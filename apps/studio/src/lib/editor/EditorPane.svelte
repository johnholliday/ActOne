<script lang="ts">
  import { onMount } from 'svelte';
  import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
  import { EditorState, Compartment } from '@codemirror/state';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import {
    bracketMatching,
    indentOnInput,
    codeFolding,
    foldGutter,
    foldKeymap,
  } from '@codemirror/language';
  import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
  import { lintGutter } from '@codemirror/lint';
  import { LangiumClient } from './langium-client.js';
  import {
    langiumExtension,
    pushDiagnostics,
    refreshSemanticTokens,
    refreshFoldingRanges,
  } from './langium-extension.js';
  import { actoneKeywordHighlighter } from './actone-keywords.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import { parseAppearancePrefs } from '$lib/settings/appearance.js';
  import type { Diagnostic } from './langium-client.js';

  /* ── Props ──────────────────────────────────────────────────────── */

  interface ProjectContext {
    projectId: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    authToken: string;
    compositionMode: string;
    fileOrder: Array<{ uri: string; priority: number }>;
  }

  interface Props {
    /** The document URI for LSP protocol */
    uri?: string;
    /** Initial document content */
    initialContent?: string;
    /** Callback when content changes */
    onchange?: (content: string) => void;
    /** Project context for initializing the Langium workspace */
    projectContext?: ProjectContext | null;
  }

  let { uri = 'inmemory://model.actone', initialContent = '', onchange, projectContext = null }: Props = $props();

  /* ── Refs ───────────────────────────────────────────────────────── */

  let editorContainer: HTMLDivElement;
  let view: EditorView | null = null;
  let client: LangiumClient | null = null;

  /** Mutable URI that can be updated when switching documents.
   * Intentionally captures initial value — not reactive to prop changes. */
  // eslint-disable-next-line svelte/valid-compile
  let currentUri = $state(uri);

  /** T014: Worker error state for error banner display */
  let workerError = $state<string | null>(null);

  /** Word wrap compartment for dynamic toggling */
  const wordWrapCompartment = new Compartment();

  /** Theme compartment for switching between dark/light editor themes */
  const themeCompartment = new Compartment();

  const darkEditorTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
      backgroundColor: '#0D0D0D',
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: '8px 0',
      color: '#f8fafc',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.3)',
    },
    '.cm-activeLineGutter': {
      color: 'var(--color-accent, #f59e0b)',
      backgroundColor: 'transparent',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(99,102,241,0.3) !important',
    },
    '.cm-cursor': {
      borderLeftColor: '#818cf8',
    },
    /* Semantic token colors */
    '.cm-semantic-keyword': { color: '#c792ea' },
    '.cm-semantic-type': { color: '#ffcb6b' },
    '.cm-semantic-property': { color: '#82aaff' },
    '.cm-semantic-variable': { color: '#f07178' },
    '.cm-semantic-string': { color: '#c3e88d' },
    '.cm-semantic-number': { color: '#f78c6c' },
    '.cm-semantic-comment': { color: '#546e7a', fontStyle: 'italic' },
    '.cm-semantic-function': { color: '#82aaff' },
    '.cm-semantic-enum': { color: '#ffcb6b' },
    '.cm-semantic-enumMember': { color: '#89ddff' },
    /* Hover tooltip */
    '.cm-hover-tooltip': {
      backgroundColor: '#1e293b',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '6px',
      color: '#e2e8f0',
    },
    /* Lint tooltip */
    '.cm-tooltip-lint': {
      backgroundColor: '#1e1e2e',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '6px',
    },
    '.cm-diagnostic': {
      padding: '4px 8px',
      color: '#e2e8f0',
      fontSize: '12px',
    },
    '.cm-diagnostic-error': {
      borderLeft: '4px solid #f44747',
    },
    '.cm-diagnostic-warning': {
      borderLeft: '4px solid #ff9940',
    },
    '.cm-diagnostic-info': {
      borderLeft: '4px solid #6796e6',
    },
    '.cm-diagnostic-hint': {
      borderLeft: '4px solid #89ddff',
    },
    '.cm-diagnosticSource': {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '11px',
    },
    '.cm-diagnosticAction': {
      backgroundColor: '#333',
      color: '#e2e8f0',
      borderRadius: '3px',
      padding: '2px 6px',
      marginLeft: '8px',
      cursor: 'pointer',
      border: 'none',
    },
    /* Lint gutter */
    '.cm-lint-marker-error': { content: '"●"' },
    '.cm-lint-marker-warning': { content: '"●"' },
    /* Reference highlights */
    '.cm-reference-highlight': {
      backgroundColor: 'rgba(255,191,0,0.15)',
      borderBottom: '1px solid rgba(255,191,0,0.4)',
    },
    /* Fold gutter */
    '.cm-foldGutter .cm-gutterElement': {
      color: 'rgba(255,255,255,0.3)',
      padding: '0 2px',
    },
    /* Rename dialog */
    '.cm-rename-dialog': {
      backgroundColor: '#171717',
      borderBottom: '1px solid #252525',
      color: '#e2e8f0',
      padding: '4px 8px',
    },
    '.cm-rename-dialog input': {
      backgroundColor: '#0D0D0D',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '4px',
      color: '#e2e8f0',
      padding: '2px 6px',
    },
    '.cm-rename-dialog input:focus': {
      borderColor: 'rgba(245,158,11,0.6)',
    },
  });

  const lightEditorTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
      backgroundColor: '#ffffff',
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: '8px 0',
      color: '#1a1a2e',
    },
    '.cm-gutters': {
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #e2e5e9',
      color: '#9ca3af',
    },
    '.cm-activeLineGutter': {
      color: '#b45309',
      backgroundColor: 'transparent',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(59, 130, 246, 0.06)',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(99,102,241,0.2) !important',
    },
    '.cm-cursor': {
      borderLeftColor: '#6366f1',
    },
    /* Semantic token colors — light mode */
    '.cm-semantic-keyword': { color: '#7c3aed' },
    '.cm-semantic-type': { color: '#b45309' },
    '.cm-semantic-property': { color: '#2563eb' },
    '.cm-semantic-variable': { color: '#dc2626' },
    '.cm-semantic-string': { color: '#16a34a' },
    '.cm-semantic-number': { color: '#ea580c' },
    '.cm-semantic-comment': { color: '#9ca3af', fontStyle: 'italic' },
    '.cm-semantic-function': { color: '#2563eb' },
    '.cm-semantic-enum': { color: '#b45309' },
    '.cm-semantic-enumMember': { color: '#0891b2' },
    /* Hover tooltip */
    '.cm-hover-tooltip': {
      backgroundColor: '#ffffff',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      color: '#1a1a2e',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    /* Lint tooltip */
    '.cm-tooltip-lint': {
      backgroundColor: '#ffffff',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
    },
    '.cm-diagnostic': {
      padding: '4px 8px',
      color: '#1a1a2e',
      fontSize: '12px',
    },
    '.cm-diagnostic-error': {
      borderLeft: '4px solid #dc2626',
    },
    '.cm-diagnostic-warning': {
      borderLeft: '4px solid #d97706',
    },
    '.cm-diagnostic-info': {
      borderLeft: '4px solid #2563eb',
    },
    '.cm-diagnostic-hint': {
      borderLeft: '4px solid #0891b2',
    },
    '.cm-diagnosticSource': {
      color: '#9ca3af',
      fontSize: '11px',
    },
    '.cm-diagnosticAction': {
      backgroundColor: '#e9ecef',
      color: '#1a1a2e',
      borderRadius: '3px',
      padding: '2px 6px',
      marginLeft: '8px',
      cursor: 'pointer',
      border: 'none',
    },
    /* Lint gutter */
    '.cm-lint-marker-error': { content: '"●"' },
    '.cm-lint-marker-warning': { content: '"●"' },
    /* Reference highlights */
    '.cm-reference-highlight': {
      backgroundColor: 'rgba(180,83,9,0.1)',
      borderBottom: '1px solid rgba(180,83,9,0.3)',
    },
    /* Fold gutter */
    '.cm-foldGutter .cm-gutterElement': {
      color: '#9ca3af',
      padding: '0 2px',
    },
    /* Rename dialog */
    '.cm-rename-dialog': {
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #d1d5db',
      color: '#1a1a2e',
      padding: '4px 8px',
    },
    '.cm-rename-dialog input': {
      backgroundColor: '#ffffff',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      color: '#1a1a2e',
      padding: '2px 6px',
    },
    '.cm-rename-dialog input:focus': {
      borderColor: 'rgba(180,83,9,0.6)',
    },
  });

  /** Create a Langium worker using the inline pattern Vite can detect and bundle. */
  function createLangiumWorker(): Worker {
    console.log('[EditorPane] creating Langium worker');
    const w = new Worker(
      new URL('../worker/langium-worker.ts', import.meta.url),
      { type: 'module' },
    );
    console.log('[EditorPane] worker created successfully');
    return w;
  }

  /** T014: Retry starting the Langium worker */
  async function retryWorker() {
    workerError = null;
    if (!client) return;
    try {
      await client.start(createLangiumWorker());
    } catch (err) {
      workerError = err instanceof Error ? err.message : 'Worker failed to start';
    }
  }

  /* ── Worker + Editor Lifecycle ──────────────────────────────────── */

  onMount(() => {
    const langiumClient = new LangiumClient({
      onDiagnostics: handleDiagnostics,
      onError: (err) => {
        console.error('[LangiumClient]', err);
        workerError = err instanceof Error ? err.message : 'Language server error';
      },
      onReady: () => {
        console.log('[EditorPane] onReady fired, uri:', currentUri, 'content length:', initialContent.length);
        workerError = null;
        // Inform the worker that we have a document open
        langiumClient.didOpen(currentUri, 'actone', initialContent);

        // Initialize the Langium workspace with full project context
        console.log('[EditorPane] projectContext:', projectContext ? `projectId=${projectContext.projectId}, files=${projectContext.fileOrder.length}` : 'null');
        if (projectContext) {
          langiumClient.openProject(projectContext).then((result) => {
            console.log('[EditorPane] openProject succeeded:', result);
            // Populate merged AST immediately after workspace is built
            langiumClient.getMergedAst().then((response) => {
              astStore.updateMergedAst(response.ast, response.valid);
            }).catch(() => { /* silently ignore merge failures */ });
            // Refresh semantic tokens and folding ranges after workspace is built
            if (view) {
              console.log('[EditorPane] requesting semantic tokens + folding ranges');
              refreshSemanticTokens(langiumClient, currentUri, view);
              refreshFoldingRanges(langiumClient, currentUri, view);
            }
          }).catch((err) => {
            console.error('[EditorPane] openProject failed:', err);
            // Still attempt token refresh even if openProject fails
            if (view) {
              refreshSemanticTokens(langiumClient, currentUri, view);
              refreshFoldingRanges(langiumClient, currentUri, view);
            }
          });
        } else {
          console.log('[EditorPane] no projectContext, delayed token refresh');
          // No project context — fall back to delayed token refresh
          setTimeout(() => {
            if (view) {
              console.log('[EditorPane] delayed: requesting semantic tokens + folding ranges');
              refreshSemanticTokens(langiumClient, currentUri, view);
              refreshFoldingRanges(langiumClient, currentUri, view);
            }
          }, 300);
        }
      },
    });

    client = langiumClient;

    // Read initial word wrap preference
    const storedPrefs = parseAppearancePrefs(localStorage.getItem('actone:appearance'));

    // Create CodeMirror editor
    const extensions = [
      wordWrapCompartment.of(storedPrefs.wordWrap ? EditorView.lineWrapping : []),
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      history(),
      lintGutter(),
      codeFolding(),
      foldGutter(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap, ...foldKeymap]),
      actoneKeywordHighlighter,
      langiumExtension(langiumClient, () => currentUri),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const content = update.state.doc.toString();
          onchange?.(content);
        }
        // Track cursor position
        const { head } = update.state.selection.main;
        const line = update.state.doc.lineAt(head);
        editorStore.updateCursor({
          line: line.number,
          column: head - line.from + 1,
        });
      }),
      themeCompartment.of(uiStore.theme === 'light' ? lightEditorTheme : darkEditorTheme),
      // Dark base theme
      EditorView.baseTheme({
        '&.cm-focused': {
          outline: 'none',
        },
      }),
    ];

    view = new EditorView({
      state: EditorState.create({
        doc: initialContent,
        extensions,
      }),
      parent: editorContainer,
    });

    // Start the Langium worker — Worker created inline so Vite can detect and bundle it
    langiumClient.start(createLangiumWorker()).catch((err) => {
      console.error('[EditorPane] Failed to start Langium worker:', err);
      workerError = err instanceof Error ? err.message : 'Language server failed to start';
    });

    // Set active URI in AST store
    astStore.activeUri = currentUri;

    // Word wrap toggle listener
    function handleToggleWordWrap() {
      const prefs = parseAppearancePrefs(localStorage.getItem('actone:appearance'));
      const newValue = !prefs.wordWrap;
      localStorage.setItem('actone:appearance', JSON.stringify({ ...prefs, wordWrap: newValue }));
      setWordWrap(newValue);
      window.dispatchEvent(new CustomEvent('actone:word-wrap-changed', { detail: { wordWrap: newValue } }));
    }
    window.addEventListener('actone:toggle-word-wrap', handleToggleWordWrap);

    return () => {
      // Cleanup
      window.removeEventListener('actone:toggle-word-wrap', handleToggleWordWrap);
      if (langiumClient.isReady) {
        langiumClient.didClose(currentUri);
      }
      langiumClient.stop();
      view?.destroy();
      view = null;
      client = null;
    };
  });

  /* ── React to theme changes ──────────────────────────────────── */

  $effect(() => {
    const currentTheme = uiStore.theme;
    if (view) {
      view.dispatch({
        effects: themeCompartment.reconfigure(
          currentTheme === 'light' ? lightEditorTheme : darkEditorTheme,
        ),
      });
    }
  });

  /* ── Diagnostic Handler ────────────────────────────────────────── */

  function handleDiagnostics(diagnosticUri: string, diagnostics: Diagnostic[]) {
    // Update AST store
    astStore.updateDiagnostics(diagnosticUri, diagnostics);

    // Update editor store diagnostic count
    editorStore.updateDiagnosticCount(astStore.totalDiagnostics);

    // Push to CodeMirror view (with code actions if client available)
    if (view && diagnosticUri === currentUri) {
      pushDiagnostics(view, diagnostics, client ?? undefined, currentUri);
    }

    // Notify parent that the worker has processed this document
    window.dispatchEvent(new CustomEvent('actone:diagnostics-ready', {
      detail: { uri: diagnosticUri },
    }));

    // Request serialized AST after diagnostics arrive
    if (client?.isReady) {
      client.getSerializedAst(diagnosticUri).then((response) => {
        astStore.updateAst(diagnosticUri, response.ast, response.valid, response.errors);
      }).catch(() => { /* silently ignore serialization failures */ });

      // Also refresh the merged AST (cross-file consolidated view)
      client.getMergedAst().then((response) => {
        astStore.updateMergedAst(response.ast, response.valid);
      }).catch(() => { /* silently ignore merge failures */ });
    }
  }

  /* ── Public API ────────────────────────────────────────────────── */

  /** Set word wrap on/off dynamically */
  export function setWordWrap(enabled: boolean): void {
    if (!view) return;
    view.dispatch({
      effects: wordWrapCompartment.reconfigure(enabled ? EditorView.lineWrapping : []),
    });
  }

  /** Get the current document text */
  export function getText(): string {
    return view?.state.doc.toString() ?? '';
  }

  /** Replace the entire document text */
  export function setText(text: string): void {
    if (!view) return;
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: text,
      },
    });
  }

  /** Request document formatting from the Langium worker */
  export async function format(): Promise<void> {
    if (!client?.isReady || !view) return;

    try {
      const result = await client.formatDocument(currentUri);
      if (result.formattedText) {
        setText(result.formattedText);
      }
    } catch (err) {
      console.error('[EditorPane] Format failed:', err);
    }
  }

  /** Move cursor to an LSP position (0-based line/character) and scroll to center */
  export function revealPosition(line: number, character: number): void {
    if (!view) return;
    const cmLine = view.state.doc.line(line + 1);
    const offset = cmLine.from + character;
    view.dispatch({
      selection: { anchor: offset },
      scrollIntoView: true,
    });
    view.focus();
    // After the default scroll-into-view, adjust to center the line vertically
    requestAnimationFrame(() => {
      if (!view) return;
      const coords = view.coordsAtPos(offset);
      if (!coords) return;
      const editorRect = view.dom.getBoundingClientRect();
      const lineY = coords.top;
      const centerOffset = lineY - editorRect.top - editorRect.height / 2;
      view.scrollDOM.scrollTop += centerOffset;
    });
  }

  /** Switch to a different document without recreating the editor */
  export function setDocument(newUri: string, content: string): void {
    if (!view || !client) return;

    // Close old document in language server
    if (client.isReady) {
      client.didClose(currentUri);
    }

    // Replace CodeMirror content
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: content,
      },
    });

    // Update mutable URI
    currentUri = newUri;
    astStore.activeUri = newUri;

    // Open new document in language server
    if (client.isReady) {
      client.didOpen(newUri, 'actone', content);

      // Refresh semantic tokens and folding ranges for the new document
      refreshSemanticTokens(client, newUri, view);
      refreshFoldingRanges(client, newUri, view);
    }
  }

  /** Get the LangiumClient instance for advanced operations */
  export function getClient(): LangiumClient | null {
    return client;
  }
</script>

{#if workerError}
  <div class="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
    <span>Language server error: {workerError}</span>
    <button
      class="ml-auto rounded bg-red-500/20 px-2 py-0.5 text-red-300 hover:bg-red-500/30"
      onclick={() => void retryWorker()}
    >
      Retry
    </button>
  </div>
{/if}
<div
  bind:this={editorContainer}
  class="h-full w-full overflow-hidden bg-surface-900"
  role="textbox"
  tabindex="0"
></div>
