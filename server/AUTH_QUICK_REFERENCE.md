# Authentication System - Quick Reference Card

## 🚀 Quick Start

### 1. Start Server
```bash
npm run dev
```

### 2. Test Registration
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","fullName":"Test User"}'
```

### 3. Test Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

---

## 📋 API Endpoints

### Public Routes
```
POST   /api/v1/auth/register           - Register new user
POST   /api/v1/auth/login              - Login user
POST   /api/v1/auth/refresh-token      - Refresh access token
POST   /api/v1/auth/verify-email       - Verify email
POST   /api/v1/auth/forgot-password    - Request password reset
POST   /api/v1/auth/reset-password     - Reset password
```

### Protected Routes (Require Authorization Header)
```
POST   /api/v1/auth/logout             - Logout user
GET    /api/v1/auth/me                 - Get current user
POST   /api/v1/auth/resend-verification - Resend email verification
POST   /api/v1/auth/change-password    - Change password
```

---

## 🔑 Authorization Header Format

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📁 File Structure

```
src/
├── types/
│   └── auth.types.ts              # TypeScript interfaces
├── middlewares/
│   ├── auth.middleware.ts         # Auth, KYC, Admin middlewares
│   ├── validate.middleware.ts     # Zod validation
│   └── errorHandler.middleware.ts # Error handling
├── utils/
│   ├── jwt.ts                     # JWT functions
│   └── password.ts                # Password functions
├── services/
│   └── auth.service.ts            # Business logic
├── controllers/
│   └── auth.controller.ts         # HTTP handlers
├── routes/
│   ├── auth.routes.ts             # Auth routes
│   └── index.ts                   # Main router
└── validators/
    └── auth.validator.ts          # Zod schemas
```

---

## 🛡️ Middleware Usage

### Authentication
```typescript
import { authMiddleware } from '@/middlewares/auth.middleware';

router.get('/protected', authMiddleware, controller.handler);
```

### KYC Required
```typescript
import { authMiddleware, kycRequiredMiddleware } from '@/middlewares/auth.middleware';

router.post('/transaction',
  authMiddleware,
  kycRequiredMiddleware,
  controller.createTransaction
);
```

### Admin Only
```typescript
import { authMiddleware, adminMiddleware } from '@/middlewares/auth.middleware';

router.get('/admin/users',
  authMiddleware,
  adminMiddleware,
  controller.listUsers
);
```

### Validation
```typescript
import { validateBody } from '@/middlewares/validate.middleware';
import { loginSchema } from '@/validators/auth.validator';

router.post('/login',
  validateBody(loginSchema),
  controller.login
);
```

---

## 🔒 Password Requirements

- ✅ 8-128 characters
- ✅ 1+ uppercase (A-Z)
- ✅ 1+ lowercase (a-z)
- ✅ 1+ number (0-9)
- ✅ 1+ special char (!@#$%^&*...)

---

## ⚙️ Environment Variables

```env
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-key
JWT_REFRESH_EXPIRES_IN=30d
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🚨 Common Error Codes

| Code | Message |
|------|---------|
| `EMAIL_EXISTS` | อีเมลนี้ถูกใช้งานแล้ว |
| `INVALID_CREDENTIALS` | อีเมลหรือรหัสผ่านไม่ถูกต้อง |
| `USER_BANNED` | บัญชีถูกระงับการใช้งาน |
| `WEAK_PASSWORD` | รหัสผ่านไม่ตรงตามเงื่อนไข |
| `TOKEN_EXPIRED` | โทเค็นหมดอายุแล้ว |
| `INVALID_TOKEN` | โทเค็นไม่ถูกต้อง |
| `SESSION_EXPIRED` | เซสชันหมดอายุแล้ว |
| `KYC_NOT_SUBMITTED` | กรุณายืนยันตัวตน (KYC) |
| `INSUFFICIENT_PERMISSIONS` | คุณไม่มีสิทธิ์เข้าถึง |

---

## 📊 Database Models

### User
- email, phone, passwordHash, fullName
- role (USER/ADMIN/SUPER_ADMIN)
- status (ACTIVE/INACTIVE/BANNED)
- kycStatus (NONE/PENDING/VERIFIED/REJECTED)
- emailVerified, phoneVerified

### Session
- userId, token, refreshToken
- ipAddress, userAgent
- expiresAt

### PasswordHistory
- userId, passwordHash
- createdAt

### SecurityLog
- event, userId, success
- ipAddress, details
- createdAt

---

## 🧪 Testing Flow

1. **Register** → Get tokens
2. **Login** → Get tokens
3. **Get Me** → Use access token
4. **Change Password** → Use access token
5. **Logout** → Delete session
6. **Refresh Token** → Get new tokens

---

## 📚 Documentation Files

- `AUTH_SYSTEM_README.md` - Complete documentation
- `AUTH_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `AUTH_QUICK_REFERENCE.md` - This file

---

## 🎯 Key Features

✅ User registration & login
✅ JWT access & refresh tokens
✅ Email verification
✅ Password reset
✅ Password change
✅ Session management
✅ Security logging
✅ Password history
✅ Middleware: auth, KYC, admin
✅ Zod validation
✅ Error handling (Thai)
✅ TypeScript support

---

## 💡 Tips

- Always use authMiddleware before other auth middlewares
- Chain middlewares in order: validate → auth → kyc/admin → controller
- Check user.role for authorization
- Use asyncHandler for async controllers
- Store JWT_SECRET securely
- Use HTTPS in production
- Enable rate limiting
- Log security events

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Date**: January 29, 2026
