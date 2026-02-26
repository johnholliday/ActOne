/**
 * T069: Shell layout E2E tests.
 *
 * Tests three-zone layout rendering, resize handles, menu bar,
 * and sidebar toggle shortcut.
 *
 * Requires authenticated session.
 */

import { test, expect } from '@playwright/test';

test.describe('shell layout', () => {
  test.skip(true, 'Requires authenticated session');

  test('three-zone layout renders', async ({ page }) => {
    await page.goto('/');

    // Verify the three main zones: sidebar/navigator, editor, and panel
    await expect(page.locator('[data-testid="sidebar"], nav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="editor-pane"], .cm-editor')).toBeVisible();
    await expect(page.locator('[data-testid="panel-area"]')).toBeVisible();
  });

  test('resize handles between panels are functional', async ({ page }) => {
    await page.goto('/');

    // Find resize handle
    const handle = page.locator('[data-testid="resize-handle"]').first();
    await expect(handle).toBeVisible({ timeout: 10_000 });

    // Verify it has cursor style indicating it's draggable
    const cursor = await handle.evaluate((el) => getComputedStyle(el).cursor);
    expect(['col-resize', 'row-resize', 'ew-resize', 'ns-resize']).toContain(cursor);
  });

  test('menu bar renders with expected items', async ({ page }) => {
    await page.goto('/');

    const menuBar = page.locator('[data-testid="menu-bar"], header');
    await expect(menuBar).toBeVisible({ timeout: 10_000 });

    // Should contain key menu items
    await expect(menuBar.getByText(/file|project/i)).toBeVisible();
  });

  test('Ctrl+B toggles sidebar visibility', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('[data-testid="sidebar"], nav');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // Toggle sidebar off
    await page.keyboard.press('Control+b');
    await expect(sidebar).toBeHidden({ timeout: 3_000 });

    // Toggle sidebar back on
    await page.keyboard.press('Control+b');
    await expect(sidebar).toBeVisible({ timeout: 3_000 });
  });
});
