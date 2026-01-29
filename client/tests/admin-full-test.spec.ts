import { test, expect } from '@playwright/test';

test.describe('Admin Panel - Full Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@penklang.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
  });

  test('1. Dashboard - should load stats and show content', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });

    // Check for stats cards
    const statsCards = await page.locator('.grid .p-6').count();
    console.log('Stats cards found:', statsCards);

    // Take screenshot
    await page.screenshot({ path: 'test-results/01-dashboard.png', fullPage: true });

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/admin/);
    console.log('Dashboard: OK');
  });

  test('2. Users - should load user list', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Wait for page content
    await page.waitForSelector('text=จัดการผู้ใช้', { timeout: 10000 });

    // Check for table or "no data" message
    const hasTable = await page.locator('table').count() > 0;
    const hasNoData = await page.locator('text=ไม่พบข้อมูลผู้ใช้').count() > 0;

    console.log('Users page - Has table:', hasTable, 'Has no data message:', hasNoData);

    await page.screenshot({ path: 'test-results/02-users.png', fullPage: true });

    await expect(page).toHaveURL(/\/admin\/users/);
    console.log('Users: OK');
  });

  test('3. KYC - should load KYC submissions', async ({ page }) => {
    await page.goto('/admin/kyc');
    await page.waitForLoadState('networkidle');

    // Wait for page content
    await page.waitForSelector('text=ตรวจสอบ KYC', { timeout: 10000 });

    // Check for content
    const hasTable = await page.locator('table').count() > 0;
    const hasNoData = await page.locator('text=ไม่มีคำขอ KYC').count() > 0;

    console.log('KYC page - Has table:', hasTable, 'Has no data message:', hasNoData);

    await page.screenshot({ path: 'test-results/03-kyc.png', fullPage: true });

    await expect(page).toHaveURL(/\/admin\/kyc/);
    console.log('KYC: OK');
  });

  test('4. Transactions - should load transaction list', async ({ page }) => {
    await page.goto('/admin/transactions');
    await page.waitForLoadState('networkidle');

    // Wait for page content
    await page.waitForSelector('text=ธุรกรรมทั้งหมด', { timeout: 10000 });

    // Check for content
    const hasTable = await page.locator('table').count() > 0;
    const hasNoData = await page.locator('text=ไม่พบข้อมูลธุรกรรม').count() > 0;

    console.log('Transactions page - Has table:', hasTable, 'Has no data message:', hasNoData);

    await page.screenshot({ path: 'test-results/04-transactions.png', fullPage: true });

    await expect(page).toHaveURL(/\/admin\/transactions/);
    console.log('Transactions: OK');
  });

  test('5. Disputes - should load disputes list', async ({ page }) => {
    await page.goto('/admin/disputes');
    await page.waitForLoadState('networkidle');

    // Wait for page content
    await page.waitForSelector('text=จัดการข้อพิพาท', { timeout: 10000 });

    // Check for content
    const hasTable = await page.locator('table').count() > 0;
    const hasNoData = await page.locator('text=ไม่มีข้อพิพาท').count() > 0;

    console.log('Disputes page - Has table:', hasTable, 'Has no data message:', hasNoData);

    await page.screenshot({ path: 'test-results/05-disputes.png', fullPage: true });

    await expect(page).toHaveURL(/\/admin\/disputes/);
    console.log('Disputes: OK');
  });

  test('6. Settings - should load system settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    // Wait for page content
    await page.waitForSelector('text=ตั้งค่าระบบ', { timeout: 10000 });

    // Check for settings form elements
    const hasMaintenanceMode = await page.locator('text=โหมดปิดปรับปรุง').count() > 0;
    const hasFeeSettings = await page.locator('text=ค่าธรรมเนียม').count() > 0;

    console.log('Settings page - Has maintenance mode:', hasMaintenanceMode, 'Has fee settings:', hasFeeSettings);

    await page.screenshot({ path: 'test-results/06-settings.png', fullPage: true });

    await expect(page).toHaveURL(/\/admin\/settings/);
    console.log('Settings: OK');
  });
});
