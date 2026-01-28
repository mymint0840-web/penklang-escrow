# Authentication System Documentation

## Overview

ระบบ Authentication ที่สมบูรณ์สำหรับ Escrow Platform Backend ที่พัฒนาด้วย TypeScript, Express, Prisma, และ JWT

## Files Structure

```
src/
├── types/
│   └── auth.types.ts              # TypeScript interfaces และ types
├── middlewares/
│   ├── auth.middleware.ts         # Authentication middleware
│   ├── validate.middleware.ts     # Zod validation middleware
│   └── errorHandler.middleware.ts # Global error handler
├── utils/
│   ├── jwt.ts                     # JWT utility functions
│   └── password.ts                # Password hashing utilities
├── services/
│   └── auth.service.ts            # Authentication business logic
├── controllers/
│   └── auth.controller.ts         # HTTP request handlers
├── routes/
│   ├── auth.routes.ts             # Auth routes
│   └── index.ts                   # Main router
└── validators/
    └── auth.validator.ts          # Zod validation schemas
```

## Features

### 1. User Registration
- อีเมลและรหัสผ่านที่ปลอดภัย
- ตรวจสอบความแข็งแรงของรหัสผ่าน
- เก็บประวัติรหัสผ่าน
- สร้าง email verification token

### 2. User Login
- ยืนยันตัวตนด้วยอีเมลและรหัสผ่าน
- สร้าง access token และ refresh token
- บันทึก session พร้อม IP และ user agent
- Security logging

### 3. Token Management
- Access Token (expires in 7 days)
- Refresh Token (expires in 30 days)
- Token refresh mechanism
- Session management

### 4. Email Verification
- สร้างและส่ง verification token
- เก็บ token ใน Redis (expires in 24 hours)
- ยืนยันอีเมลผ่าน token

### 5. Password Reset
- ขอรีเซ็ตรหัสผ่านผ่านอีเมล
- สร้าง reset token (expires in 1 hour)
- เปลี่ยนรหัสผ่านผ่าน token
- บังคับ logout ทุก session หลังเปลี่ยนรหัสผ่าน

### 6. Password Change
- เปลี่ยนรหัสผ่านโดยต้องใช้รหัสผ่านปัจจุบัน
- ตรวจสอบว่าไม่ใช้รหัสผ่านเดิม (5 รหัสผ่านล่าสุด)
- ลบ session อื่นๆ ทั้งหมด (ยกเว้น session ปัจจุบัน)

### 7. Middleware
- **authMiddleware**: ตรวจสอบ JWT และแนบ user data เข้า request
- **kycRequiredMiddleware**: ตรวจสอบว่า KYC status เป็น VERIFIED
- **adminMiddleware**: ตรวจสอบว่า role เป็น ADMIN หรือ SUPER_ADMIN
- **superAdminMiddleware**: ตรวจสอบว่า role เป็น SUPER_ADMIN
- **emailVerifiedMiddleware**: ตรวจสอบว่าอีเมลได้รับการยืนยัน

## API Endpoints

### Public Endpoints

#### 1. Register
```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "สมชาย ใจดี",
  "phone": "0812345678",
  "displayName": "สมชาย"
}
```

**Response:**
```json
{
  "success": true,
  "message": "สมัครสมาชิกสำเร็จ",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "fullName": "สมชาย ใจดี",
      "displayName": "สมชาย",
      "role": "USER",
      "kycStatus": "NONE",
      "status": "ACTIVE",
      "emailVerified": false,
      "phoneVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    },
    "session": {
      "id": "session_id",
      "expiresAt": "2024-02-01T00:00:00.000Z"
    }
  }
}
```

#### 2. Login
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** (Same as register)

#### 3. Refresh Token
```
POST /api/v1/auth/refresh-token
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "รีเฟรชโทเค็นสำเร็จ",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

#### 4. Verify Email
```
POST /api/v1/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "ยืนยันอีเมลสำเร็จ"
}
```

#### 5. Forgot Password
```
POST /api/v1/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้"
}
```

#### 6. Reset Password
```
POST /api/v1/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่"
}
```

### Protected Endpoints (Require Authentication)

#### 7. Logout
```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "ออกจากระบบสำเร็จ"
}
```

#### 8. Get Current User
```
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "fullName": "สมชาย ใจดี",
    "displayName": "สมชาย",
    "avatarUrl": null,
    "phone": "0812345678",
    "bankName": null,
    "bankAccountNo": null,
    "bankAccountName": null,
    "role": "USER",
    "status": "ACTIVE",
    "kycStatus": "NONE",
    "emailVerified": true,
    "phoneVerified": false,
    "lastLoginAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 9. Resend Email Verification
```
POST /api/v1/auth/resend-verification
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "ส่งอีเมลยืนยันใหม่แล้ว"
}
```

#### 10. Change Password
```
POST /api/v1/auth/change-password
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "เปลี่ยนรหัสผ่านสำเร็จ"
}
```

## Password Requirements

รหัสผ่านต้องมีคุณสมบัติดังนี้:
- ความยาวอย่างน้อย 8 ตัวอักษร
- ความยาวไม่เกิน 128 ตัวอักษร
- มีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)
- มีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)
- มีตัวเลขอย่างน้อย 1 ตัว (0-9)
- มีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*()_+-=[]{}|;:,.<>?)

## Error Handling

