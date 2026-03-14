/**
 * Backend store using Svelte 5 runes.
 *
 * Tracks backend list, availability, active selection, and model choice.
 * Adapted for sanyam-ai-text 0.15.0 response format:
 *   GET /api/ai-text/backends → { backends: [{ id, name, available, error? }] }
 */

/** Shape returned by sanyam-ai-text 0.15.0 backends route */
interface BackendEntry {
  id: string;
  name: string;
  available: boolean;
  error?: string;
}

/** A model available for a given provider */
export interface ModelEntry {
  id: string;
  label: string;
}

/**
 * Known models per provider.
 * Sourced from sanyam-ai-anthropic, sanyam-ai-openai, sanyam-ai-local defaults.
 * The first entry is the default.
 */
const KNOWN_MODELS: Record<string, ModelEntry[]> = {
  anthropic: [
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
  ],
  local: [
    { id: 'llama3.2', label: 'Llama 3.2' },
  ],
};

class BackendStore {
  /** Available backends from the server. */
  backends = $state<BackendEntry[]>([]);

  /** Locally-selected active backend ID. */
  selectedId = $state<string | null>(null);

  /** Locally-selected model ID (per-backend). */
  private selectedModels = $state<Record<string, string>>({});

  /** Loading state. */
  loading = $state(false);

  /** Error message. */
  error = $state<string | null>(null);

  /** Active backend ID (selected, or first available). */
  activeId = $derived(
    this.selectedId
      ?? this.backends.find((b) => b.available)?.id
      ?? null,
  );

  /** Active backend info. */
  activeBackend = $derived.by(() => {
    const id = this.activeId;
    return this.backends.find((b) => b.id === id) ?? null;
  });

  /** Display label for a backend. */
  get label(): string {
    return this.activeBackend?.name ?? 'No backend';
  }

  /** Available (online) backends. */
  availableBackends = $derived(
    this.backends.filter((b) => b.available),
  );

  /** Models available for the active backend. */
  activeModels = $derived<ModelEntry[]>(
    this.activeId ? (KNOWN_MODELS[this.activeId] ?? []) : [],
  );

  /** Currently selected model ID for the active backend. */
  activeModelId = $derived.by(() => {
    const id = this.activeId;
    if (!id) return null;
    return this.selectedModels[id] ?? KNOWN_MODELS[id]?.[0]?.id ?? null;
  });

  /** Currently selected model entry for the active backend. */
  activeModel = $derived.by(() => {
    const modelId = this.activeModelId;
    const models = this.activeModels;
    return models.find((m) => m.id === modelId) ?? models[0] ?? null;
  });

  /** Fetch backends from API. */
  async refresh(fetchFn: typeof fetch = fetch): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetchFn('/api/ai-text/backends');
      if (!response.ok) {
        throw new Error(`Failed to fetch backends: ${response.status}`);
      }
      const data = await response.json() as { backends: BackendEntry[] };
      this.backends = Array.isArray(data) ? data : (data.backends ?? []);

      // Auto-select first available if none selected
      if (!this.selectedId && this.backends.length > 0) {
        const first = this.backends.find((b) => b.available);
        if (first) this.selectedId = first.id;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load backends';
    } finally {
      this.loading = false;
    }
  }

  /** Switch active backend (local-only, no server call). */
  switchBackend(backendId: string): void {
    this.selectedId = backendId;
  }

  /** Switch model for the active backend (local-only). */
  switchModel(modelId: string): void {
    const id = this.activeId;
    if (!id) return;
    this.selectedModels = { ...this.selectedModels, [id]: modelId };
  }
}

export const backendStore = new BackendStore();
