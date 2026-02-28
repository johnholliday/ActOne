<script lang="ts">
  import { onMount } from 'svelte';
  import { EditorView, keymap, lineNumbers, drawSelection } from '@codemirror/view';
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

  /** T014: Worker error state for error banner display */
  let workerError = $state<string | null>(null);

  /** Word wrap compartment for dynamic toggling */
  const wordWrapCompartment = new Compartment();

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
        console.log('[EditorPane] onReady fired, uri:', uri, 'content length:', initialContent.length);
        workerError = null;
        // Inform the worker that we have a document open
        langiumClient.didOpen(uri, 'actone', initialContent);

        // Initialize the Langium workspace with full project context
        console.log('[EditorPane] projectContext:', projectContext ? `projectId=${projectContext.projectId}, files=${projectContext.fileOrder.length}` : 'null');
        if (projectContext) {
          langiumClient.openProject(projectContext).then((result) => {
            console.log('[EditorPane] openProject succeeded:', result);
            // Refresh semantic tokens and folding ranges after workspace is built
            if (view) {
              console.log('[EditorPane] requesting semantic tokens + folding ranges');
              refreshSemanticTokens(langiumClient, uri, view);
              refreshFoldingRanges(langiumClient, uri, view);
            }
          }).catch((err) => {
            console.error('[EditorPane] openProject failed:', err);
            // Still attempt token refresh even if openProject fails
            if (view) {
              refreshSemanticTokens(langiumClient, uri, view);
              refreshFoldingRanges(langiumClient, uri, view);
            }
          });
        } else {
          console.log('[EditorPane] no projectContext, delayed token refresh');
          // No project context — fall back to delayed token refresh
          setTimeout(() => {
            if (view) {
              console.log('[EditorPane] delayed: requesting semantic tokens + folding ranges');
              refreshSemanticTokens(langiumClient, uri, view);
              refreshFoldingRanges(langiumClient, uri, view);
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
      langiumExtension(langiumClient, uri),
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
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
        },
        '.cm-content': {
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          padding: '8px 0',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.3)',
        },
        '.cm-activeLineGutter': {
          color: 'rgba(255,255,255,0.7)',
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
      }),
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
    astStore.activeUri = uri;

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
        langiumClient.didClose(uri);
      }
      langiumClient.stop();
      view?.destroy();
      view = null;
      client = null;
    };
  });

  /* ── Diagnostic Handler ────────────────────────────────────────── */

  function handleDiagnostics(diagnosticUri: string, diagnostics: Diagnostic[]) {
    // Update AST store
    astStore.updateDiagnostics(diagnosticUri, diagnostics);

    // Update editor store diagnostic count
    editorStore.updateDiagnosticCount(astStore.totalDiagnostics);

    // Push to CodeMirror view (with code actions if client available)
    if (view && diagnosticUri === uri) {
      pushDiagnostics(view, diagnostics, client ?? undefined, uri);
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
      const result = await client.formatDocument(uri);
      if (result.formattedText) {
        setText(result.formattedText);
      }
    } catch (err) {
      console.error('[EditorPane] Format failed:', err);
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