ระบบ error handling ที่ครอบคลุม:

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "ข้อความอธิบายข้อผิดพลาดภาษาไทย",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": {} // Optional: รายละเอียดเพิ่มเติม
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: ข้อมูลไม่ถูกต้อง
- `EMAIL_EXISTS`: อีเมลนี้ถูกใช้งานแล้ว
- `PHONE_EXISTS`: หมายเลขโทรศัพท์นี้ถูกใช้งานแล้ว
- `INVALID_CREDENTIALS`: อีเมลหรือรหัสผ่านไม่ถูกต้อง
- `USER_BANNED`: บัญชีของคุณถูกระงับการใช้งาน
- `USER_INACTIVE`: บัญชีของคุณไม่ได้เปิดใช้งาน
- `WEAK_PASSWORD`: รหัสผ่านไม่ตรงตามเงื่อนไข
- `PASSWORD_RECENTLY_USED`: รหัสผ่านนี้เคยถูกใช้งานแล้ว
- `TOKEN_EXPIRED`: โทเค็นหมดอายุแล้ว
- `INVALID_TOKEN`: โทเค็นไม่ถูกต้อง
- `NO_TOKEN`: ไม่พบโทเค็นการยืนยันตัวตน
- `INVALID_SESSION`: เซสชันไม่ถูกต้องหรือหมดอายุแล้ว
- `SESSION_EXPIRED`: เซสชันหมดอายุแล้ว
- `KYC_NOT_SUBMITTED`: กรุณายืนยันตัวตน (KYC) ก่อนใช้งานฟีเจอร์นี้
- `KYC_PENDING`: การยืนยันตัวตนของคุณอยู่ระหว่างการตรวจสอบ
- `KYC_REJECTED`: การยืนยันตัวตนของคุณถูกปฏิเสธ
- `INSUFFICIENT_PERMISSIONS`: คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้
- `EMAIL_NOT_VERIFIED`: กรุณายืนยันอีเมลของคุณก่อนใช้งานฟีเจอร์นี้

## Security Features

### 1. Password Security
- Bcrypt hashing with 12 salt rounds
- Password strength validation
- Password history tracking (ป้องกันการใช้รหัสผ่านเดิม 5 รหัสผ่านล่าสุด)

### 2. Token Security
- JWT with signed tokens
- Access token และ refresh token แยกจากกัน
- Token expiration
- Token stored in database session

### 3. Session Management
- Session tracking with IP address และ user agent
- Session expiration
- Multiple session support
- Force logout all sessions

### 4. Security Logging
- Login attempts (success และ failed)
- Password changes
- Email verification
- Password resets

### 5. Rate Limiting
- API rate limiting (100 requests per 15 minutes)
- Protection against brute force attacks

## Middleware Usage

### Authentication Middleware
```typescript
import { authMiddleware } from '@/middlewares/auth.middleware';

router.get('/protected', authMiddleware, controller.handler);
```

### KYC Required Middleware
```typescript
import { authMiddleware, kycRequiredMiddleware } from '@/middlewares/auth.middleware';

// ต้องผ่าน authMiddleware ก่อน
router.post('/transaction', authMiddleware, kycRequiredMiddleware, controller.createTransaction);
```

### Admin Middleware
```typescript
import { authMiddleware, adminMiddleware } from '@/middlewares/auth.middleware';

// เฉพาะ ADMIN และ SUPER_ADMIN เท่านั้น
router.get('/admin/users', authMiddleware, adminMiddleware, controller.listUsers);
```

### Super Admin Middleware
```typescript
import { authMiddleware, superAdminMiddleware } from '@/middlewares/auth.middleware';

// เฉพาะ SUPER_ADMIN เท่านั้น
router.delete('/admin/user/:id', authMiddleware, superAdminMiddleware, controller.deleteUser);
```

### Validation Middleware
```typescript
import { validateBody } from '@/middlewares/validate.middleware';
import { loginSchema } from '@/validators/auth.validator';

router.post('/login', validateBody(loginSchema), controller.login);
```

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
JWT_REFRESH_EXPIRES_IN=30d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/escrow_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# API
NODE_ENV=development
PORT=4000
API_VERSION=v1

# Frontend
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Testing Examples

### Using cURL

#### Register
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "fullName": "Test User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

#### Get Current User
```bash
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Models

### User Model
- id: String (CUID)
- email: String (unique)
- phone: String? (unique)
- passwordHash: String
- fullName: String
- displayName: String?
- role: UserRole (USER, ADMIN, SUPER_ADMIN)
- status: UserStatus (ACTIVE, INACTIVE, BANNED)
- kycStatus: KycStatus (NONE, PENDING, VERIFIED, REJECTED)
- emailVerified: Boolean
- phoneVerified: Boolean

### Session Model
- id: String (CUID)
- userId: String
- token: String (unique)
- refreshToken: String? (unique)
- ipAddress: String?
- userAgent: String?
- expiresAt: DateTime

### PasswordHistory Model
- id: String (CUID)
- userId: String
- passwordHash: String
- createdAt: DateTime

## Future Enhancements

- [ ] Two-Factor Authentication (2FA)
- [ ] Social login (Google, Facebook, Line)
- [ ] SMS verification
- [ ] Device fingerprinting
- [ ] Suspicious activity detection
- [ ] Account lockout after failed attempts
- [ ] Email notification for security events
- [ ] API key authentication for third-party integrations

## Support

For questions or issues, please contact the development team.
