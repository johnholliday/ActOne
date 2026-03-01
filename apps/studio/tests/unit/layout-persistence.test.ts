import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { DockviewApi } from 'dockview-core';

const STORAGE_KEY = 'actone:dockview-layout';
const OLD_STORAGE_KEY = 'actone:layout';

/** Simple in-memory localStorage mock */
function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); }),
    get length() { return store.size; },
    key: vi.fn((_index: number) => null),
  };
}

/** Create a mock DockviewApi */
function mockApi(overrides?: Record<string, unknown>): DockviewApi {
  return {
    toJSON: vi.fn(() => ({
      grid: { root: {}, width: 800, height: 600, orientation: 'HORIZONTAL' },
      panels: {},
      activeGroup: 'g1',
    })),
    fromJSON: vi.fn(),
    clear: vi.fn(),
    addPanel: vi.fn(),
    ...overrides,
  } as unknown as DockviewApi;
}

describe('layout-persistence', () => {
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    storageMock = createLocalStorageMock();
    vi.stubGlobal('localStorage', storageMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
  });

  describe('saveLayout', () => {
    it('saves versioned layout to localStorage after debounce', async () => {
      const { saveLayout } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      saveLayout(api);

      // Not saved immediately
      expect(storageMock.setItem).not.toHaveBeenCalled();

      // After debounce
      vi.advanceTimersByTime(600);

      expect(storageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String),
      );
      const parsed = JSON.parse(storageMock.setItem.mock.calls[0]![1] as string);
      expect(parsed.version).toBe(1);
      expect(parsed.data.grid).toBeDefined();
      expect(parsed.data.panels).toBeDefined();
    });

    it('debounces multiple rapid saves', async () => {
      const { saveLayout } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      saveLayout(api);
      saveLayout(api);
      saveLayout(api);
      vi.advanceTimersByTime(600);

      expect(api.toJSON).toHaveBeenCalledTimes(1);
    });
  });

  describe('restoreLayout', () => {
    it('returns false for empty localStorage', async () => {
      const { restoreLayout } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      expect(restoreLayout(api)).toBe(false);
      expect(api.fromJSON).not.toHaveBeenCalled();
    });

    it('returns false for invalid JSON', async () => {
      storageMock.getItem.mockReturnValueOnce('not json');
      const { restoreLayout } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      expect(restoreLayout(api)).toBe(false);
    });

    it('returns false for missing version field', async () => {
      storageMock.getItem.mockReturnValueOnce(JSON.stringify({ data: {} }));
      const { restoreLayout } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      expect(restoreLayout(api)).toBe(false);
    });

    it('returns false for future version', async () => {
      storageMock.getItem.mockReturnValueOnce(JSON.stringify({
        version: 999,
        data: { grid: {}, panels: {} },
      }));
      const { restoreLayout } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      expect(restoreLayout(api)).toBe(false);
    });

    it('returns false for missing grid/panels in data', async () => {
      storageMock.getItem.mockReturnValueOnce(JSON.stringify({
        version: 1,
        data: { something: 'else' },
      }));
      const { restoreLayout } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      expect(restoreLayout(api)).toBe(false);
    });

    it('restores valid layout and returns true', async () => {
      const validLayout = {
        version: 1,
        data: {
          grid: { root: {}, width: 800, height: 600, orientation: 'HORIZONTAL' },
          panels: { editor: {} },
          activeGroup: 'g1',
        },
      };
      storageMock.getItem.mockReturnValueOnce(JSON.stringify(validLayout));

      const { restoreLayout } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      expect(restoreLayout(api)).toBe(true);
      expect(api.fromJSON).toHaveBeenCalledWith(validLayout.data);
    });

    it('returns false if fromJSON throws', async () => {
      const validLayout = {
        version: 1,
        data: { grid: { root: {} }, panels: {} },
      };
      storageMock.getItem.mockReturnValueOnce(JSON.stringify(validLayout));

      const { restoreLayout } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi({
        fromJSON: vi.fn(() => { throw new Error('corrupt'); }),
      });
      expect(restoreLayout(api)).toBe(false);
    });
  });

  describe('clearLayout', () => {
    it('removes the layout from localStorage', async () => {
      const { clearLayout } = await import('$lib/dockview/layout-persistence.js');
      clearLayout();
      expect(storageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('migrateOldLayout', () => {
    it('removes old storage key', async () => {
      storageMock.getItem.mockImplementation((key: string) =>
        key === OLD_STORAGE_KEY ? '{"sidebar":true}' : null,
      );
      const { migrateOldLayout } = await import('$lib/dockview/layout-persistence.js');
      migrateOldLayout();
      expect(storageMock.removeItem).toHaveBeenCalledWith(OLD_STORAGE_KEY);
    });

    it('does nothing if old key does not exist', async () => {
      const { migrateOldLayout } = await import('$lib/dockview/layout-persistence.js');
      migrateOldLayout(); // Should not throw
    });
  });

  describe('restoreOrDefault', () => {
    it('restores saved layout if available', async () => {
      const validLayout = {
        version: 1,
        data: { grid: { root: {} }, panels: {} },
      };
      storageMock.getItem.mockImplementation((key: string) =>
        key === STORAGE_KEY ? JSON.stringify(validLayout) : null,
      );

      const { restoreOrDefault } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      restoreOrDefault(api);
      expect(api.fromJSON).toHaveBeenCalled();
      expect(api.clear).not.toHaveBeenCalled();
    });

    it('applies default layout when no saved layout', async () => {
      const { restoreOrDefault } = await import('$lib/dockview/layout-persistence.js');
      const api = mockApi();
      restoreOrDefault(api);
      // Default layout calls api.clear() then api.addPanel()
      expect(api.clear).toHaveBeenCalled();
    });
  });
});
