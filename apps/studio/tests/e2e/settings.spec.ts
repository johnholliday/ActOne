/**
 * Settings pages E2E tests.
 *
 * Tests navigation to profile/account/appearance from user menu
 * and localStorage persistence of appearance preferences.
 *
 * Requires authenticated session.
 */

import { test, expect } from '@playwright/test';

test.describe('settings pages', () => {
  test.skip(true, 'Requires authenticated session');

  test('navigates to profile settings from user menu', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Profile');
    await expect(page).toHaveURL(/\/settings\/profile/);
    await expect(page.locator('h1')).toContainText('Profile');
  });

  test('navigates to account settings from user menu', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Account');
    await expect(page).toHaveURL(/\/settings\/account/);
    await expect(page.locator('h1')).toContainText('Account');
  });

  test('navigates to appearance settings from user menu', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Appearance');
    await expect(page).toHaveURL(/\/settings\/appearance/);
    await expect(page.locator('h1')).toContainText('Appearance');
  });

  test('appearance save writes to localStorage', async ({ page }) => {
    await page.goto('/settings/appearance');

    // Select light theme
    await page.click('text=Light');
    await page.click('text=Save Preferences');

    const stored = await page.evaluate(() =>
      localStorage.getItem('actone:appearance'),
    );
    expect(stored).toBeTruthy();
    const prefs = JSON.parse(stored!);
    expect(prefs.theme).toBe('light');
  });
});
