# TEST_PLAN.md - Penklang Escrow Platform

แผนการทดสอบครบทุกฟังก์ชัน ทุกเมนู ทุกปุ่มที่กดได้

## สรุป Codebase

### Server (Backend)
- **Controllers**: 5 ไฟล์ (Auth, Admin, Transaction, Dispute, Message)
- **Services**: 7 ไฟล์ (Auth, Admin, Transaction, Dispute, Message, Socket, Fee)
- **Routes**: 6 ไฟล์ พร้อม ~55+ endpoints
- **Middlewares**: 3 ไฟล์ (Auth, Validate, ErrorHandler)

### Client (Frontend)
- **Pages**: 20+ หน้า
- **Components**: 15+ components
- **Stores**: 2 stores (Auth, Transaction)
- **Hooks**: 3 hooks (useAuth, useSocket, useToast)

---

## 1. PUBLIC PAGES (หน้าสาธารณะ)

### 1.1 Homepage `/`
| Item | Type | Test |
|------|------|------|
| Hero Section | Display | [ ] แสดง title "Escrow Platform" |
| ปุ่ม "เริ่มต้นใช้งาน" | Button | [ ] คลิกแล้วไปหน้า Register |
| ปุ่ม "เรียนรู้เพิ่มเติม" | Button | [ ] scroll ไป Features section |
| Features Section | Display | [ ] แสดง 4 features (Security, Encryption, Real-time, 24/7) |
| How It Works | Display | [ ] แสดง 3 steps |
| Navigation - Login | Link | [ ] คลิกแล้วไปหน้า /login |
| Navigation - Register | Link | [ ] คลิกแล้วไปหน้า /register |
| Footer | Display | [ ] แสดงข้อมูล platform |

### 1.2 Login Page `/login`
| Item | Type | Test |
|------|------|------|
| Email input | Input | [ ] กรอกได้และ validate format |
| Password input | Input | [ ] กรอกได้และซ่อน password |
| ปุ่ม Login | Button | [ ] คลิกแล้ว submit form |
| Error message | Display | [ ] แสดงเมื่อ login ผิด |
| Loading state | Display | [ ] แสดง spinner ตอนกำลัง submit |
| Link "สมัครสมาชิก" | Link | [ ] ไปหน้า /register |
| Link "ลืมรหัสผ่าน" | Link | [ ] ไปหน้า /forgot-password |
| Validation - empty email | Error | [ ] แสดง error ถ้าไม่กรอก |
| Validation - invalid email | Error | [ ] แสดง error ถ้า format ผิด |
| Validation - empty password | Error | [ ] แสดง error ถ้าไม่กรอก |
| Login success (USER) | Redirect | [ ] redirect ไป /dashboard |
| Login success (ADMIN) | Redirect | [ ] redirect ไป /admin |

### 1.3 Register Page `/register`
| Item | Type | Test |
|------|------|------|
| Full Name input | Input | [ ] กรอกได้ 2-100 ตัวอักษร |
| Email input | Input | [ ] กรอกได้และ validate format |
| Phone input | Input | [ ] กรอกได้ 10+ หลัก ตัวเลขเท่านั้น |
| Password input | Input | [ ] กรอกได้และซ่อน password |
| Confirm Password input | Input | [ ] ต้องตรงกับ password |
| Checkbox ยอมรับเงื่อนไข | Checkbox | [ ] คลิกเพื่อยอมรับ |
| Link "ข้อตกลง" | Link | [ ] เปิดหน้า /terms ในแท็บใหม่ |
| Link "นโยบายความเป็นส่วนตัว" | Link | [ ] เปิดหน้า /privacy ในแท็บใหม่ |
| ปุ่ม สมัครสมาชิก | Button | [ ] submit form |
| Loading state | Display | [ ] แสดง spinner |
| Validation - weak password | Error | [ ] ต้องมี uppercase, lowercase, number, special char |
| Validation - password mismatch | Error | [ ] แสดง error ถ้าไม่ตรงกัน |
| Validation - terms not accepted | Error | [ ] ต้องยอมรับเงื่อนไข |
| Register success | Redirect | [ ] redirect ไป /dashboard |
| Link "เข้าสู่ระบบ" | Link | [ ] ไปหน้า /login |

