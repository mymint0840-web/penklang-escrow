# Admin Dashboard API - Quick Reference

## Authentication
All admin endpoints require:
```
Authorization: Bearer {access_token}
```
User must have role: `ADMIN` or `SUPER_ADMIN`

## Base URL
```
http://localhost:3000/api/v1
```

---

## Dashboard

### Get Dashboard Statistics
```http
GET /admin/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": { "total": 150 },
    "transactions": {
      "total": 500,
      "completed": 400,
      "active": 50,
      "statusBreakdown": [...]
    },
    "financial": {
      "totalRevenue": "50000.00",
      "monthlyRevenue": "15000.00",
      "totalGMV": "1000000.00",
      "monthlyGMV": "300000.00"
    },
    "disputes": { "pending": 5 },
    "kyc": { "pending": 10 },
    "recentTransactions": [...]
  }
}
```

---

## User Management

### Get All Users
```http
GET /admin/users?status=ACTIVE&kycStatus=VERIFIED&search=john&page=1&limit=20
```

**Query Parameters:**
- `status` - ACTIVE | INACTIVE | BANNED
- `kycStatus` - NONE | PENDING | VERIFIED | REJECTED
- `role` - USER | ADMIN | SUPER_ADMIN
- `search` - Search in email, name, phone
- `startDate` - Filter from date (ISO 8601)
- `endDate` - Filter to date (ISO 8601)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Get User by ID
```http
GET /admin/users/{userId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "ACTIVE",
    "kycStatus": "VERIFIED",
    "kycDocuments": [...],
    "transactionsAsSeller": [...],
    "transactionsAsBuyer": [...],
    "_count": {
      "transactionsAsSeller": 10,
      "transactionsAsBuyer": 5,
      "disputesCreated": 0
    }
  }
}
```

### Update User Status
```http
PATCH /admin/users/{userId}/status
Content-Type: application/json

{
  "status": "BANNED"
}
```

**Status Options:**
- `ACTIVE` - User can use the platform
- `INACTIVE` - User account is inactive
- `BANNED` - User is banned from the platform

**Response:**
```json
{
  "success": true,
  "message": "อัปเดตสถานะผู้ใช้งานสำเร็จ",
  "data": {
    "id": "...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "BANNED",
    "role": "USER",
    "updatedAt": "2024-01-29T..."
  }
}
```

---

## KYC Management

### Get Pending KYC List
```http
GET /admin/kyc/pending?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "userId": "...",
      "idCardFrontUrl": "https://...",
      "idCardBackUrl": "https://...",
      "selfieUrl": "https://...",
      "status": "PENDING",
      "createdAt": "2024-01-29T...",
      "user": {
        "id": "...",
        "email": "user@example.com",
        "fullName": "John Doe",
        "displayName": "Johnny",
        "avatarUrl": "https://...",
        "createdAt": "2024-01-15T..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

### Review KYC
```http
POST /admin/kyc/{kycId}/review
Content-Type: application/json

{
  "approved": true,
  "note": "เอกสารครบถ้วนและถูกต้อง"
}
```

**Request Body:**
- `approved` (required) - `true` to approve, `false` to reject
- `note` (optional) - Review note/reason

**Response:**
```json
{
  "success": true,
  "message": "อนุมัติ KYC สำเร็จ",
  "data": {
    "id": "...",
    "userId": "...",
    "status": "VERIFIED",
    "reviewedBy": "...",
    "reviewedAt": "2024-01-29T...",
    "reviewNote": "เอกสารครบถ้วนและถูกต้อง",
    "user": {...},
    "reviewer": {...}
  }
}
```

---

## Transaction Management

### Get All Transactions
```http
GET /admin/transactions?status=COMPLETED&search=ABC123&page=1&limit=20
```

**Query Parameters:**
- `status` - Transaction status (WAITING_PAYMENT, PAID_HOLDING, COMPLETED, etc.)
- `search` - Search in transaction ID, title, invite code
- `startDate` - Filter from date (ISO 8601)
- `endDate` - Filter to date (ISO 8601)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "iPhone 15 Pro",
      "amount": "35000.00",
      "feeAmount": "1225.00",
      "status": "COMPLETED",
      "seller": {...},
      "buyer": {...},
      "paymentSlips": [...],
      "disputes": [...],
      "createdAt": "2024-01-29T...",
      "completedAt": "2024-01-30T..."
    }
  ],
  "pagination": {...}
}
```

