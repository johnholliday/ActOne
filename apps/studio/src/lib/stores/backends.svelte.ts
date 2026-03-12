/**
 * Backend store using Svelte 5 runes.
 *
 * Tracks backend list, availability, and active selection.
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

class BackendStore {
  /** Available backends from the server. */
  backends = $state<BackendEntry[]>([]);

  /** Locally-selected active backend ID. */
  selectedId = $state<string | null>(null);

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
}

export const backendStore = new BackendStore();