### 1.4 Forgot Password `/forgot-password`
| Item | Type | Test |
|------|------|------|
| Email input | Input | [ ] กรอก email |
| ปุ่ม ส่งลิงก์รีเซ็ต | Button | [ ] submit form |
| Loading state | Display | [ ] แสดง spinner |
| Success message | Display | [ ] แสดงข้อความสำเร็จและ checkmark |
| ปุ่ม ส่งอีกครั้ง | Button | [ ] ส่งอีเมลอีกรอบ |
| ปุ่ม กลับไปเข้าสู่ระบบ | Button | [ ] ไปหน้า /login |

### 1.5 Terms Page `/terms`
| Item | Type | Test |
|------|------|------|
| Content | Display | [ ] แสดงเงื่อนไข 10 sections |
| ปุ่ม Back | Button | [ ] กลับหน้าก่อนหน้า |
| Link Privacy Policy | Link | [ ] ไปหน้า /privacy |

### 1.6 Privacy Page `/privacy`
| Item | Type | Test |
|------|------|------|
| Content | Display | [ ] แสดงนโยบาย 10 sections |
| ปุ่ม Back | Button | [ ] กลับหน้าก่อนหน้า |

---

## 2. DASHBOARD PAGES (หน้าผู้ใช้งาน)

### 2.1 Dashboard Layout
| Item | Type | Test |
|------|------|------|
| Sidebar - Desktop | Display | [ ] แสดง navigation menu |
| Sidebar - Mobile | Display | [ ] hamburger menu ทำงาน |
| Link หน้าแรก | Link | [ ] ไป /dashboard |
| Link รายการธุรกรรม | Link | [ ] ไป /transactions |
| Link สร้างธุรกรรม | Link | [ ] ไป /transactions/new |
| Link โปรไฟล์ | Link | [ ] ไป /profile |
| Link ตั้งค่า | Link | [ ] ไป /settings |
| User Avatar Dropdown | Dropdown | [ ] เปิด dropdown |
| ปุ่ม Logout | Button | [ ] logout และไป /login |
| Active state | Display | [ ] highlight หน้าปัจจุบัน |

### 2.2 Dashboard Home `/dashboard`
| Item | Type | Test |
|------|------|------|
| Stats Card - รอดำเนินการ | Display | [ ] แสดงจำนวน pending |
| Stats Card - ชำระแล้ว | Display | [ ] แสดงจำนวน funded |
| Stats Card - สำเร็จ | Display | [ ] แสดงจำนวน completed |
| Stats Card - รายได้ | Display | [ ] แสดงยอดรวม |
| Recent Transactions | Table | [ ] แสดง 5 รายการล่าสุด |
| ปุ่ม "ดูรายละเอียด" | Button | [ ] ไปหน้า transaction detail |
| ปุ่ม "สร้างธุรกรรมใหม่" | Button | [ ] ไปหน้า /transactions/new |
| Empty state | Display | [ ] แสดงเมื่อไม่มี transactions |

### 2.3 Transactions List `/transactions`
| Item | Type | Test |
|------|------|------|
| Search input | Input | [ ] ค้นหาตาม title/description |
| Status filter dropdown | Select | [ ] filter ตาม status |
| Transaction rows | Display | [ ] แสดง role, amount, status, date |
| Badge - Buyer/Seller | Badge | [ ] แสดง role ถูกต้อง |
| Badge - Status | Badge | [ ] แสดง status ถูกต้อง |
| ปุ่ม "ดูรายละเอียด" | Link | [ ] ไปหน้า transaction detail |
| Empty state | Display | [ ] แสดงเมื่อไม่มี transactions |
| ปุ่ม "สร้างธุรกรรมแรก" | Button | [ ] ไปหน้า /transactions/new |

