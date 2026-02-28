/**
 * T067: Analytics and Story Bible E2E tests.
 *
 * Tests analytics view metrics display and Story Bible character details.
 *
 * Requires authenticated session with a project containing story data.
 */

import { test, expect } from '@playwright/test';

test.describe('analytics', () => {
  test.skip(true, 'Requires authenticated session with loaded project');

  test('statistics page displays story metrics', async ({ page }) => {
    await page.goto('/statistics');

    // Should show key metrics
    await expect(page.getByText(/word count|words/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/scene|scenes/i)).toBeVisible();
    await expect(page.getByText(/character|characters/i)).toBeVisible();
  });

  test('statistics page shows scene type distribution', async ({ page }) => {
    await page.goto('/statistics');

    // Should show scene type breakdown (chart or table)
    await expect(page.locator('[data-testid="scene-distribution"], canvas, svg')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('story bible page renders', async ({ page }) => {
    await page.goto('/story-bible');

    // Should show story bible content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test('story bible shows character details', async ({ page }) => {
    await page.goto('/story-bible');

    // Should list characters with their details
    const characterSection = page.locator('[data-testid="character-section"]').first();
    await expect(characterSection).toBeVisible({ timeout: 10_000 });

    // Character should have name, bio, and traits
    await expect(characterSection.locator('[data-testid="character-name"]')).toBeVisible();
  });
});
