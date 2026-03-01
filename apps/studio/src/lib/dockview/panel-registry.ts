/**
 * Panel registry: maps panel type IDs to their Svelte components,
 * titles, and renderer modes.
 *
 * The createComponent factory is passed to dockview's createDockview()
 * and is called for both new panels and deserialized panels.
 */
import type { Component } from 'svelte';
import type { CreateComponentOptions, DockviewPanelRenderer } from 'dockview-core';
import { SvelteContentRenderer } from './SvelteContentRenderer.js';

export interface PanelDefinition {
  id: string;
  title: string;
  component: Component;
  renderer: DockviewPanelRenderer;
  singleton: boolean;
  defaultParams?: Record<string, unknown>;
  /** Where to place this panel when first opened */
  defaultPosition?: {
    direction: 'left' | 'right' | 'above' | 'below' | 'within';
    referencePanel: string;
  };
  /** Panels with the same panelGroup share a dockview group (tabbed together) */
  panelGroup?: string;
}

/**
 * Registry of all panel types. Populated by registerPanel().
 * Components are lazy-imported in panel-registry-init.ts to avoid
 * circular dependencies.
 */
const registry = new Map<string, PanelDefinition>();

export function registerPanel(def: PanelDefinition): void {
  registry.set(def.id, def);
}

export function getPanelDefinition(id: string): PanelDefinition | undefined {
  return registry.get(id);
}

export function getAllPanelIds(): string[] {
  return [...registry.keys()];
}

/**
 * Placeholder component rendered when a saved layout references
 * a panel type that no longer exists.
 */
let placeholderComponent: Component | null = null;

export function setPlaceholderComponent(component: Component): void {
  placeholderComponent = component;
}

/**
 * Factory function passed to dockview's createDockview().
 * Called for both new panels and deserialized panels from saved layouts.
 */
export function createComponent(options: CreateComponentOptions): SvelteContentRenderer {
  const def = registry.get(options.name);

  if (def) {
    return new SvelteContentRenderer(def.component);
  }

  // Unknown panel type — return placeholder instead of throwing
  // so saved layouts with removed panel types restore gracefully.
  console.warn(
    `[ActOne] Unknown panel type "${options.name}" (id: ${options.id}). Using placeholder.`,
  );

  if (placeholderComponent) {
    return new SvelteContentRenderer(placeholderComponent);
  }

  // Fallback: create a minimal element showing the error
  const fallback = new SvelteContentRenderer(
    // Svelte 5 mount() expects a Component, but we need a minimal fallback.
    // Create a tiny inline component-like object that just renders text.
    // This is a last resort — setPlaceholderComponent() should be called during init.
    null as unknown as Component,
  );
  fallback.element.textContent = `Unknown panel: ${options.name}`;
  fallback.element.style.padding = '16px';
  fallback.element.style.color = '#71717a';
  // Override init to be a no-op since we have no real component
  fallback.init = () => {};
  fallback.dispose = () => {};
  return fallback;
}