### 2.4 Create Transaction `/transactions/new`
| Item | Type | Test |
|------|------|------|
| Title input | Input | [ ] กรอก required |
| Description textarea | Textarea | [ ] กรอก optional |
| Amount input | Input | [ ] กรอกตัวเลข positive |
| Fee Payer select | Select | [ ] เลือก BUYER/SELLER/SPLIT |
| Fee Calculator | Display | [ ] คำนวณ real-time 3% |
| ปุ่ม ยกเลิก | Button | [ ] กลับหน้าก่อนหน้า |
| ปุ่ม สร้างธุรกรรม | Button | [ ] submit และไป transaction detail |
| Validation - empty title | Error | [ ] แสดง error |
| Validation - invalid amount | Error | [ ] แสดง error |
| Success toast | Toast | [ ] แสดงเมื่อสร้างสำเร็จ |

### 2.5 Transaction Detail `/transactions/[id]`
| Item | Type | Test |
|------|------|------|
| Transaction info card | Display | [ ] แสดง buyer, seller, amounts |
| Tab - Timeline | Tab | [ ] สลับไป timeline |
| Tab - Chat | Tab | [ ] สลับไป chat |
| Messages list | Display | [ ] แสดง messages |
| Message input | Textarea | [ ] พิมพ์ข้อความ |
| ปุ่ม Send | Button | [ ] ส่งข้อความ |
| Enter to send | Keyboard | [ ] Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่ |
| Invite code display | Display | [ ] แสดงเมื่อไม่มี buyer |
| ปุ่ม Copy code | Button | [ ] copy invite code |
| ปุ่ม Copy link | Button | [ ] copy invite link |
| ปุ่ม Deliver (seller) | Button | [ ] confirm delivery |
| ปุ่ม Accept (buyer) | Button | [ ] accept และ complete |
| ปุ่ม Dispute | Button | [ ] open dispute |
| ปุ่ม Cancel | Button | [ ] cancel transaction |
| Confirmation dialog | Dialog | [ ] แสดงก่อน action |
| Status badge | Badge | [ ] แสดง status ปัจจุบัน |
| Real-time updates | Socket | [ ] รับ updates ทันที |

### 2.6 Join Transaction `/transactions/join/[inviteCode]`
| Item | Type | Test |
|------|------|------|
| Invite code display | Display | [ ] แสดง code |
| Transaction preview | Display | [ ] แสดงข้อมูล transaction |
| Benefits list | Display | [ ] แสดง 3 benefits |
| ปุ่ม Join | Button | [ ] join และไป transaction detail |
| ปุ่ม Cancel | Button | [ ] กลับหน้าก่อนหน้า |
| Loading state | Display | [ ] แสดง spinner |
| Error display | Alert | [ ] แสดง error ถ้ามี |
| Auto redirect | Redirect | [ ] ไป detail หลังจาก 2 วินาที |
| Redirect to login | Redirect | [ ] ไป login ถ้าไม่ได้ auth |

### 2.7 Profile Page `/profile`
| Item | Type | Test |
|------|------|------|
| First Name display/edit | Input | [ ] ดู/แก้ไข |
| Last Name display/edit | Input | [ ] ดู/แก้ไข |
| Email display | Display | [ ] แสดง (read-only) |
| Phone display/edit | Input | [ ] ดู/แก้ไข |
| ปุ่ม Edit (Personal) | Button | [ ] เปิด edit mode |
| ปุ่ม Save (Personal) | Button | [ ] บันทึกข้อมูล |
| ปุ่ม Cancel (Personal) | Button | [ ] ยกเลิก edit |
| Bank Name dropdown | Select | [ ] เลือกธนาคาร |
| Bank Account No | Input | [ ] กรอกเลขบัญชี |
| Bank Account Name | Input | [ ] กรอกชื่อบัญชี |
| ปุ่ม Edit (Bank) | Button | [ ] เปิด edit mode |
| ปุ่ม Save (Bank) | Button | [ ] บันทึกข้อมูล |
| KYC Status badge | Badge | [ ] แสดง status |
| ปุ่ม ยืนยันตัวตน | Button | [ ] ไปหน้า /kyc |
| Current password input | Input | [ ] กรอก password ปัจจุบัน |
| New password input | Input | [ ] กรอก password ใหม่ |
| Confirm password input | Input | [ ] ยืนยัน password |
| ปุ่ม เปลี่ยนรหัสผ่าน | Button | [ ] submit change password |

