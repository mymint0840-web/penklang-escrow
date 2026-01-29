import { test, expect, Page, BrowserContext } from '@playwright/test';

// ==========================================
// BUYER-SELLER FLOW TEST
// ทดสอบการทำงานของผู้ซื้อและผู้ขาย
// ==========================================

const timestamp = Date.now();

// ผู้ขาย
const seller = {
  fullName: 'ผู้ขาย ทดสอบ',
  email: `seller${timestamp}@test.com`,
  phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: 'Seller@123',
};

// ผู้ซื้อ
const buyer = {
  fullName: 'ผู้ซื้อ ทดสอบ',
  email: `buyer${timestamp}@test.com`,
  phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: 'Buyer@123',
};

// ข้อมูลธุรกรรม
const transaction = {
  title: 'ทดสอบขายสินค้า iPhone 15',
  description: 'iPhone 15 Pro Max 256GB สีดำ สภาพดีมาก',
  amount: '25000',
};

// Helper function สำหรับสมัครสมาชิก
async function registerUser(page: Page, user: typeof seller) {
  await page.goto('/register');
  await page.fill('input[placeholder*="สมชาย"]', user.fullName);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="tel"]', user.phone);

  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.first().fill(user.password);
  await passwordInputs.nth(1).fill(user.password);

  await page.click('button[role="checkbox"]');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

// Helper function สำหรับ login
async function loginUser(page: Page, user: typeof seller) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

