/**
 * T073: Diagram store using Svelte 5 runes.
 *
 * Holds nodes/edges per view type with $state.raw() for SvelteFlow performance.
 */

import type { DiagramView } from '$lib/stores/ui.svelte.js';
import type { StableId, ActOneNode, ActOneEdge } from '@actone/shared';

/** Diagram state for a single view. */
interface ViewState {
  nodes: ActOneNode<unknown>[];
  edges: ActOneEdge<unknown>[];
  lastUpdated: number;
}

class DiagramStore {
  /** Raw state per view (avoids deep proxy overhead). */
  private views = $state.raw<Record<string, ViewState>>({});

  /** Currently active view (mirrors uiStore.activeDiagramView). */
  activeView = $state<DiagramView | null>(null);

  /** Nodes for the active view. */
  activeNodes = $derived(
    this.activeView ? (this.views[this.activeView]?.nodes ?? []) : [],
  );

  /** Edges for the active view. */
  activeEdges = $derived(
    this.activeView ? (this.views[this.activeView]?.edges ?? []) : [],
  );

  /** Set nodes and edges for a specific view. */
  setView(
    view: DiagramView,
    nodes: ActOneNode<unknown>[],
    edges: ActOneEdge<unknown>[],
  ): void {
    this.views = {
      ...this.views,
      [view]: { nodes, edges, lastUpdated: Date.now() },
    };
  }

  /** Update nodes for the active view (e.g., after drag). */
  updateNodes(view: DiagramView, nodes: ActOneNode<unknown>[]): void {
    const existing = this.views[view];
    if (!existing) return;
    this.views = {
      ...this.views,
      [view]: { ...existing, nodes, lastUpdated: Date.now() },
    };
  }

  /** Update edges for the active view. */
  updateEdges(view: DiagramView, edges: ActOneEdge<unknown>[]): void {
    const existing = this.views[view];
    if (!existing) return;
    this.views = {
      ...this.views,
      [view]: { ...existing, edges, lastUpdated: Date.now() },
    };
  }

  /** Get the last update timestamp for a view. */
  getLastUpdated(view: DiagramView): number {
    return this.views[view]?.lastUpdated ?? 0;
  }

  /** Clear a specific view's state. */
  clearView(view: DiagramView): void {
    const { [view]: _, ...rest } = this.views;
    this.views = rest;
  }

  /** Clear all diagram state. */
  clear(): void {
    this.views = {};
    this.activeView = null;
  }
}

export const diagramStore = new DiagramStore();