### Get Transaction by ID
```http
GET /admin/transactions/{transactionId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "iPhone 15 Pro",
    "description": "256GB Space Black",
    "amount": "35000.00",
    "feePercent": "3.50",
    "feeAmount": "1225.00",
    "netAmount": "36225.00",
    "feePayer": "BUYER",
    "status": "COMPLETED",
    "seller": {...},
    "buyer": {...},
    "paymentSlips": [...],
    "createdAt": "2024-01-29T...",
    "completedAt": "2024-01-30T..."
  }
}
```

---

## Dispute Management

### Get All Disputes
```http
GET /admin/disputes?status=OPEN&page=1&limit=20
```

**Query Parameters:**
- `status` - OPEN | UNDER_REVIEW | RESOLVED
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "transactionId": "...",
      "reason": "ไม่ได้รับสินค้า",
      "description": "ผู้ขายไม่ส่งสินค้าตามกำหนด",
      "evidenceUrls": ["https://...", "https://..."],
      "status": "OPEN",
      "resolution": null,
      "createdBy": "...",
      "createdAt": "2024-01-29T...",
      "transaction": {
        "id": "...",
        "title": "iPhone 15 Pro",
        "amount": "35000.00",
        "seller": {...},
        "buyer": {...}
      },
      "creator": {...},
      "resolver": null
    }
  ],
  "pagination": {...}
}
```

### Resolve Dispute
```http
POST /admin/disputes/{disputeId}/resolve
Content-Type: application/json

{
  "resolution": "REFUND_BUYER",
  "note": "ผู้ซื้อมีหลักฐานชัดเจนว่าไม่ได้รับสินค้า"
}
```

**Resolution Options:**
- `REFUND_BUYER` - Refund money to buyer
- `RELEASE_SELLER` - Release money to seller
- `PARTIAL_REFUND` - Partial refund (custom amount)

**Request Body:**
- `resolution` (required) - Resolution type
- `note` (optional) - Resolution note/explanation

**Response:**
```json
{
  "success": true,
  "message": "แก้ไขข้อพิพาทสำเร็จ",
  "data": {
    "id": "...",
    "status": "RESOLVED",
    "resolution": "REFUND_BUYER",
    "resolvedBy": "...",
    "resolvedAt": "2024-01-29T...",
    "transaction": {...},
    "creator": {...},
    "resolver": {...}
  }
}
```

---

## System Configuration

### Get System Config
```http
GET /admin/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "singleton",
    "feePercent": "3.50",
    "minFee": "10.00",
    "maxFee": "5000.00",
    "paymentTimeoutHours": 24,
    "autoReleaseHours": 72,
    "minTransactionAmount": "100.00",
    "maxTransactionAmount": "1000000.00",
    "platformBankName": "ธนาคารกสิกรไทย",
    "platformBankAccountNo": "123-4-56789-0",
    "platformBankAccountName": "บริษัท Escrow จำกัด",
    "maintenanceMode": false,
    "updatedAt": "2024-01-29T...",
    "updatedBy": "...",
    "updater": {...}
  }
}
```

### Update System Config
```http
PATCH /admin/config
Content-Type: application/json