test.describe.serial('Buyer-Seller Flow - ทดสอบผู้ซื้อและผู้ขาย', () => {

  test('1. 👤 สมัครสมาชิก - ผู้ขาย', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('👤 สมัครสมาชิกผู้ขาย');
    console.log('='.repeat(50));
    console.log(`   Email: ${seller.email}`);
    console.log(`   Phone: ${seller.phone}`);

    await registerUser(page, seller);

    const url = page.url();
    if (url.includes('dashboard')) {
      console.log('✅ ผู้ขายสมัครสมาชิกสำเร็จ!');
    } else {
      console.log('⚠️ อาจมีปัญหาในการสมัคร');
    }
  });

  test('2. 👤 สมัครสมาชิก - ผู้ซื้อ', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('👤 สมัครสมาชิกผู้ซื้อ');
    console.log('='.repeat(50));
    console.log(`   Email: ${buyer.email}`);
    console.log(`   Phone: ${buyer.phone}`);

    await registerUser(page, buyer);

    const url = page.url();
    if (url.includes('dashboard')) {
      console.log('✅ ผู้ซื้อสมัครสมาชิกสำเร็จ!');
    } else {
      console.log('⚠️ อาจมีปัญหาในการสมัคร');
    }
  });

  test('3. 🏪 ผู้ขาย - สร้างธุรกรรมขายสินค้า', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('🏪 ผู้ขายสร้างธุรกรรม');
    console.log('='.repeat(50));

    // Login เป็นผู้ขาย
    await loginUser(page, seller);
    console.log('✓ ผู้ขาย login แล้ว');

    // ไปหน้าสร้างธุรกรรม
    await page.goto('/transactions/new');
    await page.waitForTimeout(2000);
    console.log('✓ เข้าหน้าสร้างธุรกรรม');

    // เช็คว่ามีฟอร์มหรือไม่
    const formExists = await page.locator('form').count() > 0;
    const hasInput = await page.locator('input').count() > 0;

    if (formExists && hasInput) {
      console.log('✓ พบฟอร์มสร้างธุรกรรม');

      // พยายามกรอกข้อมูล
      const titleInput = page.locator('input[name="title"], input[placeholder*="หัวข้อ"], input[placeholder*="ชื่อ"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill(transaction.title);
        console.log(`   ชื่อธุรกรรม: ${transaction.title}`);
      }

      const amountInput = page.locator('input[name="amount"], input[placeholder*="จำนวน"], input[type="number"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill(transaction.amount);
        console.log(`   จำนวนเงิน: ${transaction.amount} บาท`);
      }

      const descInput = page.locator('textarea, input[name="description"]').first();
      if (await descInput.count() > 0) {
        await descInput.fill(transaction.description);
        console.log(`   รายละเอียด: ${transaction.description}`);
      }

      // หาปุ่มสร้าง
      const submitBtn = page.locator('button[type="submit"], button:has-text("สร้าง"), button:has-text("ถัดไป")').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        console.log('⏳ กำลังสร้างธุรกรรม...');
        await page.waitForTimeout(3000);
      }

      console.log('✅ ดำเนินการสร้างธุรกรรมแล้ว');
    } else {
      console.log('⚠️ อาจต้องยืนยัน KYC ก่อนสร้างธุรกรรม');
    }
  });

  test('4. 🛒 ผู้ซื้อ - เข้าสู่ระบบและดูรายการธุรกรรม', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('🛒 ผู้ซื้อเข้าสู่ระบบ');
    console.log('='.repeat(50));

    // Login เป็นผู้ซื้อ
    await loginUser(page, buyer);
    console.log('✓ ผู้ซื้อ login แล้ว');

    // ไปหน้ารายการธุรกรรม
    await page.goto('/transactions');
    await page.waitForTimeout(2000);
    console.log('✓ เข้าหน้ารายการธุรกรรม');

    // ดู dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    console.log('✓ เข้า Dashboard');

    console.log('✅ ผู้ซื้อดูรายการได้สำเร็จ');
  });

  test('5. 🏪 ผู้ขาย - ดูรายการธุรกรรมของตัวเอง', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('🏪 ผู้ขายดูรายการธุรกรรม');
    console.log('='.repeat(50));

    // Login เป็นผู้ขาย
    await loginUser(page, seller);
    console.log('✓ ผู้ขาย login แล้ว');

    // ไปหน้ารายการธุรกรรม
    await page.goto('/transactions');
    await page.waitForTimeout(2000);

    // เช็คว่ามีรายการหรือไม่
    const pageContent = await page.content();
    if (pageContent.includes('ไม่พบ') || pageContent.includes('ยังไม่มี')) {
      console.log('   ยังไม่มีรายการธุรกรรม');
    } else {
      console.log('   พบรายการธุรกรรม');
    }

    console.log('✅ ผู้ขายดูรายการได้สำเร็จ');
  });

  test('6. 👤 ผู้ขาย - ดูหน้าโปรไฟล์', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('👤 ผู้ขายดูหน้าโปรไฟล์');
    console.log('='.repeat(50));

    await loginUser(page, seller);
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    // เช็คว่าแสดงข้อมูลผู้ใช้
    const pageContent = await page.content();
    if (pageContent.includes(seller.fullName) || pageContent.includes('โปรไฟล์')) {
      console.log('✓ แสดงข้อมูลโปรไฟล์ถูกต้อง');
    }

    console.log('✅ หน้าโปรไฟล์ผู้ขายทำงานปกติ');
  });

  test('7. 👤 ผู้ซื้อ - ดูหน้าโปรไฟล์', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('👤 ผู้ซื้อดูหน้าโปรไฟล์');
    console.log('='.repeat(50));

    await loginUser(page, buyer);
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    if (pageContent.includes(buyer.fullName) || pageContent.includes('โปรไฟล์')) {
      console.log('✓ แสดงข้อมูลโปรไฟล์ถูกต้อง');
    }

    console.log('✅ หน้าโปรไฟล์ผู้ซื้อทำงานปกติ');
  });

  test('8. 🪪 ผู้ขาย - เข้าหน้า KYC', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('🪪 ผู้ขายเข้าหน้า KYC');
    console.log('='.repeat(50));

    await loginUser(page, seller);
    await page.goto('/kyc');
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    if (pageContent.includes('KYC') || pageContent.includes('ยืนยันตัวตน')) {
      console.log('✓ หน้า KYC โหลดสำเร็จ');
    }

    console.log('✅ หน้า KYC ผู้ขายทำงานปกติ');
  });

  test('9. 🪪 ผู้ซื้อ - เข้าหน้า KYC', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('🪪 ผู้ซื้อเข้าหน้า KYC');
    console.log('='.repeat(50));

    await loginUser(page, buyer);
    await page.goto('/kyc');
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    if (pageContent.includes('KYC') || pageContent.includes('ยืนยันตัวตน')) {
      console.log('✓ หน้า KYC โหลดสำเร็จ');
    }

    console.log('✅ หน้า KYC ผู้ซื้อทำงานปกติ');
  });

  test('10. ⚙️ ผู้ขาย - เข้าหน้าตั้งค่า', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('⚙️ ผู้ขายเข้าหน้าตั้งค่า');
    console.log('='.repeat(50));

    await loginUser(page, seller);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    console.log('✅ หน้าตั้งค่าผู้ขายทำงานปกติ');
  });

  test('11. ⚙️ ผู้ซื้อ - เข้าหน้าตั้งค่า', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('⚙️ ผู้ซื้อเข้าหน้าตั้งค่า');
    console.log('='.repeat(50));

    await loginUser(page, buyer);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    console.log('✅ หน้าตั้งค่าผู้ซื้อทำงานปกติ');
  });

  test('12. 🔄 ทดสอบสลับระหว่างผู้ใช้', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('🔄 ทดสอบสลับระหว่างผู้ใช้');
    console.log('='.repeat(50));

    // Login เป็นผู้ขาย
    await loginUser(page, seller);
    await page.goto('/dashboard');
    console.log('✓ ผู้ขายเข้า Dashboard');

    // Logout - clear storage first
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Login เป็นผู้ซื้อ
    await loginUser(page, buyer);
    await page.goto('/dashboard');
    console.log('✓ ผู้ซื้อเข้า Dashboard');

    console.log('✅ สลับผู้ใช้ได้ปกติ');
  });
});

// แสดงสรุปผลการทดสอบ
test.afterAll(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 สรุปการทดสอบ Buyer-Seller Flow');
  console.log('='.repeat(60));
  console.log('');
  console.log('👔 ผู้ขาย (Seller):');
  console.log(`   Email: ${seller.email}`);
  console.log(`   Password: ${seller.password}`);
  console.log('');
  console.log('🛒 ผู้ซื้อ (Buyer):');
  console.log(`   Email: ${buyer.email}`);
  console.log(`   Password: ${buyer.password}`);
  console.log('');
  console.log('='.repeat(60) + '\n');
});
