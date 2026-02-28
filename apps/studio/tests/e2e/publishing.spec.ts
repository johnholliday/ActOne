/**
 * T068: Publishing E2E tests.
 *
 * Tests dependency check, EPUB export, reading mode, and spread preview.
 *
 * Requires authenticated session with a project containing accepted drafts.
 */

import { test, expect } from '@playwright/test';

test.describe('publishing', () => {
  test.skip(true, 'Requires authenticated session with loaded project');

  test('publishing panel shows dependency check status', async ({ page }) => {
    await page.goto('/');

    // Open publishing panel
    const publishPanel = page.locator('[data-testid="publishing-panel"]');
    await expect(publishPanel).toBeVisible();

    // Should show readiness status
    await expect(publishPanel.getByText(/ready|not ready|missing/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('EPUB export provides download link', async ({ page }) => {
    await page.goto('/');

    const publishPanel = page.locator('[data-testid="publishing-panel"]');
    await publishPanel.getByRole('button', { name: /export.*epub/i }).click();

    // Should show download link or success message
    await expect(
      page.getByText(/download|exported|success/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('reading mode renders manuscript content', async ({ page }) => {
    await page.goto('/reading-mode');

    // Should display manuscript preview
    await expect(page.locator('article, [data-testid="reading-content"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('spread preview renders page spreads', async ({ page }) => {
    await page.goto('/spread-preview');

    // Should display page spread visualization
    await expect(page.locator('[data-testid="spread-container"], canvas')).toBeVisible({
      timeout: 10_000,
    });
  });
});
