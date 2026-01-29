import { test, expect } from '@playwright/test';

test.describe('Admin Login Flow', () => {
  test('Admin should be redirected to /admin after login', async ({ page }) => {
    // Go to login page
    await page.goto('https://penklang.vercel.app/login');

    console.log('=== Starting Admin Login Test ===');

    // Fill in admin credentials
    await page.fill('input[type="email"]', 'admin@penklang.com');
    await page.fill('input[type="password"]', 'admin123');

    console.log('Filled credentials');

    // Click login button
    await page.click('button[type="submit"]');

    console.log('Clicked login button');

    // Wait for navigation
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });

    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Check cookies
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find(c => c.name === 'token');
    console.log('Token cookie exists:', !!tokenCookie);

    // Check localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const user = await page.evaluate(() => localStorage.getItem('user'));
    console.log('Token in localStorage:', token ? 'exists' : 'missing');
    console.log('User in localStorage:', user);

    // The admin should be redirected to /admin
    expect(currentUrl).toContain('/admin');
  });

  test('Check what happens when navigating directly to /admin with token', async ({ page }) => {
    // First login to get the token
    await page.goto('https://penklang.vercel.app/login');

    await page.fill('input[type="email"]', 'admin@penklang.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for any navigation
    await page.waitForTimeout(3000);

    const urlAfterLogin = page.url();
    console.log('URL after login:', urlAfterLogin);

    // Now try to go to /admin directly
    await page.goto('https://penklang.vercel.app/admin');
    await page.waitForTimeout(2000);

    const urlAfterAdmin = page.url();
    console.log('URL after navigating to /admin:', urlAfterAdmin);

    // Check if we're on admin or got redirected
    if (urlAfterAdmin.includes('/admin')) {
      console.log('SUCCESS: Admin page accessible');
    } else if (urlAfterAdmin.includes('/dashboard')) {
      console.log('FAIL: Redirected to dashboard');
    } else if (urlAfterAdmin.includes('/login')) {
      console.log('FAIL: Redirected to login');
    }
  });
});
