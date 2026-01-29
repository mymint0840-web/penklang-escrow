import { test, expect } from '@playwright/test';

test.describe('Admin Panel - All Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@penklang.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
  });

  test('Dashboard page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1, h2').first().textContent();
    console.log('Dashboard title:', title);

    // Check for duplicate sidebars
    const sidebars = await page.locator('aside').count();
    console.log('Number of sidebars:', sidebars);

    await expect(page).toHaveURL(/\/admin/);
    await page.screenshot({ path: 'test-results/admin-dashboard.png' });
  });

  test('Users page', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());
    await expect(page).toHaveURL(/\/admin\/users/);
    await page.screenshot({ path: 'test-results/admin-users.png' });
  });

  test('KYC page', async ({ page }) => {
    await page.goto('/admin/kyc');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());
    await expect(page).toHaveURL(/\/admin\/kyc/);
    await page.screenshot({ path: 'test-results/admin-kyc.png' });
  });

  test('Transactions page', async ({ page }) => {
    await page.goto('/admin/transactions');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());
    await expect(page).toHaveURL(/\/admin\/transactions/);
    await page.screenshot({ path: 'test-results/admin-transactions.png' });
  });

  test('Disputes page', async ({ page }) => {
    await page.goto('/admin/disputes');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());
    await expect(page).toHaveURL(/\/admin\/disputes/);
    await page.screenshot({ path: 'test-results/admin-disputes.png' });
  });

  test('Settings page', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());
    await expect(page).toHaveURL(/\/admin\/settings/);
    await page.screenshot({ path: 'test-results/admin-settings.png' });
  });
});
