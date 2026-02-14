import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestUser, login, type TestUser } from './helpers';

let testUser: TestUser;

test.beforeAll(async () => {
  testUser = await createTestUser();
});

test.afterAll(async () => {
  await cleanupTestUser(testUser.userId);
});

test.describe('Core flows', () => {
  test('login redirects to watch page', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('me@example.com').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.getByTestId('login-button').click();

    await page.waitForURL(/\/watch/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Watch' })).toBeVisible();
  });

  test('tab navigation between Watch, List, and Settings', async ({ page }) => {
    await login(page, testUser.email, testUser.password);

    // Navigate to List tab
    await page.getByRole('tab', { name: /list/i }).click();
    await expect(page.getByRole('heading', { name: 'List of Saved Items' })).toBeVisible();

    // Navigate to Settings tab
    await page.getByRole('tab', { name: /settings/i }).click();
    await expect(page.getByText('ACCOUNT')).toBeVisible();

    // Navigate back to Watch tab
    await page.getByRole('tab', { name: /watch/i }).click();
    await page.waitForURL(/\/watch/);
    await expect(page.getByRole('heading', { name: 'Watch' })).toBeVisible();
  });

  test('add entry to list via search', async ({ page }) => {
    await login(page, testUser.email, testUser.password);

    // Go to list tab
    await page.getByRole('tab', { name: /list/i }).click();
    await expect(page.getByRole('heading', { name: 'List of Saved Items' })).toBeVisible();

    // Click add button
    await page.getByText('Add Something').click();
    await expect(page.getByRole('heading', { name: 'Add to List' })).toBeVisible();

    // Search for a well-known movie
    await page.getByPlaceholder('Search movies and TV shows...').fill('The Matrix');

    // Wait for search results to load
    await expect(page.getByText('1999').first()).toBeVisible({ timeout: 10_000 });

    // Click Save on the first search result
    await page.getByText('Save', { exact: true }).first().click();

    // Verify it shows as saved
    await expect(page.getByText('Saved', { exact: true }).first()).toBeVisible({ timeout: 10_000 });

    // Navigate back to list and verify entry is there
    await page.getByRole('tab', { name: /list/i }).click();
    await expect(page.getByRole('heading', { name: 'List of Saved Items' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('The Matrix', { exact: true }).first()).toBeVisible();
  });

  test('sign out from settings', async ({ page }) => {
    await login(page, testUser.email, testUser.password);

    // Go to settings
    await page.getByRole('tab', { name: /settings/i }).click();
    await expect(page.getByText('Sign Out')).toBeVisible();

    // Click sign out
    await page.getByText('Sign Out').click();

    // Should redirect away from the app (to landing page or login)
    await expect(page.getByRole('heading', { name: 'Watch' })).not.toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Video Clerk')).toBeVisible();
  });
});