### 2.8 KYC Page `/kyc`
| Item | Type | Test |
|------|------|------|
| Status display | Display | [ ] แสดง status ปัจจุบัน |
| ID Card Number input | Input | [ ] กรอก 13 หลัก |
| Date of Birth input | Input | [ ] เลือกวันเกิด |
| ID Card Front upload | FileUpload | [ ] อัปโหลดรูป |
| ID Card Back upload | FileUpload | [ ] อัปโหลดรูป |
| Selfie upload | FileUpload | [ ] อัปโหลดรูป |
| Drag and drop | DnD | [ ] ลากไฟล์ได้ |
| File size validation | Validation | [ ] จำกัด 5MB |
| Preview image | Display | [ ] แสดง preview |
| ปุ่ม Delete image | Button | [ ] ลบรูป |
| ปุ่ม Submit | Button | [ ] ส่ง KYC |
| ปุ่ม Cancel | Button | [ ] ยกเลิก |
| Rejection reason | Display | [ ] แสดงเหตุผลถ้าถูก reject |
| Timeline | Display | [ ] แสดง submission/review dates |

### 2.9 Settings Page `/settings`
| Item | Type | Test |
|------|------|------|
| Toggle Email notifications | Toggle | [ ] เปิด/ปิด |
| Toggle SMS notifications | Toggle | [ ] เปิด/ปิด |
| Toggle Transaction updates | Toggle | [ ] เปิด/ปิด |
| Toggle Message alerts | Toggle | [ ] เปิด/ปิด |
| Toggle Marketing emails | Toggle | [ ] เปิด/ปิด |
| Radio Thai | Radio | [ ] เลือกภาษาไทย |
| Radio English | Radio | [ ] เลือกภาษาอังกฤษ |
| ปุ่ม Save Settings | Button | [ ] บันทึกการตั้งค่า |
| ปุ่ม Delete Account | Button | [ ] เปิด confirmation |
| Confirmation modal | Dialog | [ ] แสดง warning |
| Password verification | Input | [ ] ใส่ password ยืนยัน |
| ปุ่ม Confirm Delete | Button | [ ] ลบบัญชี |

---

## 3. ADMIN PAGES (หน้าผู้ดูแลระบบ)

### 3.1 Admin Layout
| Item | Type | Test |
|------|------|------|
| Sidebar Navigation | Display | [ ] แสดง menu items |
| Link Dashboard | Link | [ ] ไป /admin |
| Link Users | Link | [ ] ไป /admin/users |
| Link KYC | Link | [ ] ไป /admin/kyc |
| Link Transactions | Link | [ ] ไป /admin/transactions |
| Link Disputes | Link | [ ] ไป /admin/disputes |
| Link Settings | Link | [ ] ไป /admin/settings |
| Role check | Access | [ ] block ถ้าไม่ใช่ ADMIN |
| ปุ่ม Logout | Button | [ ] logout |

### 3.2 Admin Dashboard `/admin`
| Item | Type | Test |
|------|------|------|
| Stats - Total Users | Card | [ ] แสดงจำนวน users |
| Stats - Today Transactions | Card | [ ] แสดงจำนวน transactions วันนี้ |
| Stats - Pending KYC | Card | [ ] แสดงจำนวน pending KYC |
| Stats - Open Disputes | Card | [ ] แสดงจำนวน disputes |
| Recent Activity | List | [ ] แสดง 6 กิจกรรมล่าสุด |
| Activity badges | Badge | [ ] แสดง type ถูกต้อง |
| Transaction volume | Card | [ ] แสดงยอดรวม |
| Success rate | Card | [ ] แสดง % สำเร็จ |

