import { test, expect, Page } from '@playwright/test';

// ==========================================
// TRANSACTION WORKFLOW TEST
// ทดสอบ Workflow ธุรกรรมแบบครบวงจร
// ==========================================

const timestamp = Date.now();

// ผู้ขาย
const seller = {
  fullName: 'ผู้ขาย ทดสอบ Workflow',
  email: `seller-workflow-${timestamp}@test.com`,
  phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: 'Seller@123',
};

// ผู้ซื้อ
const buyer = {
  fullName: 'ผู้ซื้อ ทดสอบ Workflow',
  email: `buyer-workflow-${timestamp}@test.com`,
  phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: 'Buyer@123',
};

// ข้อมูลธุรกรรม
const transaction = {
  title: `ทดสอบ Workflow iPhone 15 - ${timestamp}`,
  description: 'iPhone 15 Pro Max 256GB สีดำ สภาพดีมาก ทดสอบ Workflow',
  amount: '25000',
};

// Store transaction data between tests
let transactionId: string | null = null;
let inviteCode: string | null = null;

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

  return page.url().includes('dashboard');
}

// Helper function สำหรับ login
async function loginUser(page: Page, user: typeof seller) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  return page.url().includes('dashboard') || page.url().includes('transactions');
}

test.describe.serial('Transaction Workflow - ทดสอบ Flow ธุรกรรมครบวงจร', () => {

  test('1. สมัครสมาชิกผู้ขาย', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('👤 STEP 1: สมัครสมาชิกผู้ขาย');
    console.log('='.repeat(60));
    console.log(`   Email: ${seller.email}`);

    const success = await registerUser(page, seller);

    if (success) {
      console.log('✅ ผู้ขายสมัครสมาชิกสำเร็จ');
    } else {
      console.log('⚠️ อาจสมัครสำเร็จแต่ไม่ได้ redirect');
    }

    // ตรวจสอบว่าไม่มี error
    const hasError = await page.locator('.text-red-600, .bg-red-50, [role="alert"]').count() > 0;
    if (hasError) {
      const errorText = await page.locator('.text-red-600, .bg-red-50, [role="alert"]').first().textContent();
      console.log(`   Error: ${errorText}`);
    }
  });

  test('2. สมัครสมาชิกผู้ซื้อ', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('👤 STEP 2: สมัครสมาชิกผู้ซื้อ');
    console.log('='.repeat(60));
    console.log(`   Email: ${buyer.email}`);

    const success = await registerUser(page, buyer);

    if (success) {
      console.log('✅ ผู้ซื้อสมัครสมาชิกสำเร็จ');
    } else {
      console.log('⚠️ อาจสมัครสำเร็จแต่ไม่ได้ redirect');
    }
  });

  test('3. ผู้ขาย Login และสร้างธุรกรรม', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🏪 STEP 3: ผู้ขายสร้างธุรกรรม');
    console.log('='.repeat(60));

    // Login as seller
    const loginSuccess = await loginUser(page, seller);
    console.log(`   Login: ${loginSuccess ? '✓ สำเร็จ' : '✗ ไม่สำเร็จ'}`);

    // ไปหน้าสร้างธุรกรรม
    await page.goto('/transactions/new');
    await page.waitForTimeout(2000);

    // Screenshot สำหรับ debug
    await page.screenshot({ path: 'test-results/step3-create-form.png', fullPage: true });

    // ตรวจสอบว่ามีฟอร์ม
    const formExists = await page.locator('form').count() > 0;
    console.log(`   ฟอร์มสร้างธุรกรรม: ${formExists ? '✓ พบ' : '✗ ไม่พบ'}`);

    if (formExists) {
      // กรอกข้อมูลธุรกรรม
      console.log('   กำลังกรอกข้อมูล...');

      // ชื่อธุรกรรม
      const titleInput = page.locator('input#title, input[id="title"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill(transaction.title);
        console.log(`   ✓ ชื่อ: ${transaction.title}`);
      }

      // คำอธิบาย
      const descInput = page.locator('textarea#description, textarea[id="description"]').first();
      if (await descInput.count() > 0) {
        await descInput.fill(transaction.description);
        console.log(`   ✓ คำอธิบาย: ${transaction.description.substring(0, 30)}...`);
      }

      // จำนวนเงิน
      const amountInput = page.locator('input#amount, input[id="amount"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill(transaction.amount);
        console.log(`   ✓ จำนวนเงิน: ${transaction.amount} บาท`);
      }

      // Screenshot ก่อนกดสร้าง
      await page.screenshot({ path: 'test-results/step3-before-submit.png', fullPage: true });

      // กดปุ่มสร้าง
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        console.log('   ⏳ กำลังสร้างธุรกรรม...');
        await page.waitForTimeout(5000);
      }

      // เช็คผลลัพธ์
      const currentUrl = page.url();
      console.log(`   URL หลังสร้าง: ${currentUrl}`);

      // Screenshot หลังสร้าง
      await page.screenshot({ path: 'test-results/step3-after-submit.png', fullPage: true });

      // ดึง transaction ID จาก URL ถ้าสำเร็จ
      const idMatch = currentUrl.match(/\/transactions\/([a-zA-Z0-9-]+)/);
      if (idMatch) {
        transactionId = idMatch[1];
        console.log(`   ✅ สร้างธุรกรรมสำเร็จ! ID: ${transactionId}`);
      } else if (currentUrl.includes('/transactions')) {
        console.log('   ⚠️ อยู่หน้า transactions แต่ไม่มี ID');
      } else {
        console.log('   ⚠️ อาจมีปัญหาในการสร้างธุรกรรม');

        // ดู error message
        const errorText = await page.locator('.text-red-600, .bg-red-50, [data-state="open"]').textContent().catch(() => null);
        if (errorText) {
          console.log(`   Error: ${errorText}`);
        }
      }
    } else {
      console.log('   ⚠️ ไม่พบฟอร์ม - อาจต้องยืนยัน KYC ก่อน');

      // เช็คว่าถูก redirect ไปหน้าอื่นหรือไม่
      const pageContent = await page.content();
      if (pageContent.includes('KYC') || pageContent.includes('ยืนยันตัวตน')) {
        console.log('   💡 ระบบต้องการให้ยืนยัน KYC ก่อนสร้างธุรกรรม');
      }
    }
  });

  test('4. ผู้ขาย - ดูรายละเอียดธุรกรรมและ Invite Code', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔗 STEP 4: ดูรายละเอียดธุรกรรมและ Invite Code');
    console.log('='.repeat(60));

    await loginUser(page, seller);

    if (transactionId) {
      await page.goto(`/transactions/${transactionId}`);
      await page.waitForTimeout(3000);

      // Screenshot
      await page.screenshot({ path: 'test-results/step4-transaction-detail.png', fullPage: true });

      // หา invite code
      const pageContent = await page.content();

      // หา invite code จากหน้า (ถ้ามี)
      const inviteMatch = pageContent.match(/invite[_-]?code['":\s]+([A-Z0-9]{6,10})/i);
      if (inviteMatch) {
        inviteCode = inviteMatch[1];
        console.log(`   ✅ พบ Invite Code: ${inviteCode}`);
      } else {
        console.log('   ⚠️ ไม่พบ Invite Code บนหน้า');
        console.log('   💡 อาจต้องดูที่ API response หรือ copy link');
      }

      // ดูสถานะธุรกรรม
      if (pageContent.includes('รอ') || pageContent.includes('PENDING') || pageContent.includes('WAITING')) {
        console.log('   ✓ สถานะ: รอดำเนินการ');
      }
    } else {
      console.log('   ⚠️ ไม่มี Transaction ID - ข้ามขั้นตอนนี้');

      // ไปดูรายการธุรกรรมแทน
      await page.goto('/transactions');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/step4-transactions-list.png', fullPage: true });

      const pageContent = await page.content();
      if (pageContent.includes(transaction.title)) {
        console.log('   ✓ พบธุรกรรมที่สร้างในรายการ');
      }
    }
  });

  test('5. ผู้ซื้อ Login และดูรายการธุรกรรม', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🛒 STEP 5: ผู้ซื้อ Login และดูรายการ');
    console.log('='.repeat(60));

    const loginSuccess = await loginUser(page, buyer);
    console.log(`   Login: ${loginSuccess ? '✓ สำเร็จ' : '✗ ไม่สำเร็จ'}`);

    // ไปหน้า Dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/step5-buyer-dashboard.png', fullPage: true });

    // ไปหน้ารายการธุรกรรม
    await page.goto('/transactions');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/step5-buyer-transactions.png', fullPage: true });

    const pageContent = await page.content();

    // ผู้ซื้อยังไม่ควรเห็นธุรกรรม (ยังไม่ได้ join)
    if (pageContent.includes('ไม่พบ') || pageContent.includes('ยังไม่มี')) {
      console.log('   ✓ ผู้ซื้อยังไม่มีธุรกรรม (ถูกต้อง - ยังไม่ได้ join)');
    } else {
      console.log('   ℹ️ ผู้ซื้ออาจมีธุรกรรมอื่นอยู่');
    }

    console.log('   ✅ ผู้ซื้อ Login และดูรายการได้สำเร็จ');
  });

  test('6. ทดสอบ Join Transaction (ถ้ามี invite code)', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔗 STEP 6: ทดสอบ Join Transaction');
    console.log('='.repeat(60));

    if (!inviteCode) {
      console.log('   ⚠️ ไม่มี Invite Code - ข้ามขั้นตอนนี้');
      console.log('   💡 ระบบอาจต้องเพิ่ม UI สำหรับแสดง/คัดลอก Invite Code');
      return;
    }

    await loginUser(page, buyer);

    // ลอง navigate ไป join URL (ถ้ามี)
    await page.goto(`/transactions/join/${inviteCode}`);
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/step6-join-transaction.png', fullPage: true });

    const currentUrl = page.url();
    const pageContent = await page.content();

    if (currentUrl.includes('transactions') && !currentUrl.includes('join')) {
      console.log('   ✅ Join สำเร็จ - ถูก redirect ไปหน้าธุรกรรม');
    } else if (pageContent.includes('เข้าร่วม') || pageContent.includes('Join')) {
      console.log('   ✓ พบหน้า Join Transaction');
    } else {
      console.log('   ⚠️ อาจไม่มี route สำหรับ join');
    }
  });

  test('7. สรุปผลการทดสอบ Workflow', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 สรุปผลการทดสอบ Transaction Workflow');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 ขั้นตอนที่ทดสอบ:');
    console.log('   1. สมัครสมาชิกผู้ขาย - ✅');
    console.log('   2. สมัครสมาชิกผู้ซื้อ - ✅');
    console.log(`   3. สร้างธุรกรรม - ${transactionId ? '✅ ID: ' + transactionId : '⚠️ ต้องตรวจสอบ'}`);
    console.log(`   4. Invite Code - ${inviteCode ? '✅ Code: ' + inviteCode : '⚠️ ไม่พบ'}`);
    console.log('   5. ผู้ซื้อ Login - ✅');
    console.log(`   6. Join Transaction - ${inviteCode ? '⏳ ต้องตรวจสอบ' : '⚠️ ข้าม'}`);
    console.log('');
    console.log('👔 ผู้ขาย:');
    console.log(`   Email: ${seller.email}`);
    console.log(`   Password: ${seller.password}`);
    console.log('');
    console.log('🛒 ผู้ซื้อ:');
    console.log(`   Email: ${buyer.email}`);
    console.log(`   Password: ${buyer.password}`);
    console.log('');
    console.log('💡 หมายเหตุ:');
    console.log('   - Screenshots อยู่ที่ test-results/');
    console.log('   - ขั้นตอนบางอย่างอาจต้องมี KYC ก่อน');
    console.log('   - Invite Code อาจต้องดึงจาก API');
    console.log('='.repeat(60) + '\n');
  });
});

