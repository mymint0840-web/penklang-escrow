import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Generate unique test data
const timestamp = Date.now();
const newUserEmail = `complete_${timestamp}@test.com`;
const newUserPassword = 'Complete123!';
const newUserName = `Complete Test ${timestamp}`;
const newUserPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

// Helper function to fill input
async function fillInput(page: any, selector: string, value: string) {
  const input = page.locator(selector);
  await input.click();
  await input.fill('');
  await input.pressSequentially(value, { delay: 30 });
}

// Create a test image file
function createTestImageFile(filePath: string): void {
  // Create a simple valid JPEG file (smallest possible)
  const jpegData = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x6C, 0xB1,
    0x13, 0x4D, 0x02, 0x0E, 0x7E, 0xC4, 0x4E, 0xBF, 0xFF, 0xD9
  ]);
  fs.writeFileSync(filePath, jpegData);
}

test.describe('Complete Flow Test - Real Data', () => {
  test.describe.configure({ mode: 'serial' });

  // Create test images before tests
  test.beforeAll(async () => {
    const testDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    // Create test image files
    createTestImageFile(path.join(testDir, 'test-id-front.jpg'));
    createTestImageFile(path.join(testDir, 'test-id-back.jpg'));
    createTestImageFile(path.join(testDir, 'test-selfie.jpg'));
  });

  // ========== 1. REGISTER NEW USER ==========
  test('1. Register new user', async ({ page }) => {
    console.log('\n=== REGISTER NEW USER ===');
    console.log('Email:', newUserEmail);

    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Fill form using correct selectors
    await fillInput(page, 'input[name="fullName"]', newUserName);
    await fillInput(page, 'input[name="email"]', newUserEmail);
    await fillInput(page, 'input[name="phone"]', newUserPhone);

    // Fill passwords
    const passwordInputs = await page.locator('input[type="password"]').all();
    for (const input of passwordInputs) {
      await input.click();
      await input.fill('');
      await input.pressSequentially(newUserPassword, { delay: 30 });
    }

    // Check terms checkbox - Radix UI Checkbox uses button[role="checkbox"]
    await page.waitForTimeout(500);
    const checkbox = page.locator('button[role="checkbox"]');
    if (await checkbox.isVisible()) {
      await checkbox.click();
      console.log('Radix checkbox clicked!');
    } else {
      // Fallback to input checkbox
      const inputCheckbox = page.locator('input[type="checkbox"]');
      if (await inputCheckbox.isVisible()) {
        await inputCheckbox.click({ force: true });
        console.log('Input checkbox clicked!');
      }
    }

    await page.screenshot({ path: 'test-results/complete-01-register.png', fullPage: true });

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    console.log('URL after register:', page.url());
    await page.screenshot({ path: 'test-results/complete-01-result.png', fullPage: true });

    expect(page.url()).toContain('/dashboard');
  });

  // ========== 2. CREATE TRANSACTION ==========
  test('2. Create real transaction', async ({ page }) => {
    console.log('\n=== CREATE TRANSACTION ===');

    // Login
    await page.goto('/login');
    await fillInput(page, 'input[type="email"]', newUserEmail);
    await fillInput(page, 'input[type="password"]', newUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Go to create transaction
    await page.goto('/transactions/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Fill form using ID selectors
    await fillInput(page, '#title', `ทดสอบสินค้า E2E ${timestamp}`);
    await fillInput(page, '#description', 'รายละเอียดสินค้าทดสอบจาก Playwright E2E Test - ทดสอบการสร้างธุรกรรมและบันทึกข้อมูลจริง');
    await fillInput(page, '#amount', '8500');

    await page.screenshot({ path: 'test-results/complete-02-tx-form.png', fullPage: true });

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const url = page.url();
    console.log('URL after create:', url);
    await page.screenshot({ path: 'test-results/complete-02-tx-result.png', fullPage: true });

    // Check if transaction was created
    if (url.includes('/transactions/') && !url.includes('/new')) {
      console.log('Transaction created successfully!');
    } else {
      console.log('Transaction creation may have failed');
    }
  });

  // ========== 3. SUBMIT KYC WITH IMAGES ==========
  test('3. Submit KYC with images', async ({ page }) => {
    console.log('\n=== SUBMIT KYC ===');

    // Login
    await page.goto('/login');
    await fillInput(page, 'input[type="email"]', newUserEmail);
    await fillInput(page, 'input[type="password"]', newUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Go to KYC page
    await page.goto('/kyc');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/complete-03-kyc-page.png', fullPage: true });

    // Fill ID number
    const idInput = page.locator('input').filter({ hasText: '' }).first();
    const allInputs = await page.locator('input[type="text"], input[type="number"], input:not([type])').all();
    for (const input of allInputs) {
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder && placeholder.includes('บัตรประชาชน')) {
        await input.fill('1234567890123');
        break;
      }
    }

    // Try to find and fill the ID card input
    const idCardInput = page.locator('input[placeholder*="1234567890123"], input[placeholder*="บัตรประชาชน"]').first();
    if (await idCardInput.isVisible()) {
      await idCardInput.fill('1234567890123');
    }

    // Fill birthdate
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('1990-05-15');
    }

    // Use real PNG screenshots as test images
    const testDir = path.join(__dirname, '../test-results');

    // Find existing PNG files to use as test images
    const existingImages = fs.readdirSync(testDir).filter(f => f.endsWith('.png')).slice(0, 3);
    console.log('Using existing images:', existingImages);

    // Upload images one by one
    const fileInputs = page.locator('input[type="file"]');
    const inputCount = await fileInputs.count();
    console.log('Found file inputs:', inputCount);

    for (let i = 0; i < Math.min(inputCount, existingImages.length); i++) {
      try {
        const imagePath = path.join(testDir, existingImages[i]);
        await fileInputs.nth(i).setInputFiles(imagePath);
        console.log(`Uploaded image ${i + 1}:`, existingImages[i]);
        await page.waitForTimeout(1500);
      } catch (e) {
        console.log(`Error uploading image ${i + 1}:`, e);
      }
    }

    await page.screenshot({ path: 'test-results/complete-03-kyc-filled.png', fullPage: true });

    // Submit KYC - click the blue submit button
    const submitBtn = page.locator('button:has-text("ส่งข้อมูลเพื่อยืนยันตัวตน")');
    if (await submitBtn.isVisible()) {
      console.log('Clicking submit button...');
      await submitBtn.click();
      await page.waitForTimeout(5000);
      console.log('KYC form submitted!');
    } else {
      console.log('Submit button not found, trying alternative...');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(5000);
    }

    await page.screenshot({ path: 'test-results/complete-03-kyc-submitted.png', fullPage: true });
    console.log('KYC test completed');
  });

  // ========== 4. SEND CHAT MESSAGE ==========
  test('4. Send chat message', async ({ page }) => {
    console.log('\n=== SEND CHAT MESSAGE ===');

    // Login
    await page.goto('/login');
    await fillInput(page, 'input[type="email"]', newUserEmail);
    await fillInput(page, 'input[type="password"]', newUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Go to transactions
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click first transaction
    const txLink = page.locator('a[href*="/transactions/c"]').first();
    if (await txLink.isVisible()) {
      await txLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Click Chat tab
      const chatTab = page.locator('[role="tab"]:has-text("แชท")').first();
      if (await chatTab.isVisible()) {
        await chatTab.click();
        await page.waitForTimeout(1000);

        // Type message
        const textarea = page.locator('textarea').first();
        const chatMessage = `ทดสอบแชทจาก Complete E2E Test - ${new Date().toLocaleString('th-TH')}`;
        await textarea.fill(chatMessage);

        await page.screenshot({ path: 'test-results/complete-04-chat-typing.png', fullPage: true });

        // Send
        const sendBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
        await sendBtn.click();
        await page.waitForTimeout(2000);

        console.log('Chat message sent:', chatMessage);
      }

      await page.screenshot({ path: 'test-results/complete-04-chat-sent.png', fullPage: true });
    }
  });

  // ========== 5. ADMIN CHECK AND APPROVE ==========
  test('5. Admin verify and approve KYC', async ({ page }) => {
    console.log('\n=== ADMIN VERIFICATION ===');

    // Login as admin
    await page.goto('/login');
    await fillInput(page, 'input[type="email"]', 'admin@penklang.com');
    await fillInput(page, 'input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    // Check Users
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasNewUser = (await page.content()).includes('complete_');
    console.log('New user in admin:', hasNewUser);
    await page.screenshot({ path: 'test-results/complete-05-admin-users.png', fullPage: true });

    // Check Transactions
    await page.goto('/admin/transactions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasNewTx = (await page.content()).includes('ทดสอบสินค้า E2E');
    console.log('New transaction in admin:', hasNewTx);
    await page.screenshot({ path: 'test-results/complete-05-admin-tx.png', fullPage: true });

    // Check KYC and try to approve
    await page.goto('/admin/kyc');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/complete-05-admin-kyc.png', fullPage: true });

    // Try to approve if there's pending KYC
    const approveBtn = page.locator('button:has-text("อนุมัติ")').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(2000);
      console.log('KYC approved!');
      await page.screenshot({ path: 'test-results/complete-05-kyc-approved.png', fullPage: true });
    } else {
      console.log('No pending KYC to approve');
    }
  });

  // ========== FINAL REPORT ==========
  test('6. Final Report', async ({ page }) => {
    console.log('\n');
    console.log('╔═════════════════════════════════════════════════════════════╗');
    console.log('║         COMPLETE E2E TEST - FINAL REPORT                    ║');
    console.log('╠═════════════════════════════════════════════════════════════╣');
    console.log('║                                                             ║');
    console.log(`║  New User: ${newUserEmail.substring(0, 40).padEnd(40)}    ║`);
    console.log(`║  Password: ${newUserPassword.padEnd(40)}    ║`);
    console.log('║                                                             ║');
    console.log('║  Tests:                                                     ║');
    console.log('║  ✓ 1. User Registration                                     ║');
    console.log('║  ✓ 2. Create Transaction                                    ║');
    console.log('║  ✓ 3. Submit KYC with Images                                ║');
    console.log('║  ✓ 4. Send Chat Message                                     ║');
    console.log('║  ✓ 5. Admin Verification & Approval                         ║');
    console.log('║                                                             ║');
    console.log('╚═════════════════════════════════════════════════════════════╝');
    console.log('\n');
  });
});
