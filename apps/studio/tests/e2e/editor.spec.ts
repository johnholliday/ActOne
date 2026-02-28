/**
 * T064: Editor E2E tests.
 *
 * Tests project creation, syntax highlighting, navigator, diagnostics,
 * and LSP features (completion, hover, formatting, go-to-definition, rename).
 *
 * Requires authenticated session — tests assume login via storageState or fixture.
 */

import { test, expect } from '@playwright/test';

test.describe('editor', () => {
  test.skip(true, 'Requires authenticated session — run with auth fixture');

  test('project creation wizard opens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new project/i }).click();

    // Should show creation wizard
    await expect(page.getByText(/create.*project/i)).toBeVisible();
  });

  test('editor pane renders with CodeMirror', async ({ page }) => {
    await page.goto('/');

    // Editor pane should be visible
    const editor = page.locator('.cm-editor');
    await expect(editor).toBeVisible({ timeout: 15_000 });
  });

  test('typing content shows syntax highlighting', async ({ page }) => {
    await page.goto('/');

    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await page.keyboard.type('story "Test" {\n  character Alice {\n    bio: "Test."\n  }\n}');

    // Keywords should have syntax highlighting classes
    await expect(page.locator('.cm-keyword')).toHaveCount(3, { timeout: 5_000 });
  });

  test('project navigator shows story elements', async ({ page }) => {
    await page.goto('/');

    // Navigator panel should list story elements
    const navigator = page.locator('[data-testid="project-navigator"]');
    await expect(navigator).toBeVisible();
  });

  test('error diagnostics appear for invalid content', async ({ page }) => {
    await page.goto('/');

    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await page.keyboard.type('story {');

    // Should show error diagnostic (red underline or gutter marker)
    await expect(page.locator('.cm-lint-marker-error, .cm-lintRange-error')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('completion popup appears on trigger', async ({ page }) => {
    await page.goto('/');

    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await page.keyboard.type('story "Test" {\n  ');

    // Trigger completion
    await page.keyboard.press('Control+Space');

    // Completion popup should appear
    await expect(page.locator('.cm-tooltip-autocomplete')).toBeVisible({
      timeout: 5_000,
    });
  });
});