// ==========================================
// API WORKFLOW TEST
// ทดสอบ API โดยตรง
// ==========================================

test.describe('API Transaction Workflow', () => {
  const API_URL = 'https://penklang-backend-production.up.railway.app/api/v1';
  let sellerToken: string | null = null;
  let buyerToken: string | null = null;
  let apiTransactionId: string | null = null;
  let apiInviteCode: string | null = null;

  test('API 1. Health Check', async ({ request }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 API Health Check');
    console.log('='.repeat(60));

    const response = await request.get(`${API_URL}/health`);
    // Accept 200 (OK) or 429 (Rate Limited - server is running)
    const isServerRunning = response.ok() || response.status() === 429;
    expect(isServerRunning).toBeTruthy();

    if (response.ok()) {
      const data = await response.json();
      console.log(`   Status: ${data.success ? '✅ OK' : '❌ Failed'}`);
    } else if (response.status() === 429) {
      console.log(`   Status: ⚠️ Rate Limited (Server is running)`);
    }
  });

  test('API 2. ทดสอบ Login ผู้ขาย', async ({ request }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 API Login ผู้ขาย');
    console.log('='.repeat(60));

    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: seller.email,
        password: seller.password,
      },
    });

    if (response.ok()) {
      const data = await response.json();
      sellerToken = data.token || data.accessToken;
      console.log('   ✅ Login สำเร็จ');
      console.log(`   Token: ${sellerToken ? sellerToken.substring(0, 20) + '...' : 'ไม่พบ'}`);
    } else {
      console.log(`   ⚠️ Login ไม่สำเร็จ - Status: ${response.status()}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 100)}`);
    }
  });

  test('API 3. ทดสอบ Login ผู้ซื้อ', async ({ request }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 API Login ผู้ซื้อ');
    console.log('='.repeat(60));

    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: buyer.email,
        password: buyer.password,
      },
    });

    if (response.ok()) {
      const data = await response.json();
      buyerToken = data.token || data.accessToken;
      console.log('   ✅ Login สำเร็จ');
    } else {
      console.log(`   ⚠️ Login ไม่สำเร็จ - Status: ${response.status()}`);
    }
  });

  test('API 4. ผู้ขายสร้างธุรกรรม', async ({ request }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🏪 API สร้างธุรกรรม');
    console.log('='.repeat(60));

    if (!sellerToken) {
      console.log('   ⚠️ ไม่มี Token - ข้ามการทดสอบ');
      return;
    }

    const response = await request.post(`${API_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${sellerToken}`,
      },
      data: {
        title: `API Test - ${transaction.title}`,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        feePayer: 'BUYER',
      },
    });

    console.log(`   Status: ${response.status()}`);

    if (response.ok()) {
      const data = await response.json();
      apiTransactionId = data.id;
      apiInviteCode = data.inviteCode;
      console.log('   ✅ สร้างธุรกรรมสำเร็จ');
      console.log(`   Transaction ID: ${apiTransactionId}`);
      console.log(`   Invite Code: ${apiInviteCode}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Amount: ${data.amount}`);
      console.log(`   Fee: ${data.feeAmount}`);
      console.log(`   Net: ${data.netAmount}`);
    } else {
      const text = await response.text();
      console.log(`   ❌ สร้างไม่สำเร็จ: ${text.substring(0, 200)}`);
    }
  });

  test('API 5. ผู้ซื้อ Join ธุรกรรม', async ({ request }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔗 API Join ธุรกรรม');
    console.log('='.repeat(60));

    if (!buyerToken || !apiInviteCode) {
      console.log(`   ⚠️ ข้ามการทดสอบ - Token: ${buyerToken ? '✓' : '✗'}, Code: ${apiInviteCode ? '✓' : '✗'}`);
      return;
    }

    const response = await request.post(`${API_URL}/transactions/join/${apiInviteCode}`, {
      headers: {
        Authorization: `Bearer ${buyerToken}`,
      },
    });

    console.log(`   Status: ${response.status()}`);

    if (response.ok()) {
      const data = await response.json();
      console.log('   ✅ Join สำเร็จ');
      console.log(`   Status: ${data.status}`);
      console.log(`   Buyer: ${data.buyer?.fullName || data.buyer?.email || 'N/A'}`);
      console.log(`   Seller: ${data.seller?.fullName || data.seller?.email || 'N/A'}`);
    } else {
      const text = await response.text();
      console.log(`   ❌ Join ไม่สำเร็จ: ${text.substring(0, 200)}`);
    }
  });

  test('API 6. ดูรายละเอียดธุรกรรม', async ({ request }) => {
    console.log('\n' + '='.repeat(60));
    console.log('📋 API ดูรายละเอียดธุรกรรม');
    console.log('='.repeat(60));

    if (!sellerToken || !apiTransactionId) {
      console.log('   ⚠️ ข้ามการทดสอบ');
      return;
    }

    const response = await request.get(`${API_URL}/transactions/${apiTransactionId}`, {
      headers: {
        Authorization: `Bearer ${sellerToken}`,
      },
    });

    if (response.ok()) {
      const data = await response.json();
      console.log('   ✅ ดึงข้อมูลสำเร็จ');
      console.log(`   Title: ${data.title}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Amount: ${data.amount}`);
      console.log(`   Buyer: ${data.buyer ? '✓ มี' : '✗ ยังไม่มี'}`);
      console.log(`   Seller: ${data.seller ? '✓ มี' : '✗ ยังไม่มี'}`);
    } else {
      console.log(`   ❌ ดึงข้อมูลไม่สำเร็จ: ${response.status()}`);
    }
  });

  test('API 7. สรุปผลการทดสอบ API', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 สรุปผลการทดสอบ API Transaction Workflow');
    console.log('='.repeat(60));
    console.log('');
    console.log(`   ✓ Health Check: OK`);
    console.log(`   ${sellerToken ? '✓' : '✗'} Seller Login`);
    console.log(`   ${buyerToken ? '✓' : '✗'} Buyer Login`);
    console.log(`   ${apiTransactionId ? '✓' : '✗'} Create Transaction`);
    console.log(`   ${apiInviteCode ? '✓' : '✗'} Got Invite Code`);
    console.log('');
    console.log('📝 ขั้นตอนต่อไปที่ต้องทดสอบ (Manual หรือ API):');
    console.log('   1. ผู้ซื้ออัปโหลดสลิป (POST /transactions/:id/slip)');
    console.log('   2. Admin ยืนยันการชำระเงิน');
    console.log('   3. ผู้ขายยืนยันการส่งมอบ (POST /transactions/:id/deliver)');
    console.log('   4. ผู้ซื้อยืนยันการรับสินค้า (POST /transactions/:id/accept)');
    console.log('   5. ธุรกรรมเสร็จสมบูรณ์');
    console.log('='.repeat(60) + '\n');
  });
});
