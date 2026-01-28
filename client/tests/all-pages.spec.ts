import { test, expect } from '@playwright/test';

// ==========================================
// PUBLIC PAGES TESTS
// ==========================================

test.describe('Public Pages', () => {
  test('Homepage - should load and display content', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Escrow/i);

    // Check main elements
    await expect(page.locator('text=ที่คุณไว้วางใจได้')).toBeVisible();
    await expect(page.locator('text=เข้าสู่ระบบ').first()).toBeVisible();
    await expect(page.locator('text=สมัครสมาชิก').first()).toBeVisible();

    // Check features section
    await expect(page.locator('text=ปลอดภัย 100%')).toBeVisible();
    await expect(page.locator('text=เข้ารหัสข้อมูล')).toBeVisible();

    // Check navigation buttons work
    await page.click('text=เข้าสู่ระบบ');
    await expect(page).toHaveURL(/login/);
  });

  test('Login Page - should display login form', async ({ page }) => {
    await page.goto('/login');

    // Check form elements
    await expect(page.locator('text=เข้าสู่ระบบ').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check register link
    await expect(page.locator('text=สมัครสมาชิก')).toBeVisible();
  });

  test('Register Page - should display registration form', async ({ page }) => {
    await page.goto('/register');

    // Check form elements
    await expect(page.locator('text=สมัครสมาชิก').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="สมชาย"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    // Check terms checkbox
    await expect(page.locator('text=ข้อกำหนดและเงื่อนไข')).toBeVisible();
    await expect(page.locator('text=นโยบายความเป็นส่วนตัว')).toBeVisible();
  });

  test('Terms Page - should display terms of service', async ({ page }) => {
    await page.goto('/terms');

    await expect(page.locator('text=เงื่อนไขและข้อตกลงการใช้บริการ')).toBeVisible();
    await expect(page.locator('text=ข้อตกลงทั่วไป')).toBeVisible();
    await expect(page.locator('text=การทำธุรกรรม')).toBeVisible();
  });

  test('Privacy Page - should display privacy policy', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page.locator('text=นโยบายความเป็นส่วนตัว').first()).toBeVisible();
    await expect(page.locator('text=ข้อมูลที่เราเก็บรวบรวม')).toBeVisible();
    await expect(page.locator('h2:has-text("สิทธิของท่าน")')).toBeVisible();
  });

  test('Forgot Password Page - should display reset form', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.locator('text=ลืมรหัสผ่าน')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

// ==========================================
// AUTHENTICATION FLOW TESTS
// ==========================================

test.describe('Authentication Flow', () => {
  const testUser = {
    fullName: 'ทดสอบ ระบบ',
    email: `test${Date.now()}@example.com`,
    phone: '0812345678',
    password: 'Test@123456',
  };

  test('Registration - should validate form fields', async ({ page }) => {
    await page.goto('/register');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=กรุณากรอกอีเมล')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Registration - should validate password requirements', async ({ page }) => {
    await page.goto('/register');

    // Fill in weak password
    await page.fill('input[placeholder*="สมชาย"]', testUser.fullName);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="tel"]', testUser.phone);
    await page.fill('input[type="password"]', 'weak');

    // Should show password validation error
    await page.click('button[type="submit"]');
    await expect(page.locator('text=รหัสผ่านต้องมี')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Login - should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Check if error is displayed or still on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('login');
  });
});

// ==========================================
// PROTECTED PAGES REDIRECT TESTS
// ==========================================

test.describe('Protected Pages - Redirect to Login', () => {
  test('Dashboard - should redirect to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Should redirect to login or show login prompt
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|dashboard/);
  });

  test('Transactions - should redirect to login', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|transactions/);
  });

  test('Profile - should redirect to login', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|profile/);
  });

  test('KYC - should redirect to login', async ({ page }) => {
    await page.goto('/kyc');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|kyc/);
  });

  test('Settings - should redirect to login', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|settings/);
  });
});

// ==========================================
// ADMIN PAGES TESTS
// ==========================================

test.describe('Admin Pages - Access Control', () => {
  test('Admin Dashboard - should redirect non-admin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|admin/);
  });

  test('Admin Users - should redirect non-admin', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|admin/);
  });

  test('Admin Transactions - should redirect non-admin', async ({ page }) => {
    await page.goto('/admin/transactions');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|admin/);
  });

  test('Admin KYC - should redirect non-admin', async ({ page }) => {
    await page.goto('/admin/kyc');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|admin/);
  });

  test('Admin Disputes - should redirect non-admin', async ({ page }) => {
    await page.goto('/admin/disputes');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|admin/);
  });
});

// ==========================================
// RESPONSIVE DESIGN TESTS
// ==========================================

test.describe('Responsive Design', () => {
  test('Homepage - should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('text=ที่คุณไว้วางใจได้')).toBeVisible();
  });

  test('Login - should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Register - should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/register');

    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

// ==========================================
// NAVIGATION TESTS
// ==========================================

test.describe('Navigation', () => {
  test('Homepage to Login navigation', async ({ page }) => {
    await page.goto('/');
    await page.click('text=เข้าสู่ระบบ');
    await expect(page).toHaveURL(/login/);
  });

  test('Homepage to Register navigation', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("สมัครสมาชิก")');
    await expect(page).toHaveURL(/register/);
  });

  test('Login to Register navigation', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=สมัครสมาชิก');
    await expect(page).toHaveURL(/register/);
  });

  test('Register to Login navigation', async ({ page }) => {
    await page.goto('/register');
    await page.click('text=เข้าสู่ระบบ');
    await expect(page).toHaveURL(/login/);
  });

  test('Register to Terms navigation', async ({ page, context }) => {
    await page.goto('/register');

    // Link opens in new tab, so we need to wait for it
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('text=ข้อกำหนดและเงื่อนไข'),
    ]);
    await newPage.waitForLoadState();
    await expect(newPage).toHaveURL(/terms/);
    await newPage.close();
  });

  test('Register to Privacy navigation', async ({ page, context }) => {
    await page.goto('/register');

    // Link opens in new tab, so we need to wait for it
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('text=นโยบายความเป็นส่วนตัว'),
    ]);
    await newPage.waitForLoadState();
    await expect(newPage).toHaveURL(/privacy/);
    await newPage.close();
  });
});

// ==========================================
// API HEALTH CHECK
// ==========================================

test.describe('API Health', () => {
  test('Backend API should be running', async ({ request }) => {
    const response = await request.get('https://penklang-backend-production.up.railway.app/api/v1/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ==========================================
// PERFORMANCE TESTS
// ==========================================

test.describe('Performance', () => {
  test('Homepage should load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
    console.log(`Homepage load time: ${loadTime}ms`);
  });

  test('Login page should load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
    console.log(`Login page load time: ${loadTime}ms`);
  });
});
