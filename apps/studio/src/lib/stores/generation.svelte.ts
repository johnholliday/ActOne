/**
 * T095: Generation store using Svelte 5 runes.
 *
 * Tracks streaming state, current draft, and generation settings.
 */

import type { DraftVersion } from '$lib/ai/draft-manager.js';

export type StreamingStatus = 'idle' | 'streaming' | 'complete' | 'error';

class GenerationStore {
  /** Current streaming status. */
  status = $state<StreamingStatus>('idle');

  /** Text accumulated so far during streaming. */
  streamedText = $state('');

  /** Error message if generation failed. */
  errorMessage = $state<string | null>(null);

  /** Total tokens generated so far. */
  tokenCount = $state(0);

  /** Duration of current/last generation in ms. */
  durationMs = $state(0);

  /** Actual cost of last generation. */
  actualCostUsd = $state(0);

  /** Currently selected scene for generation. */
  selectedScene = $state<string | null>(null);

  /** Temperature setting (0.0 - 2.0). */
  temperature = $state(0.7);

  /** Pacing setting. */
  pacing = $state('moderate');

  /** Draft versions for the current scene. */
  drafts = $state<DraftVersion[]>([]);

  /** Whether generation is active. */
  isStreaming = $derived(this.status === 'streaming');

  /** Whether generation is complete. */
  isComplete = $derived(this.status === 'complete');

  /** Start a new generation. */
  startStreaming(): void {
    this.status = 'streaming';
    this.streamedText = '';
    this.errorMessage = null;
    this.tokenCount = 0;
    this.durationMs = 0;
    this.actualCostUsd = 0;
  }

  /** Append a chunk of text. */
  appendChunk(text: string, tokenCount?: number): void {
    this.streamedText += text;
    if (tokenCount) {
      this.tokenCount += tokenCount;
    }
  }

  /** Mark generation as complete. */
  complete(totalTokens: number, durationMs: number, costUsd?: number): void {
    this.status = 'complete';
    this.tokenCount = totalTokens;
    this.durationMs = durationMs;
    if (costUsd !== undefined) {
      this.actualCostUsd = costUsd;
    }
  }

  /** Mark generation as failed. */
  fail(message: string): void {
    this.status = 'error';
    this.errorMessage = message;
  }

  /** Reset to idle state. */
  reset(): void {
    this.status = 'idle';
    this.streamedText = '';
    this.errorMessage = null;
    this.tokenCount = 0;
    this.durationMs = 0;
    this.actualCostUsd = 0;
  }

  /** Update drafts list. */
  setDrafts(drafts: DraftVersion[]): void {
    this.drafts = drafts;
  }
}

export const generationStore = new GenerationStore();
