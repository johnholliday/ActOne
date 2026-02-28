/**
 * T066: AI generation E2E tests.
 *
 * Tests scene selection, cost estimate display, streaming generation,
 * paragraph accept/reject, and regeneration.
 *
 * Requires authenticated session with a project containing scenes.
 */

import { test, expect } from '@playwright/test';

test.describe('AI text generation', () => {
  test.skip(true, 'Requires authenticated session with loaded project');

  test('generation panel shows scene selector', async ({ page }) => {
    await page.goto('/');

    // Open generation panel
    const genPanel = page.locator('[data-testid="prose-generation-panel"]');
    await expect(genPanel).toBeVisible();

    // Scene selector should be present
    await expect(genPanel.locator('select, [data-testid="scene-selector"]')).toBeVisible();
  });

  test('cost estimate displays before generation', async ({ page }) => {
    await page.goto('/');

    // Select a scene
    const sceneSelector = page.locator('[data-testid="scene-selector"]');
    await sceneSelector.selectOption({ index: 1 });

    // Cost estimate should appear
    await expect(page.getByText(/estimated|cost|tokens/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test('generate button triggers streaming output', async ({ page }) => {
    await page.goto('/');

    // Select scene and click generate
    await page.locator('[data-testid="scene-selector"]').selectOption({ index: 1 });
    await page.getByRole('button', { name: /generate/i }).click();

    // Streaming content should appear
    await expect(page.locator('[data-testid="generation-output"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('accept paragraph locks it and updates status', async ({ page }) => {
    await page.goto('/');

    // Find a pending paragraph
    const paragraph = page.locator('[data-status="pending"]').first();
    await expect(paragraph).toBeVisible();

    // Click accept
    await paragraph.locator('button[data-action="accept"]').click();

    // Status should change to accepted
    await expect(paragraph).toHaveAttribute('data-status', 'accepted', {
      timeout: 5_000,
    });
  });

  test('reject paragraph enables regeneration', async ({ page }) => {
    await page.goto('/');

    const paragraph = page.locator('[data-status="pending"]').first();
    await expect(paragraph).toBeVisible();

    // Click reject
    await paragraph.locator('button[data-action="reject"]').click();

    // Regenerate button should appear
    await expect(paragraph.locator('button[data-action="regenerate"]')).toBeVisible({
      timeout: 5_000,
    });
  });
});
