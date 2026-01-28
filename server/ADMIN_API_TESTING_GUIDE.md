# Admin Dashboard API - Testing Guide

## Prerequisites

1. **Database Setup**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

2. **Start Server**
   ```bash
   npm run dev
   ```

3. **Create Test Admin User**
   You'll need to manually create an admin user or promote an existing user to admin role in the database:

   ```sql
   -- Using Prisma Studio
   npm run prisma:studio

   -- Or using SQL
   UPDATE users
   SET role = 'ADMIN'
   WHERE email = 'admin@example.com';
   ```

## Testing Workflow

### Step 1: Get Admin Access Token

1. **Register a new user** (if not already registered):
   ```http
   POST http://localhost:3000/api/v1/auth/register
   Content-Type: application/json

   {
     "email": "admin@test.com",
     "password": "Admin123!@#",
     "fullName": "Admin User",
     "displayName": "Admin"
   }
   ```

2. **Update user role to ADMIN** in database (using Prisma Studio or SQL)

3. **Login to get access token**:
   ```http
   POST http://localhost:3000/api/v1/auth/login
   Content-Type: application/json

   {
     "email": "admin@test.com",
     "password": "Admin123!@#"
   }
   ```

   Save the `accessToken` from the response.

### Step 2: Test Dashboard Statistics

```http
GET http://localhost:3000/api/v1/admin/dashboard/stats
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Contains users, transactions, financial, disputes, kyc data
- ✅ Recent transactions array

**What to Check:**
- Total counts are accurate
- Financial metrics (GMV, revenue) are calculated correctly
- Status breakdown is present
- Recent transactions include seller and buyer info

### Step 3: Test User Management

#### 3.1 Get Users List
```http
GET http://localhost:3000/api/v1/admin/users?page=1&limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Array of users
- ✅ Pagination metadata

#### 3.2 Get User by ID
```http
GET http://localhost:3000/api/v1/admin/users/USER_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ User details with KYC documents
- ✅ Transaction counts
- ✅ Recent transactions as seller/buyer

#### 3.3 Update User Status
```http
PATCH http://localhost:3000/api/v1/admin/users/USER_ID/status
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "status": "BANNED"
}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Updated user with new status
- ✅ Success message in Thai

**Verify:**
- Check `audit_logs` table for the action
- User status is actually updated in database
- User cannot login if BANNED

#### 3.4 Test User Filtering
```http
GET http://localhost:3000/api/v1/admin/users?status=ACTIVE&search=test&page=1&limit=5
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Test Different Filters:**
- `status=ACTIVE`
- `status=BANNED`
- `kycStatus=VERIFIED`
- `kycStatus=PENDING`
- `search=john` (searches email, name, phone)
- `startDate=2024-01-01`
- `role=USER`

### Step 4: Test KYC Management

#### 4.1 Setup Test KYC Documents

First, create a test KYC document:
```sql
INSERT INTO kyc_documents (
  id,
  user_id,
  id_card_front_url,
  id_card_back_url,
  selfie_url,
  status,
  created_at,
  updated_at
) VALUES (
  'kyc_test_001',
  'USER_ID_HERE',
  'https://example.com/front.jpg',
  'https://example.com/back.jpg',
  'https://example.com/selfie.jpg',
  'PENDING',
  NOW(),
  NOW()
);
```

#### 4.2 Get Pending KYC List
```http
GET http://localhost:3000/api/v1/admin/kyc/pending?page=1&limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Array of pending KYC documents
- ✅ Each includes user information
- ✅ Pagination metadata

#### 4.3 Approve KYC
```http
POST http://localhost:3000/api/v1/admin/kyc/KYC_ID/review
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "approved": true,
  "note": "เอกสารครบถ้วนและถูกต้อง"
}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ KYC status changed to VERIFIED
- ✅ reviewedBy and reviewedAt are set
- ✅ User's kycStatus is updated

**Verify:**
- Check `audit_logs` table
- User's `kyc_status` column is VERIFIED
- KYC document `reviewed_by` and `reviewed_at` are populated

#### 4.4 Reject KYC
```http
POST http://localhost:3000/api/v1/admin/kyc/KYC_ID/review
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "approved": false,
  "note": "เอกสารไม่ชัดเจน กรุณาอัปโหลดใหม่"
}
```

**Verify:**
- KYC status is REJECTED
- User's kycStatus is REJECTED

### Step 5: Test Transaction Management

#### 5.1 Get All Transactions
```http
GET http://localhost:3000/api/v1/admin/transactions?page=1&limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Array of transactions
- ✅ Includes seller, buyer, payment slips, disputes
- ✅ Pagination metadata

#### 5.2 Test Transaction Filtering
```http
GET http://localhost:3000/api/v1/admin/transactions?status=COMPLETED&search=iPhone
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Test Different Filters:**
- `status=WAITING_PAYMENT`
- `status=COMPLETED`
- `status=DISPUTE_OPEN`
- `search=ABC123` (searches ID, title, invite code)
- `startDate=2024-01-01`
- `endDate=2024-12-31`

#### 5.3 Get Transaction by ID
```http
GET http://localhost:3000/api/v1/admin/transactions/TRANSACTION_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Full transaction details
- ✅ Seller and buyer information
- ✅ Payment slips array

