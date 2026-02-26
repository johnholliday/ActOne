/**
 * T095: Backend store using Svelte 5 runes.
 *
 * Tracks backend list, availability, and active selection.
 */

import type { BackendInfo } from '@repo/shared';

class BackendStore {
  /** Available backends. */
  backends = $state<(BackendInfo & { active: boolean })[]>([]);

  /** Loading state. */
  loading = $state(false);

  /** Error message. */
  error = $state<string | null>(null);

  /** Active backend ID. */
  activeId = $derived(
    this.backends.find((b) => b.active)?.id ?? null,
  );

  /** Active backend info. */
  activeBackend = $derived(
    this.backends.find((b) => b.active) ?? null,
  );

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
      this.backends = await response.json();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load backends';
    } finally {
      this.loading = false;
    }
  }

  /** Switch active backend. */
  async switchBackend(
    backendId: string,
    fetchFn: typeof fetch = fetch,
  ): Promise<void> {
    try {
      const response = await fetchFn('/api/ai-text/backends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backendId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to switch backend: ${response.status}`);
      }

      // Update local state
      this.backends = this.backends.map((b) => ({
        ...b,
        active: b.id === backendId,
      }));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to switch backend';
    }
  }
}

export const backendStore = new BackendStore();
