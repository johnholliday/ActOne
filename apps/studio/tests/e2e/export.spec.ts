/**
 * Export page E2E tests.
 *
 * Tests empty state, format selection visibility, and default format.
 *
 * Requires authenticated session.
 */

import { test, expect } from '@playwright/test';

test.describe('export page', () => {
  test.skip(true, 'Requires authenticated session');

  test('shows empty state when no project loaded', async ({ page }) => {
    await page.goto('/export');
    await expect(page.locator('text=No project loaded')).toBeVisible({ timeout: 10_000 });
  });

  test('format selection is visible', async ({ page }) => {
    await page.goto('/export');
    const radios = page.locator('input[name="format"]');
    const count = await radios.count();
    expect(count).toBe(3);
  });

  test('DOCX is selected by default', async ({ page }) => {
    await page.goto('/export');
    const docxRadio = page.locator('input[name="format"][value="docx"]');
    await expect(docxRadio).toBeChecked();
  });
});
