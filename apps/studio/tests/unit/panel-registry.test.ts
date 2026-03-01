import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerPanel,
  getPanelDefinition,
  getAllPanelIds,
  createComponent,
  type PanelDefinition,
} from '$lib/dockview/panel-registry.js';
import type { Component } from 'svelte';
import type { CreateComponentOptions } from 'dockview-core';

// Minimal mock component (Svelte 5 components are functions)
const MockComponent = (() => {}) as unknown as Component;

// Helper to create a mock panel definition
function mockDef(id: string, overrides?: Partial<PanelDefinition>): PanelDefinition {
  return {
    id,
    title: `Panel ${id}`,
    component: MockComponent,
    renderer: 'onlyWhenVisible',
    singleton: true,
    ...overrides,
  };
}

// Mock document.createElement for createComponent tests
beforeEach(() => {
  if (typeof globalThis.document === 'undefined') {
    const mockDiv = {
      style: { width: '', height: '', overflow: '', padding: '', color: '' },
      textContent: '',
    };
    vi.stubGlobal('document', {
      createElement: vi.fn(() => mockDiv),
    });
  }
});

describe('panel-registry', () => {
  // Note: The registry is a module-level Map, so registrations accumulate.
  // Tests should use unique IDs to avoid interference.

  describe('registerPanel / getPanelDefinition', () => {
    it('registers and retrieves a panel definition', () => {
      const def = mockDef('test-register-1');
      registerPanel(def);
      expect(getPanelDefinition('test-register-1')).toEqual(def);
    });

    it('returns undefined for unregistered panel', () => {
      expect(getPanelDefinition('nonexistent-panel-xyz')).toBeUndefined();
    });

    it('overwrites existing registration with same ID', () => {
      registerPanel(mockDef('test-overwrite', { title: 'Original' }));
      registerPanel(mockDef('test-overwrite', { title: 'Updated' }));
      expect(getPanelDefinition('test-overwrite')?.title).toBe('Updated');
    });

    it('stores defaultParams when provided', () => {
      registerPanel(mockDef('test-params', {
        defaultParams: { diagramType: 'story-structure' },
      }));
      expect(getPanelDefinition('test-params')?.defaultParams).toEqual({
        diagramType: 'story-structure',
      });
    });
  });

  describe('getAllPanelIds', () => {
    it('returns registered IDs', () => {
      registerPanel(mockDef('test-list-a'));
      registerPanel(mockDef('test-list-b'));
      const ids = getAllPanelIds();
      expect(ids).toContain('test-list-a');
      expect(ids).toContain('test-list-b');
    });
  });

  describe('createComponent', () => {
    beforeEach(() => {
      registerPanel(mockDef('test-create'));
    });

    it('returns a renderer for known panel type', () => {
      const options: CreateComponentOptions = {
        id: 'test-create',
        name: 'test-create',
      };
      const renderer = createComponent(options);
      expect(renderer).toBeDefined();
      expect(renderer.element).toBeDefined();
    });

    it('returns a fallback renderer for unknown panel type', () => {
      const options: CreateComponentOptions = {
        id: 'unknown-xyz-123',
        name: 'unknown-xyz-123',
      };
      const renderer = createComponent(options);
      expect(renderer).toBeDefined();
      expect(renderer.element).toBeDefined();
    });
  });
});
