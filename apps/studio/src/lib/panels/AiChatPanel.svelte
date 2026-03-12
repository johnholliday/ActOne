<script lang="ts">
  /**
   * AI Chat panel: wraps sanyam-ai-chat ChatPanel with ActOne-specific
   * header, conversation management, streaming, and grammar context.
   */
  import type { ChatMessage, SlashCommand } from '@docugenix/sanyam-ai-chat';
  // @ts-expect-error — resolved via Vite alias in vite.config.ts (no TS exports map entry)
  import ChatPanel from '@sanyam-ai-chat/components/ChatPanel.svelte';
  import { backendStore } from '$lib/stores/backends.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import { predefinedPrompts, buildFullGrammarContext } from '$lib/ai/chat-prompts.js';
  import X from 'lucide-svelte/icons/x';
  import Plus from 'lucide-svelte/icons/plus';

  let conversationId = $state<string | null>(null);
  let messages = $state<ChatMessage[]>([]);
  let streamingContent = $state('');
  let streaming = $state(false);
  let abortController = $state<AbortController | null>(null);
  let slashCommands = $state<SlashCommand[]>([]);

  /** Grammar context derived from the merged AST. */
  const grammarContext = $derived(
    astStore.mergedAst ? buildFullGrammarContext(astStore.mergedAst) : undefined,
  );

  /* ── Fetch slash commands from server ──────────────────────────── */

  async function loadCommands(): Promise<void> {
    try {
      const res = await fetch('/api/ai-chat/commands');
      if (!res.ok) return;
      const { commands: data } = await res.json() as { commands: Array<{
        name: string;
        description: string;
        helpText?: string;
        category: string;
        requiresGrammar?: boolean;
        mode: string;
      }> };
      // Convert server command metadata into SlashCommand objects.
      // Server commands have mode 'server' — their execute sends content to AI.
      // Client commands have mode 'client' — their execute returns a local action.
      slashCommands = data.map((cmd) => ({
        name: cmd.name,
        description: cmd.description,
        helpText: cmd.helpText,
        category: cmd.category as SlashCommand['category'],
        requiresGrammar: cmd.requiresGrammar,
        mode: cmd.mode as SlashCommand['mode'],
        execute: (args) => {
          if (cmd.mode === 'server') {
            return { action: 'send' as const, content: `/${cmd.name} ${args.args}`.trim() };
          }
          // Client-side actions
          switch (cmd.name) {
            case 'clear': return { action: 'clear' as const };
            case 'new': return { action: 'new-conversation' as const };
            case 'retry': return { action: 'retry' as const };
            case 'suggest': return { action: 'show-prompts' as const };
            case 'help': return { action: 'show-help' as const, commands: [] };
            default: return { action: 'none' as const };
          }
        },
      }));
    } catch {
      // Commands are optional — degrade gracefully
    }
  }

  /* ── Conversation management ───────────────────────────────────── */

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;

    const projectId = projectStore.project?.id;
    const title = projectStore.project
      ? `Chat — ${projectStore.project.title}`
      : 'Chat';

    const res = await fetch('/api/ai-chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title }),
    });

    if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
    const conv = await res.json() as { id: string };
    conversationId = conv.id;
    return conv.id;
  }

  /* ── Send message + SSE streaming ──────────────────────────────── */

  async function handleSend(content: string): Promise<void> {
    if (!content.trim() || streaming) return;

    if (!backendStore.activeId) {
      await backendStore.refresh();
      if (!backendStore.activeId) {
        const now = new Date();
        messages = [
          ...messages,
          { id: crypto.randomUUID(), conversationId: '', role: 'user', content, createdAt: now },
          { id: crypto.randomUUID(), conversationId: '', role: 'assistant', content: 'No AI backend is available. Please configure an AI provider in settings.', createdAt: now },
        ];
        return;
      }
    }

    // Add user message
    messages = [...messages, {
      id: crypto.randomUUID(),
      conversationId: conversationId ?? '',
      role: 'user',
      content,
      createdAt: new Date(),
    }];

    streaming = true;
    streamingContent = '';
    const controller = new AbortController();
    abortController = controller;

    try {
      const convId = await ensureConversation();

      const response = await fetch(`/api/ai-chat/messages/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          backendId: backendStore.activeId,
          ...(grammarContext ? { grammarContext } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        streamingContent = '';
        messages = [...messages, {
          id: crypto.randomUUID(),
          conversationId: convId,
          role: 'assistant',
          content: `Error: ${response.status} ${response.statusText}`,
          createdAt: new Date(),
        }];
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        streamingContent = '';
        messages = [...messages, {
          id: crypto.randomUUID(),
          conversationId: convId,
          role: 'assistant',
          content: 'Error: No response body',
          createdAt: new Date(),
        }];
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let finalMessageId: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const block of lines) {
          const eventMatch = block.match(/^event: (\w+)\ndata: (.+)$/s);
          if (!eventMatch) continue;
          const [, event, dataStr] = eventMatch;
          const data = JSON.parse(dataStr!);

          switch (event) {
            case 'chunk':
              streamingContent += data.text;
              break;
            case 'done':
              finalMessageId = data.messageId;
              break;
            case 'error':
              streamingContent += `\n\n_Error: ${data.error}_`;
              break;
          }
        }
      }

      // Move streaming content into a finalized message
      if (streamingContent) {
        messages = [...messages, {
          id: finalMessageId ?? crypto.randomUUID(),
          conversationId: convId,
          role: 'assistant',
          content: streamingContent,
          createdAt: new Date(),
        }];
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        messages = [...messages, {
          id: crypto.randomUUID(),
          conversationId: conversationId ?? '',
          role: 'assistant',
          content: `Error: ${e instanceof Error ? e.message : 'Unknown error'}`,
          createdAt: new Date(),
        }];
      }
    } finally {
      streaming = false;
      streamingContent = '';
      abortController = null;
    }
  }

  function handleStop(): void {
    abortController?.abort();
  }

  async function handleNewConversation(): Promise<void> {
    if (conversationId && messages.length === 0) {
      await fetch(`/api/ai-chat/conversations/${conversationId}`, { method: 'DELETE' });
    }
    conversationId = null;
    messages = [];
    streamingContent = '';
  }

  function handleClear(): void {
    messages = [];
    streamingContent = '';
  }

  function handleRetry(): void {
    // Find the last user message and re-send it
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]!.role === 'user') {
        const content = messages[i]!.content;
        // Remove the last assistant response if present
        if (messages.length > i + 1) {
          messages = messages.slice(0, i);
        }
        void handleSend(content);
        return;
      }
    }
  }

  // Load commands and refresh backends on mount
  $effect(() => {
    if (backendStore.backends.length === 0) {
      void backendStore.refresh();
    }
    void loadCommands();
  });
</script>

<div class="actone-chat-wrapper">
  <!-- Header -->
  <div class="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
    <span class="text-xs font-semibold text-text-secondary">AI Chat</span>
    <div class="flex items-center gap-1">
      <span class="text-[10px] text-text-muted">
        {#if backendStore.activeBackend}
          {backendStore.activeBackend.name}
        {:else}
          No backend
        {/if}
      </span>
      {#if streaming}
        <button
          class="flex h-6 items-center rounded bg-red-600/80 px-1.5 text-[10px] text-white transition-colors hover:bg-red-600"
          onclick={handleStop}
          title="Stop generation"
        >
          Stop
        </button>
      {/if}
      <button
        class="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-raised/20 hover:text-text-primary"
        onclick={() => void handleNewConversation()}
        title="New conversation"
      >
        <Plus size={13} />
      </button>
      <button
        class="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-raised/20 hover:text-text-primary"
        onclick={() => uiStore.toggleAiChat()}
        title="Close AI Chat"
      >
        <X size={14} />
      </button>
    </div>
  </div>

  <!-- ChatPanel from sanyam-ai-chat -->
  <ChatPanel
    {messages}
    {streamingContent}
    isStreaming={streaming}
    onSend={handleSend}
    placeholder="Ask about your story… or type / for commands"
    commands={slashCommands}
    predefinedPrompts={predefinedPrompts}
    grammarContext={grammarContext}
    conversationId={conversationId ?? undefined}
    onNewConversation={handleNewConversation}
    onClear={handleClear}
    onRetry={handleRetry}
    statusText={!backendStore.activeId ? 'No AI backend configured' : undefined}
    statusHint="Type / for commands"
  />
</div>

<style>
  .actone-chat-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;

    /* Map sanyam-ai-chat CSS custom properties to ActOne theme */
    --color-surface: var(--color-surface-850);
    --color-surface-alt: var(--color-surface-800);
    --color-border: var(--color-border);
    --color-text: var(--color-text-primary);
    --color-text-muted: var(--color-text-muted);
    --color-primary: var(--color-accent);
    --color-on-primary: #fff;
  }</style>
