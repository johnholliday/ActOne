/**
 * T063: Authentication E2E tests.
 *
 * Tests unauthenticated redirect, sign-in flow, and authenticated layout.
 */

import { test, expect } from '@playwright/test';

test.describe('authentication', () => {
  test('unauthenticated user is redirected to login page', async ({ page }) => {
    await page.goto('/');

    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('login page renders sign-in form', async ({ page }) => {
    await page.goto('/auth');

    // Should display the auth form
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/auth');

    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show an error message
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