### 3.3 Admin Users `/admin/users`
| Item | Type | Test |
|------|------|------|
| Search input | Input | [ ] ค้นหา users |
| Status filter | Select | [ ] filter by status |
| Role filter | Select | [ ] filter by role |
| Users table | Table | [ ] แสดงรายชื่อ users |
| ปุ่ม View | Button | [ ] ดูรายละเอียด user |
| ปุ่ม Ban/Unban | Button | [ ] เปลี่ยน status user |
| Pagination | Pagination | [ ] เปลี่ยนหน้า |
| User detail modal | Modal | [ ] แสดงรายละเอียด |

### 3.4 Admin KYC `/admin/kyc`
| Item | Type | Test |
|------|------|------|
| Pending list | Table | [ ] แสดง KYC รอตรวจ |
| Document images | Images | [ ] ดูรูปเอกสาร |
| User info | Display | [ ] แสดงข้อมูล user |
| ปุ่ม Approve | Button | [ ] อนุมัติ KYC |
| ปุ่ม Reject | Button | [ ] ปฏิเสธ KYC |
| Rejection reason input | Textarea | [ ] ใส่เหตุผล |
| Confirmation dialog | Dialog | [ ] ยืนยันก่อน action |

### 3.5 Admin Transactions `/admin/transactions`
| Item | Type | Test |
|------|------|------|
| Search input | Input | [ ] ค้นหา transactions |
| Status filter | Select | [ ] filter by status |
| Date filter | DatePicker | [ ] filter by date |
| Transactions table | Table | [ ] แสดงรายการ |
| ปุ่ม View | Button | [ ] ดูรายละเอียด |
| Transaction detail modal | Modal | [ ] แสดงรายละเอียด |
| Payment slip | Image | [ ] ดูสลิปโอนเงิน |
| ปุ่ม Verify Payment | Button | [ ] verify payment |
| ปุ่ม Reject Payment | Button | [ ] reject payment |
| Pagination | Pagination | [ ] เปลี่ยนหน้า |

### 3.6 Admin Disputes `/admin/disputes`
| Item | Type | Test |
|------|------|------|
| Disputes list | Table | [ ] แสดง disputes |
| Status filter | Select | [ ] filter by status |
| ปุ่ม View | Button | [ ] ดูรายละเอียด dispute |
| Dispute detail modal | Modal | [ ] แสดงรายละเอียด |
| Evidence images | Images | [ ] ดูหลักฐาน |
| ปุ่ม Refund Buyer | Button | [ ] คืนเงินให้ buyer |
| ปุ่ม Release Seller | Button | [ ] ปล่อยเงินให้ seller |
| Resolution note | Textarea | [ ] ใส่หมายเหตุ |
| Confirmation dialog | Dialog | [ ] ยืนยันก่อน action |

### 3.7 Admin Settings `/admin/settings`
| Item | Type | Test |
|------|------|------|
| Fee Percent input | Input | [ ] ตั้งค่า % ค่าธรรมเนียม |
| Min Fee input | Input | [ ] ตั้งค่าค่าธรรมเนียมขั้นต่ำ |
| Max Fee input | Input | [ ] ตั้งค่าค่าธรรมเนียมสูงสุด |
| Payment Timeout | Input | [ ] ตั้งค่า timeout ชั่วโมง |
| Auto Release Hours | Input | [ ] ตั้งค่า auto release |
| Min Transaction Amount | Input | [ ] จำนวนขั้นต่ำ |
| Max Transaction Amount | Input | [ ] จำนวนสูงสุด |
| Bank Name input | Input | [ ] ชื่อธนาคาร platform |
| Bank Account No | Input | [ ] เลขบัญชี platform |
| Bank Account Name | Input | [ ] ชื่อบัญชี platform |
| Toggle Maintenance Mode | Toggle | [ ] เปิด/ปิด maintenance |
| ปุ่ม Save | Button | [ ] บันทึกการตั้งค่า |

