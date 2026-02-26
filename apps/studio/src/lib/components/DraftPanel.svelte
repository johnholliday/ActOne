<script lang="ts">
  /**
   * T097: Draft Panel.
   *
   * Displays streaming prose, per-paragraph review controls
   * (Accept/Reject/Regenerate), version history, and status indicators.
   */
  import { generationStore } from '$lib/stores/generation.svelte.js';
  import {
    splitIntoParagraphs,
    getLatestVersions,
    updateDraftStatus,
    type DraftVersion,
    type DraftStatus,
  } from '$lib/ai/draft-manager.js';

  const streamedParagraphs = $derived(
    generationStore.isStreaming || generationStore.isComplete
      ? splitIntoParagraphs(generationStore.streamedText)
      : [],
  );

  const latestDrafts = $derived(getLatestVersions(generationStore.drafts));

  const statusColors: Record<DraftStatus, string> = {
    pending: '#f59e0b',
    accepted: '#10b981',
    rejected: '#ef4444',
    editing: '#3b82f6',
  };

  async function handleStatusChange(draft: DraftVersion, status: DraftStatus) {
    await updateDraftStatus(draft.id, status);
    // Refresh drafts
    const updated = generationStore.drafts.map((d) =>
      d.id === draft.id ? { ...d, status } : d,
    );
    generationStore.setDrafts(updated);
  }
</script>

<div class="draft-panel">
  <h3>Draft</h3>

  {#if generationStore.isStreaming}
    <div class="streaming-indicator">Generating...</div>
  {/if}

  {#if streamedParagraphs.length > 0}
    <div class="streamed-content">
      {#each streamedParagraphs as paragraph, i}
        <div class="paragraph">
          <p>{paragraph}</p>
        </div>
      {/each}
    </div>
  {/if}

  {#if generationStore.drafts.length > 0}
    <div class="draft-list">
      {#each Array.from(latestDrafts.entries()).sort((a, b) => a[0] - b[0]) as [index, draft]}
        <div class="draft-item">
          <div class="draft-header">
            <span class="para-index">P{index + 1}</span>
            <span
              class="status-badge"
              style="background: {statusColors[draft.status]}33; color: {statusColors[draft.status]};"
            >
              {draft.status}
            </span>
          </div>
          <p class="draft-content">{draft.content}</p>
          <div class="draft-controls">
            {#if draft.status !== 'accepted'}
              <button
                class="ctrl-btn accept"
                onclick={() => handleStatusChange(draft, 'accepted')}
              >
                Accept
              </button>
            {/if}
            {#if draft.status !== 'rejected'}
              <button
                class="ctrl-btn reject"
                onclick={() => handleStatusChange(draft, 'rejected')}
              >
                Reject
              </button>
            {/if}
            <button
              class="ctrl-btn regen"
              onclick={() => {
                generationStore.selectedScene = draft.sceneName;
              }}
            >
              Regenerate
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else if !generationStore.isStreaming && streamedParagraphs.length === 0}
    <div class="empty-state">
      No drafts yet. Select a scene and generate prose.
    </div>
  {/if}
</div>

<style>
  .draft-panel {
    padding: 12px;
    background: #1e293b;
    border-radius: 8px;
    font-size: 13px;
    color: #e2e8f0;
    overflow-y: auto;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
  }

  .streaming-indicator {
    padding: 4px 8px;
    background: #3b82f633;
    border-radius: 4px;
    font-size: 11px;
    color: #3b82f6;
    margin-bottom: 8px;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .streamed-content {
    margin-bottom: 16px;
  }

  .paragraph p {
    margin: 0 0 8px;
    line-height: 1.6;
    color: #cbd5e1;
  }

  .draft-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .draft-item {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 10px;
  }

  .draft-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .para-index {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
  }

  .status-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .draft-content {
    margin: 0 0 8px;
    line-height: 1.5;
    color: #94a3b8;
    font-size: 12px;
  }

  .draft-controls {
    display: flex;
    gap: 6px;
  }

  .ctrl-btn {
    padding: 3px 8px;
    border: 1px solid #334155;
    background: none;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    color: #94a3b8;
  }

  .ctrl-btn:hover {
    background: #334155;
  }

  .ctrl-btn.accept {
    color: #10b981;
    border-color: #10b98133;
  }

  .ctrl-btn.reject {
    color: #ef4444;
    border-color: #ef444433;
  }

  .ctrl-btn.regen {
    color: #3b82f6;
    border-color: #3b82f633;
  }

  .empty-state {
    text-align: center;
    color: #475569;
    padding: 24px;
    font-size: 12px;
  }
</style>
