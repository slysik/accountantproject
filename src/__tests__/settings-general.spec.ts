/**
 * Playwright integration tests for Settings → General (theme mode).
 * Run with: npx playwright test src/__tests__/settings-general.spec.ts
 * Requires the dev server on http://localhost:3000 and a valid test session.
 */

import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

async function setThemeCookie(page: Page, mode: string) {
  await page.context().addCookies([
    { name: 'theme-mode', value: mode, domain: 'localhost', path: '/' },
  ]);
}

async function htmlClasses(page: Page): Promise<string> {
  return page.evaluate(() => document.documentElement.className);
}

test.describe('Settings → General appearance picker', () => {
  test('default tile is Light when no storage set', async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}/settings/general`, { waitUntil: 'networkidle' });

    const lightTile = page.locator('[role="radio"][aria-checked="true"]');
    await expect(lightTile).toContainText('Light');
    const classes = await htmlClasses(page);
    expect(classes).not.toContain('dark');
  });

  test('selecting Dark applies .dark class and persists across reload', async ({ page }) => {
    await page.goto(`${BASE}/settings/general`, { waitUntil: 'networkidle' });

    await page.locator('[role="radio"]', { hasText: 'Dark' }).click();
    const classes = await htmlClasses(page);
    expect(classes).toContain('dark');

    await page.reload({ waitUntil: 'networkidle' });
    const classesAfterReload = await htmlClasses(page);
    expect(classesAfterReload).toContain('dark');
  });

  test('dark mode persists across page navigations', async ({ page }) => {
    await setThemeCookie(page, 'dark');
    for (const route of ['/settings/account', '/settings/security', '/dashboard']) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      const classes = await htmlClasses(page);
      expect(classes).toContain('dark');
    }
  });

  test('selecting Light restores light mode and persists', async ({ page }) => {
    await setThemeCookie(page, 'dark');
    await page.goto(`${BASE}/settings/general`, { waitUntil: 'networkidle' });

    await page.locator('[role="radio"]', { hasText: 'Light' }).click();
    const classes = await htmlClasses(page);
    expect(classes).not.toContain('dark');

    await page.reload({ waitUntil: 'networkidle' });
    const classesAfterReload = await htmlClasses(page);
    expect(classesAfterReload).not.toContain('dark');
  });

  test('Auto mode follows system prefers-color-scheme dark', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/settings/general`, { waitUntil: 'networkidle' });
    await page.locator('[role="radio"]', { hasText: 'Auto' }).click();
    const classes = await htmlClasses(page);
    expect(classes).toContain('dark');
    await ctx.close();
  });

  test('keyboard navigation moves selection with arrow keys', async ({ page }) => {
    await page.goto(`${BASE}/settings/general`, { waitUntil: 'networkidle' });

    const first = page.locator('[role="radio"]').first();
    await first.focus();
    await page.keyboard.press('ArrowRight');

    const checked = page.locator('[role="radio"][aria-checked="true"]');
    await expect(checked).toContainText('Auto');
  });

  test('General is first item in settings sidebar', async ({ page }) => {
    await page.goto(`${BASE}/settings/general`, { waitUntil: 'networkidle' });
    const firstNavLink = page.locator('aside nav a').first();
    await expect(firstNavLink).toContainText('General');
  });
});