---

## 4. API ENDPOINTS ที่ต้องทดสอบ

### 4.1 Auth APIs
| Endpoint | Method | Test |
|----------|--------|------|
| `/api/v1/auth/register` | POST | [ ] สมัครสมาชิกใหม่ |
| `/api/v1/auth/login` | POST | [ ] เข้าสู่ระบบ |
| `/api/v1/auth/logout` | POST | [ ] ออกจากระบบ |
| `/api/v1/auth/refresh-token` | POST | [ ] refresh token |
| `/api/v1/auth/verify-email` | POST | [ ] verify email |
| `/api/v1/auth/forgot-password` | POST | [ ] ขอ reset password |
| `/api/v1/auth/reset-password` | POST | [ ] reset password |
| `/api/v1/auth/me` | GET | [ ] get current user |
| `/api/v1/auth/change-password` | POST | [ ] เปลี่ยน password |

### 4.2 Transaction APIs
| Endpoint | Method | Test |
|----------|--------|------|
| `/api/v1/transactions` | GET | [ ] list transactions |
| `/api/v1/transactions` | POST | [ ] create transaction |
| `/api/v1/transactions/:id` | GET | [ ] get transaction |
| `/api/v1/transactions/join/:code` | POST | [ ] join transaction |
| `/api/v1/transactions/:id/slip` | POST | [ ] upload slip |
| `/api/v1/transactions/:id/deliver` | POST | [ ] confirm delivery |
| `/api/v1/transactions/:id/accept` | POST | [ ] accept delivery |
| `/api/v1/transactions/:id/cancel` | POST | [ ] cancel transaction |

### 4.3 Dispute APIs
| Endpoint | Method | Test |
|----------|--------|------|
| `/api/v1/transactions/:id/dispute` | POST | [ ] create dispute |
| `/api/v1/transactions/:id/dispute` | GET | [ ] get disputes |
| `/api/v1/disputes/:id` | GET | [ ] get dispute detail |

### 4.4 Admin APIs
| Endpoint | Method | Test |
|----------|--------|------|
| `/api/v1/admin/dashboard/stats` | GET | [ ] get stats |
| `/api/v1/admin/dashboard/activity` | GET | [ ] get activity |
| `/api/v1/admin/users` | GET | [ ] list users |
| `/api/v1/admin/users/:id` | GET | [ ] get user |
| `/api/v1/admin/users/:id/status` | PATCH | [ ] update user status |
| `/api/v1/admin/kyc/pending` | GET | [ ] list pending KYC |
| `/api/v1/admin/kyc/:id/review` | POST | [ ] review KYC |
| `/api/v1/admin/transactions` | GET | [ ] list transactions |
| `/api/v1/admin/transactions/:id` | GET | [ ] get transaction |
| `/api/v1/admin/transactions/:id/verify-payment` | POST | [ ] verify payment |
| `/api/v1/admin/disputes` | GET | [ ] list disputes |
| `/api/v1/admin/disputes/:id/resolve` | POST | [ ] resolve dispute |
| `/api/v1/admin/config` | GET | [ ] get config |
| `/api/v1/admin/config` | PATCH | [ ] update config |

---

## 5. REAL-TIME FEATURES (Socket.IO)

| Feature | Test |
|---------|------|
| Connect with token | [ ] เชื่อมต่อสำเร็จ |
| Join transaction room | [ ] join room สำเร็จ |
| Leave transaction room | [ ] leave room สำเร็จ |
| Send message | [ ] ส่งข้อความสำเร็จ |
| Receive message | [ ] รับข้อความ real-time |
| Typing indicator | [ ] แสดง typing |
| Transaction status update | [ ] รับ status update |
| User online/offline | [ ] แสดง online status |

---

## 6. TRANSACTION WORKFLOW (Complete Flow)