{
  "feePercent": 3.5,
  "minFee": 10,
  "maxFee": 5000,
  "paymentTimeoutHours": 24,
  "autoReleaseHours": 72,
  "minTransactionAmount": 100,
  "maxTransactionAmount": 1000000,
  "platformBankName": "ธนาคารกสิกรไทย",
  "platformBankAccountNo": "123-4-56789-0",
  "platformBankAccountName": "บริษัท Escrow จำกัด",
  "maintenanceMode": false
}
```

**All fields are optional** - only send fields you want to update.

**Response:**
```json
{
  "success": true,
  "message": "อัปเดตการตั้งค่าระบบสำเร็จ",
  "data": {...}
}
```

---

## Dispute APIs (User-facing)

### Create Dispute
```http
POST /transactions/{transactionId}/dispute
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "reason": "ไม่ได้รับสินค้าตามที่ตกลง",
  "description": "สินค้าที่ได้รับไม่ตรงตามรูปภาพและคำอธิบาย",
  "evidenceUrls": [
    "https://cloudinary.com/evidence1.jpg",
    "https://cloudinary.com/evidence2.jpg"
  ]
}
```

**Request Body:**
- `reason` (required) - Brief dispute reason
- `description` (optional) - Detailed description
- `evidenceUrls` (optional) - Array of evidence image URLs

**Response:**
```json
{
  "success": true,
  "message": "สร้างข้อพิพาทสำเร็จ",
  "data": {
    "id": "...",
    "transactionId": "...",
    "reason": "ไม่ได้รับสินค้าตามที่ตกลง",
    "description": "สินค้าที่ได้รับไม่ตรงตามรูปภาพและคำอธิบาย",
    "evidenceUrls": [...],
    "status": "OPEN",
    "createdBy": "...",
    "createdAt": "2024-01-29T...",
    "transaction": {...},
    "creator": {...}
  }
}
```

### Get Transaction Disputes
```http
GET /transactions/{transactionId}/dispute
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "reason": "ไม่ได้รับสินค้า",
      "description": "...",
      "evidenceUrls": [...],
      "status": "OPEN",
      "resolution": null,
      "createdBy": "...",
      "createdAt": "2024-01-29T...",
      "creator": {...},
      "resolver": null
    }
  ]
}
```

### Get Dispute by ID
```http
GET /disputes/{disputeId}
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "transactionId": "...",
    "reason": "ไม่ได้รับสินค้า",
    "description": "...",
    "evidenceUrls": [...],
    "status": "RESOLVED",
    "resolution": "REFUND_BUYER",
    "resolvedBy": "...",
    "resolvedAt": "2024-01-30T...",
    "createdAt": "2024-01-29T...",
    "transaction": {...},
    "creator": {...},
    "resolver": {...}
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "ไม่พบโทเค็นการยืนยันตัวตน"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "ไม่พบข้อมูล"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "ข้อมูลไม่ถูกต้อง"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "เกิดข้อผิดพลาดภายในระบบ"
}
```

---

## Enums Reference

### UserStatus
- `ACTIVE` - Active user
- `INACTIVE` - Inactive user
- `BANNED` - Banned user

### UserRole
- `USER` - Regular user
- `ADMIN` - Administrator
- `SUPER_ADMIN` - Super administrator

### KycStatus
- `NONE` - No KYC submitted
- `PENDING` - KYC pending review
- `VERIFIED` - KYC verified
- `REJECTED` - KYC rejected

### TransactionStatus
- `WAITING_PAYMENT` - Waiting for buyer payment
- `PAYMENT_VERIFYING` - Payment being verified
- `PAID_HOLDING` - Payment verified, funds held
- `DELIVERED_PENDING` - Seller marked as delivered
- `COMPLETED` - Transaction completed
- `DISPUTE_OPEN` - Dispute opened
- `CANCELLED` - Transaction cancelled
- `REFUNDED` - Transaction refunded
- `EXPIRED` - Transaction expired

### DisputeStatus
- `OPEN` - Dispute newly created
- `UNDER_REVIEW` - Admin reviewing dispute
- `RESOLVED` - Dispute resolved

### DisputeResolution
- `REFUND_BUYER` - Refund to buyer
- `RELEASE_SELLER` - Release to seller
- `PARTIAL_REFUND` - Partial refund

### FeePayer
- `BUYER` - Buyer pays the fee
- `SELLER` - Seller pays the fee
- `HALF_HALF` - Split 50/50

---

## Testing with cURL

### Get Dashboard Stats
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Update User Status
```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/users/USER_ID/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"BANNED"}'
```

### Review KYC
```bash
curl -X POST "http://localhost:3000/api/v1/admin/kyc/KYC_ID/review" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved":true,"note":"เอกสารครบถ้วน"}'
```

### Resolve Dispute
```bash
curl -X POST "http://localhost:3000/api/v1/admin/disputes/DISPUTE_ID/resolve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resolution":"REFUND_BUYER","note":"ผู้ซื้อมีหลักฐานชัดเจน"}'
```

### Create Dispute (User)
```bash
curl -X POST "http://localhost:3000/api/v1/transactions/TRANSACTION_ID/dispute" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason":"ไม่ได้รับสินค้า",
    "description":"ผู้ขายไม่ส่งสินค้า",
    "evidenceUrls":["https://..."]
  }'
```