### Step 6: Test Dispute Management

#### 6.1 Create Test Dispute (as regular user)

First, get a regular user token and create a dispute:
```http
POST http://localhost:3000/api/v1/transactions/TRANSACTION_ID/dispute
Authorization: Bearer USER_ACCESS_TOKEN
Content-Type: application/json

{
  "reason": "ไม่ได้รับสินค้าตามที่ตกลง",
  "description": "สินค้าที่ได้รับไม่ตรงตามรูปภาพและคำอธิบาย มีรอยขีดข่วน",
  "evidenceUrls": [
    "https://example.com/evidence1.jpg",
    "https://example.com/evidence2.jpg"
  ]
}
```

**Expected Response:**
- ✅ Status: 201 Created
- ✅ Dispute created with status OPEN
- ✅ Transaction status changed to DISPUTE_OPEN

**Verify:**
- Transaction status is DISPUTE_OPEN in database
- Dispute record created with correct data

#### 6.2 Get All Disputes (as admin)
```http
GET http://localhost:3000/api/v1/admin/disputes?status=OPEN&page=1&limit=10
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Array of disputes
- ✅ Includes transaction, creator, resolver info
- ✅ Pagination metadata

#### 6.3 Resolve Dispute - Refund Buyer
```http
POST http://localhost:3000/api/v1/admin/disputes/DISPUTE_ID/resolve
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "resolution": "REFUND_BUYER",
  "note": "ผู้ซื้อมีหลักฐานชัดเจนว่าสินค้าไม่ตรงตามที่ตกลง"
}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Dispute status changed to RESOLVED
- ✅ Transaction status changed to REFUNDED
- ✅ resolvedBy and resolvedAt are set

**Verify:**
- Check `audit_logs` table
- Dispute status is RESOLVED
- Transaction status is REFUNDED
- Resolution note is saved

#### 6.4 Resolve Dispute - Release to Seller
```http
POST http://localhost:3000/api/v1/admin/disputes/DISPUTE_ID/resolve
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "resolution": "RELEASE_SELLER",
  "note": "ผู้ขายมีหลักฐานการส่งสินค้าชัดเจน"
}
```

**Verify:**
- Transaction status changed to COMPLETED

#### 6.5 Get Transaction Disputes (as user)
```http
GET http://localhost:3000/api/v1/transactions/TRANSACTION_ID/dispute
Authorization: Bearer USER_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Array of disputes for the transaction

### Step 7: Test System Configuration

#### 7.1 Get System Config
```http
GET http://localhost:3000/api/v1/admin/config
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Current system configuration
- ✅ All fee and timeout settings
- ✅ Platform bank information

#### 7.2 Update System Config
```http
PATCH http://localhost:3000/api/v1/admin/config
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "feePercent": 3.5,
  "minFee": 15,
  "maxFee": 6000,
  "paymentTimeoutHours": 48,
  "autoReleaseHours": 96,
  "platformBankName": "ธนาคารกสิกรไทย",
  "platformBankAccountNo": "123-4-56789-0",
  "platformBankAccountName": "บริษัท Escrow จำกัด"
}
```

**Expected Response:**
- ✅ Status: 200 OK
- ✅ Updated configuration
- ✅ updatedBy field set to admin ID

**Verify:**
- Check `audit_logs` table
- Config values updated in database
- New transactions use updated fee settings

### Step 8: Test Authorization & Security

#### 8.1 Test Without Token
```http
GET http://localhost:3000/api/v1/admin/dashboard/stats
```

**Expected Response:**
- ✅ Status: 401 Unauthorized
- ✅ Error message: "ไม่พบโทเค็นการยืนยันตัวตน"

#### 8.2 Test With Regular User Token
```http
GET http://localhost:3000/api/v1/admin/dashboard/stats
Authorization: Bearer REGULAR_USER_TOKEN
```

**Expected Response:**
- ✅ Status: 403 Forbidden
- ✅ Error message: "คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้"

#### 8.3 Test With Expired Token
```http
GET http://localhost:3000/api/v1/admin/dashboard/stats
Authorization: Bearer EXPIRED_TOKEN
```

**Expected Response:**
- ✅ Status: 401 Unauthorized
- ✅ Error about expired or invalid token

#### 8.4 Test Dispute Access Control
```http
GET http://localhost:3000/api/v1/disputes/DISPUTE_ID
Authorization: Bearer UNRELATED_USER_TOKEN
```

**Expected Response:**
- ✅ Status: 403 Forbidden
- ✅ Error: "คุณไม่มีสิทธิ์เข้าถึงข้อพิพาทนี้"

### Step 9: Test Error Handling