### 6.1 Seller Flow
| Step | Test |
|------|------|
| 1. สร้าง Transaction | [ ] สร้างสำเร็จ ได้ invite code |
| 2. แชร์ Invite Code | [ ] copy code/link ได้ |
| 3. รอ Buyer join | [ ] status = WAITING_PAYMENT |
| 4. Buyer ชำระเงิน | [ ] รับ notification |
| 5. Admin verify | [ ] status = PAID_HOLDING |
| 6. Confirm Delivery | [ ] status = DELIVERED_PENDING |
| 7. Buyer accept | [ ] status = COMPLETED |

### 6.2 Buyer Flow
| Step | Test |
|------|------|
| 1. ได้รับ Invite Code | [ ] เข้าหน้า join |
| 2. Join Transaction | [ ] join สำเร็จ |
| 3. Upload Payment Slip | [ ] อัปโหลดสลิป |
| 4. รอ Admin verify | [ ] status = PAYMENT_VERIFYING |
| 5. รอ Seller ส่งของ | [ ] status = PAID_HOLDING |
| 6. Accept Delivery | [ ] status = COMPLETED |

### 6.3 Admin Flow
| Step | Test |
|------|------|
| 1. ดู pending payments | [ ] แสดงรายการ |
| 2. ดูสลิป | [ ] แสดงรูปสลิป |
| 3. Verify Payment | [ ] approve สำเร็จ |
| 4. Reject Payment | [ ] reject สำเร็จ |

### 6.4 Dispute Flow
| Step | Test |
|------|------|
| 1. Open Dispute | [ ] สร้าง dispute สำเร็จ |
| 2. Upload Evidence | [ ] อัปโหลดหลักฐาน |
| 3. Admin review | [ ] ดู dispute |
| 4. Resolve - Refund | [ ] คืนเงิน buyer |
| 5. Resolve - Release | [ ] ปล่อยเงิน seller |

---

## 7. ERROR HANDLING

| Scenario | Test |
|----------|------|
| 401 Unauthorized | [ ] redirect to login |
| 403 Forbidden | [ ] แสดง error message |
| 404 Not Found | [ ] แสดง error page |
| 500 Server Error | [ ] แสดง error message |
| Network Error | [ ] แสดง connection error |
| Validation Error | [ ] แสดง field errors |
| Duplicate Email | [ ] แสดง error ตอน register |

---

## 8. RESPONSIVE DESIGN

| Page | Mobile (375px) | Tablet (768px) | Desktop (1280px) |
|------|----------------|----------------|------------------|
| Homepage | [ ] | [ ] | [ ] |
| Login | [ ] | [ ] | [ ] |
| Register | [ ] | [ ] | [ ] |
| Dashboard | [ ] | [ ] | [ ] |
| Transactions | [ ] | [ ] | [ ] |
| Transaction Detail | [ ] | [ ] | [ ] |
| Profile | [ ] | [ ] | [ ] |
| Admin Dashboard | [ ] | [ ] | [ ] |

---

## 9. PERFORMANCE

| Test | Target |
|------|--------|
| Homepage load time | < 3 seconds |
| Login page load time | < 2 seconds |
| Dashboard load time | < 3 seconds |
| Transaction list load time | < 2 seconds |
| API response time | < 500ms |

---

## สรุปจำนวน Test Cases

| Category | Count |
|----------|-------|
| Public Pages | ~50 tests |
| Dashboard Pages | ~80 tests |
| Admin Pages | ~60 tests |
| API Endpoints | ~35 tests |
| Real-time Features | ~10 tests |
| Transaction Workflow | ~20 tests |
| Error Handling | ~10 tests |
| Responsive Design | ~30 tests |
| Performance | ~5 tests |
| **Total** | **~300 tests** |

---

## Test Credentials

**Admin User:**
- Email: `admin@penklang.com`
- Password: `admin123`

**Test User (จะถูกสร้างระหว่าง test):**
- Format: `testuser_{timestamp}@test.com`
- Password: `Test123!@#`
