import { test, expect } from '@playwright/test';

/**
 * Auth E2E tests (basic phase)
 *
 * Assumptions:
 * - Frontend served at http://localhost:6400 (configured in playwright.config.ts).
 * - Backend + Supabase running.
 * - Seeded dev user exists in backend:
 *     email: process.env.E2E_USER_EMAIL  || 'e2e.user@example.com'
 *     password: process.env.E2E_USER_PASSWORD || 'Password123!'
 *
 * Adjust seeding or env vars to match your actual dev user.
 */

const E2E_USER_EMAIL = process.env['E2E_USER_EMAIL'];
const E2E_USER_PASSWORD = process.env['E2E_USER_PASSWORD'];

test.describe('Auth – basic flows', () => {
  test('unauthenticated user is redirected from / to /login', async ({
    page,
  }) => {
    await page.goto('/');

    await page.waitForURL('**/login**');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Welcome Back' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  });

  test('login happy path with seeded dev user', async ({ page }) => {
    // Listen for console errors and network failures
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const networkFailures: string[] = [];
    page.on('response', (response) => {
      if (!response.ok() && response.url().includes('/api/v1/auth/login')) {
        networkFailures.push(
          `${response.status()} ${response.statusText()}: ${response.url()}`
        );
      }
    });

    await page.goto('/login');

    await page.getByLabel('Email').fill(E2E_USER_EMAIL);
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill(E2E_USER_PASSWORD);

    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for either success (navigation away from login) or error message
    try {
      // Wait for navigation away from login page (success case)
      await page.waitForURL((url) => !url.pathname.includes('/login'), {
        timeout: 15000,
      });

      // After successful login, should be on dashboard or schedule/week
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/dashboard|\/schedule/);

      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    } catch (error) {
      // If navigation failed, check for error message
      const errorBanner = page.getByRole('alert');
      if (await errorBanner.isVisible()) {
        const errorText = await errorBanner.textContent();
        throw new Error(
          `Login failed with error: "${errorText}". Console errors: ${consoleErrors.join(
            ', '
          )}. Network failures: ${networkFailures.join(', ')}`
        );
      }
      throw error;
    }
  });

  test('guards: unauthenticated access to protected routes goes to /login', async ({
    page,
  }) => {
    await page.goto('/schedule/week');

    await page.waitForURL('**/login**');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Welcome Back' })
    ).toBeVisible();
  });

  test('guards: authenticated user cannot access /login or /register', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(E2E_USER_EMAIL);
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill(E2E_USER_PASSWORD);

    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation away from login (to dashboard or schedule)
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15000,
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toMatch(/\/login(\?|$)/);

    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toMatch(/\/register(\?|$)/);
  });

  test('logout returns user to public nav + /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(E2E_USER_EMAIL);
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill(E2E_USER_PASSWORD);

    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation away from login (to dashboard or schedule)
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15000,
    });

    await page.getByRole('button', { name: 'Logout' }).click();

    await page.waitForURL('**/login**');

    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });
});