#### 9.1 Invalid User ID
```http
GET http://localhost:3000/api/v1/admin/users/invalid_id_123
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

**Expected Response:**
- ✅ Status: 404 or 500
- ✅ Thai error message

#### 9.2 Invalid Status Value
```http
PATCH http://localhost:3000/api/v1/admin/users/USER_ID/status
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "status": "INVALID_STATUS"
}
```

**Expected Response:**
- ✅ Status: 400 Bad Request
- ✅ Error message about invalid status

#### 9.3 Missing Required Fields
```http
POST http://localhost:3000/api/v1/admin/kyc/KYC_ID/review
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "note": "test"
}
```

**Expected Response:**
- ✅ Status: 400 Bad Request
- ✅ Error about missing approved field

#### 9.4 Dispute on Wrong Transaction Status
```http
POST http://localhost:3000/api/v1/transactions/WAITING_PAYMENT_TX/dispute
Authorization: Bearer USER_ACCESS_TOKEN
Content-Type: application/json

{
  "reason": "Test"
}
```

**Expected Response:**
- ✅ Status: 400 or 500
- ✅ Error: "ไม่สามารถสร้างข้อพิพาทในสถานะธุรกรรมนี้ได้"

### Step 10: Test Audit Logging

After performing admin actions, verify audit logs:

```sql
SELECT * FROM audit_logs
WHERE admin_id = 'YOUR_ADMIN_ID'
ORDER BY created_at DESC
LIMIT 10;
```

**Verify Audit Logs Exist For:**
- ✅ User status updates
- ✅ KYC reviews
- ✅ Dispute resolutions
- ✅ System config updates

**Each log should have:**
- adminId
- action (e.g., 'UPDATE_USER_STATUS', 'REVIEW_KYC')
- targetType (e.g., 'User', 'KycDocument')
- targetId
- previousValue (JSON)
- newValue (JSON)
- createdAt

## Performance Testing

### Test Pagination

1. **Large Dataset Test**
   - Create 100+ users/transactions
   - Test different page sizes (10, 20, 50, 100)
   - Verify pagination metadata accuracy

2. **Filter Performance**
   - Test with multiple filters combined
   - Test search with special characters
   - Test date range filters

### Test Concurrent Requests

Use tools like Apache Bench or k6:

```bash
# Test dashboard stats endpoint
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/admin/dashboard/stats
```

## Integration Testing Checklist

- [ ] All admin endpoints require authentication
- [ ] All admin endpoints require admin role
- [ ] Dashboard stats are accurate
- [ ] User filtering works correctly
- [ ] User status update works and creates audit log
- [ ] KYC approval works and updates user status
- [ ] KYC rejection works correctly
- [ ] Transaction listing with filters works
- [ ] Dispute creation updates transaction status
- [ ] Dispute resolution updates transaction status
- [ ] All dispute resolutions work correctly
- [ ] System config can be retrieved
- [ ] System config can be updated
- [ ] Audit logs are created for all admin actions
- [ ] Error messages are in Thai
- [ ] Access control prevents unauthorized access
- [ ] Pagination works correctly
- [ ] Search functionality works

## Common Issues & Solutions

### Issue: "ไม่มีสิทธิ์เข้าถึง"
**Solution:** Verify user role is ADMIN or SUPER_ADMIN in database

### Issue: Pagination returns wrong total
**Solution:** Check where clause is correctly applied to both findMany and count

### Issue: Audit logs not created
**Solution:** Verify adminId is being passed correctly to service functions

### Issue: KYC review doesn't update user status
**Solution:** Check if user.update is being called after kycDocument.update

### Issue: Dispute resolution doesn't change transaction status
**Solution:** Verify transaction.update is called in resolveDispute service

## Testing Tools

### Recommended Tools:
- **Postman** - For manual API testing
- **Insomnia** - Alternative to Postman
- **Prisma Studio** - For database inspection
- **Thunder Client** (VS Code) - Lightweight API client

### Postman Collection Setup:

1. Create environment with variables:
   - `baseUrl`: http://localhost:3000/api/v1
   - `adminToken`: YOUR_ADMIN_ACCESS_TOKEN
   - `userToken`: YOUR_USER_ACCESS_TOKEN

2. Set Authorization header globally:
   - Type: Bearer Token
   - Token: {{adminToken}}

3. Import all endpoints from this guide

## Next Steps After Testing

1. ✅ Fix any bugs found during testing
2. ✅ Add input validation middleware if needed
3. ✅ Add rate limiting for admin endpoints
4. ✅ Set up monitoring and logging
5. ✅ Document any edge cases discovered
6. ✅ Create automated tests (Jest/Supertest)
7. ✅ Deploy to staging environment
8. ✅ Perform security audit
9. ✅ Load testing with realistic data
10. ✅ Get stakeholder approval

## Success Criteria

Admin Dashboard APIs are ready for production when:
- [ ] All endpoints return expected responses
- [ ] All authorization checks work correctly
- [ ] All audit logs are created properly
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable (< 500ms for most requests)
- [ ] Security testing passes
- [ ] All edge cases are handled
- [ ] Documentation is complete
- [ ] Frontend can integrate successfully
