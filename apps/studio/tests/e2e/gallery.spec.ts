/**
 * Gallery page E2E tests.
 *
 * Tests navigation, empty state, filter tabs, and compare mode toggle.
 *
 * Requires authenticated session.
 */

import { test, expect } from '@playwright/test';

test.describe('gallery page', () => {
  test.skip(true, 'Requires authenticated session');

  test('navigates to gallery from sidebar', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="sidebar"] >> text=Gallery');
    await expect(page).toHaveURL(/\/gallery/);
  });

  test('shows empty state when no assets', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.locator('text=No assets yet')).toBeVisible({ timeout: 10_000 });
  });

  test('filter tabs are visible', async ({ page }) => {
    await page.goto('/gallery');
    const tabs = page.locator('.filter-tab, [data-testid="filter-tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 10_000 });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('compare mode toggle works', async ({ page }) => {
    await page.goto('/gallery');
    const btn = page.locator('button:has-text("Compare")');
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await btn.click();
    await expect(btn).toHaveClass(/active/);
    await btn.click();
    await expect(btn).not.toHaveClass(/active/);
  });
});
