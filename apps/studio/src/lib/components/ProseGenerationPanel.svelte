<script lang="ts">
  /**
   * T096: Prose Generation Panel.
   *
   * Scene selector, backend selector, temperature slider,
   * pacing selector, cost estimate display, and generate button.
   */
  import { generationStore } from '$lib/stores/generation.svelte.js';
  import { backendStore } from '$lib/stores/backends.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { findScenes } from '$lib/ast/ast-utils.js';
  import { formatCostEstimate, estimateWords } from '$lib/ai/cost-estimator.js';
  import type { CostEstimate } from '@actone/shared';

  let costEstimate = $state<CostEstimate | null>(null);
  let estimateLoading = $state(false);

  const scenes = $derived(
    astStore.activeAst ? findScenes(astStore.activeAst).map((s) => s.name) : [],
  );

  const pacingOptions = ['slow', 'measured', 'moderate', 'brisk', 'accelerating'] as const;

  async function fetchEstimate() {
    if (!generationStore.selectedScene || !backendStore.activeId) return;
    estimateLoading = true;
    try {
      const response = await fetch('/api/ai-text/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'default', // TODO: from project context
          sceneName: generationStore.selectedScene,
          backendId: backendStore.activeId,
        }),
      });
      if (response.ok) {
        costEstimate = await response.json();
      }
    } finally {
      estimateLoading = false;
    }
  }

  async function handleGenerate() {
    if (!generationStore.selectedScene || !backendStore.activeId) return;

    generationStore.startStreaming();

    try {
      const response = await fetch('/api/ai-text/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'default',
          sceneName: generationStore.selectedScene,
          backendId: backendStore.activeId,
          temperature: generationStore.temperature,
          pacing: generationStore.pacing,
        }),
      });

      if (!response.ok) {
        generationStore.fail(`Generation failed: ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        generationStore.fail('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

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
              generationStore.appendChunk(data.text, data.tokenCount);
              break;
            case 'done':
              generationStore.complete(data.totalTokens, data.durationMs);
              break;
            case 'cost':
              generationStore.actualCostUsd = data.actualCostUsd;
              break;
            case 'error':
              generationStore.fail(data.error);
              break;
          }
        }
      }
    } catch (e) {
      generationStore.fail(e instanceof Error ? e.message : 'Unknown error');
    }
  }
</script>

<div class="generation-panel">
  <h3>Prose Generation</h3>

  <div class="field">
    <label for="scene-select">Scene</label>
    <select
      id="scene-select"
      bind:value={generationStore.selectedScene}
      onchange={() => void fetchEstimate()}
    >
      <option value={null}>Select a scene...</option>
      {#each scenes as scene}
        <option value={scene}>{scene}</option>
      {/each}
    </select>
  </div>

  <div class="field">
    <label for="temp-slider">
      Temperature: {generationStore.temperature.toFixed(1)}
    </label>
    <input
      id="temp-slider"
      type="range"
      min="0"
      max="2"
      step="0.1"
      bind:value={generationStore.temperature}
    />
  </div>

  <div class="field">
    <label for="pacing-select">Pacing</label>
    <select id="pacing-select" bind:value={generationStore.pacing}>
      {#each pacingOptions as p}
        <option value={p}>{p}</option>
      {/each}
    </select>
  </div>

  {#if costEstimate}
    <div class="cost-estimate">
      {formatCostEstimate(costEstimate)}
      (~{estimateWords(costEstimate.estimatedTokens)} words)
    </div>
  {/if}
  {#if estimateLoading}
    <div class="cost-estimate loading">Estimating cost...</div>
  {/if}

  <button
    class="generate-btn"
    onclick={handleGenerate}
    disabled={!generationStore.selectedScene || !backendStore.activeId || generationStore.isStreaming}
  >
    {generationStore.isStreaming ? 'Generating...' : 'Generate'}
  </button>

  {#if generationStore.errorMessage}
    <div class="error">{generationStore.errorMessage}</div>
  {/if}

  {#if generationStore.isComplete}
    <div class="stats">
      {generationStore.tokenCount} tokens in {(generationStore.durationMs / 1000).toFixed(1)}s
      {#if generationStore.actualCostUsd > 0}
        (${generationStore.actualCostUsd.toFixed(4)})
      {/if}
    </div>
  {/if}
</div>

<style>
  .generation-panel {
    padding: 12px;
    background: #1e293b;
    border-radius: 8px;
    font-size: 13px;
    color: #e2e8f0;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
  }

  .field {
    margin-bottom: 10px;
  }

  label {
    display: block;
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  select, input[type="range"] {
    width: 100%;
  }

  select {
    background: #0f172a;
    border: 1px solid #334155;
    color: #e2e8f0;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .cost-estimate {
    padding: 6px 8px;
    background: #334155;
    border-radius: 4px;
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 10px;
  }

  .cost-estimate.loading {
    opacity: 0.6;
  }

  .generate-btn {
    width: 100%;
    padding: 8px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 13px;
  }

  .generate-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .generate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    margin-top: 8px;
    padding: 6px 8px;
    background: #7f1d1d;
    border-radius: 4px;
    font-size: 11px;
    color: #fca5a5;
  }

  .stats {
    margin-top: 8px;
    font-size: 11px;
    color: #64748b;
  }
</style>
