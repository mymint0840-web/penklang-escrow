# Penklang Escrow Platform - Project Summary

## Overview

**Penklang** (เป็นกลาง) เป็นแพลตฟอร์ม Escrow สำหรับการซื้อขายออนไลน์ที่ปลอดภัย โดยทำหน้าที่เป็นตัวกลางระหว่างผู้ซื้อและผู้ขาย เพื่อป้องกันการโกงและสร้างความมั่นใจในการทำธุรกรรม

### Production URLs
- **Frontend**: https://penklang.vercel.app
- **Admin Panel**: https://penklang.vercel.app/admin
- **Backend API**: https://penklang-backend-production.up.railway.app

### Admin Credentials
- Email: `admin@penklang.com`
- Password: `Admin@123456`

---

## Tech Stack

### Frontend (Client)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Deployment**: Vercel

### Backend (Server)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis (Upstash)
- **Authentication**: JWT (jsonwebtoken, bcrypt)
- **Real-time**: Socket.io
- **Deployment**: Railway

### Monorepo
- **Build System**: Turbo
- **Package Manager**: npm workspaces

---

## Current Features (Working)

### Authentication
- [x] User Registration (Email, Phone, Password)
- [x] User Login
- [x] JWT Token Authentication
- [x] Protected Routes (Middleware)
- [x] Admin Role Support

### Transaction Workflow
- [x] Create Transaction (Seller)
- [x] Generate Invite Code
- [x] Buyer Join via Invite Code
- [x] Upload Payment Slip
- [x] Admin Verify Payment
- [x] Seller Confirm Delivery
- [x] Buyer Accept Delivery
- [x] Transaction Completion
- [x] Fee Calculation (3.5%)

### Transaction Statuses
```
WAITING_PAYMENT → PAYMENT_VERIFYING → PAID_HOLDING → DELIVERED_PENDING → COMPLETED
                                   ↘ DISPUTED
                                   ↘ CANCELLED
                                   ↘ REFUNDED
```

### Pages
- [x] Homepage (Landing)
- [x] Login / Register / Forgot Password
- [x] Dashboard
- [x] Transactions List
- [x] Transaction Detail
- [x] Create Transaction
- [x] Join Transaction
- [x] Profile
- [x] Settings
- [x] KYC Page
- [x] Terms & Conditions
- [x] Privacy Policy

### Admin Panel
- [x] Admin Dashboard
- [x] User Management
- [x] Transaction Management
- [x] KYC Management
- [x] Dispute Management
- [x] Settings

---

## Features To Add (TODO)

### Priority: HIGH

#### Authentication & Security
- [ ] Email Verification (ส่ง email ยืนยันตัวตน)
- [ ] Password Reset via Email
- [ ] Phone OTP Verification
- [ ] Two-Factor Authentication (2FA)
- [ ] Session Management (Logout all devices)

#### Transaction
- [ ] Real-time Notifications (Socket.io integration)
- [ ] QR Code for Invite Link
- [ ] Transaction Chat (Buyer-Seller messaging)
- [ ] Dispute Creation Flow
- [ ] Refund Process

#### Admin
- [ ] Dashboard Statistics API (`/admin/stats`)
- [ ] Revenue Charts & Reports
- [ ] User Activity Logs

### Priority: MEDIUM

#### User Experience
- [ ] Email Notifications (Status changes)
- [ ] LINE Notify Integration
- [ ] Push Notifications (PWA)
- [ ] Dark Mode
- [ ] Multi-language Support (EN/TH)

#### Transaction
- [ ] Multiple Payment Methods
- [ ] Bank Account Management
- [ ] Transaction History Export (PDF/Excel)
- [ ] Transaction Timeline Visualization
- [ ] Escrow Fee Calculator (Display before create)

#### Admin
- [ ] Bulk Actions (Approve/Reject multiple)
- [ ] Export Data to CSV/Excel
- [ ] Advanced Search & Filters

### Priority: LOW

#### Authentication
- [ ] Social Login (Google, Facebook, LINE)
- [ ] Biometric Authentication (Mobile)

#### Security
- [ ] KYC Verification Workflow (ID Card, Selfie)
- [ ] Fraud Detection System
- [ ] IP Blocking
- [ ] Rate Limiting per User

#### Chat/Messaging
- [ ] Real-time Chat (Socket.io)
- [ ] File/Image Sharing
- [ ] Read Receipts
- [ ] Chat History

#### Mobile
- [ ] PWA (Progressive Web App)
- [ ] Native Mobile App (React Native)

---

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register     - Register new user
POST   /api/v1/auth/login        - Login
GET    /api/v1/auth/me           - Get current user
POST   /api/v1/auth/logout       - Logout
```

### Transactions
```
GET    /api/v1/transactions              - List transactions
POST   /api/v1/transactions              - Create transaction
GET    /api/v1/transactions/:id          - Get transaction detail
POST   /api/v1/transactions/join/:code   - Join transaction
POST   /api/v1/transactions/:id/slip     - Upload payment slip
POST   /api/v1/transactions/:id/deliver  - Confirm delivery
POST   /api/v1/transactions/:id/accept   - Accept delivery
POST   /api/v1/transactions/:id/cancel   - Cancel transaction
```

### Admin
```
GET    /api/v1/admin/users                          - List users
GET    /api/v1/admin/transactions                   - List all transactions
POST   /api/v1/admin/transactions/:id/verify-payment - Verify payment
```

### Missing APIs (To Implement)
```
GET    /api/v1/admin/stats               - Dashboard statistics
GET    /api/v1/disputes                  - User's disputes
GET    /api/v1/transactions/:id/messages - Transaction messages
POST   /api/v1/transactions/:id/messages - Send message
POST   /api/v1/disputes                  - Create dispute
```

---

## Database Schema (Main Tables)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  phone         String   @unique
  passwordHash  String
  fullName      String
  displayName   String?
  role          UserRole @default(USER)
  status        String   @default("ACTIVE")
  emailVerified Boolean  @default(false)
  phoneVerified Boolean  @default(false)
  // Relations...
}

model Transaction {
  id           String   @id @default(cuid())
  title        String
  description  String?
  amount       Decimal
  feePercent   Decimal  @default(3.5)
  feeAmount    Decimal?
  netAmount    Decimal?
  status       TransactionStatus
  feePayer     FeePayer
  inviteCode   String   @unique
  inviteExpiry DateTime
  sellerId     String
  buyerId      String?
  // Relations...
}

model PaymentSlip {
  id            String   @id @default(cuid())
  transactionId String
  imageUrl      String
  amount        Decimal
  paymentMethod String
  status        String
  // Relations...
}
```

---

## Project Structure

```
penklang/
├── client/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── stores/        # Zustand stores
│   │   ├── lib/           # Utilities
│   │   └── middleware.ts  # Auth middleware
│   └── package.json
│
├── server/                 # Express.js Backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Express middlewares
│   │   ├── config/        # Database, Redis config
│   │   └── server.ts      # Entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
│
├── packages/               # Shared packages
│   └── shared/            # Shared types/utils
│
├── turbo.json             # Turbo config
└── package.json           # Root package.json
```

---

## Deployment

### Frontend (Vercel)
```bash
cd client
vercel --prod
```

### Backend (Railway)
```bash
cd server
railway up
```

### Environment Variables

#### Client (.env.local)
```
NEXT_PUBLIC_API_URL=https://penklang-backend-production.up.railway.app/api
```

#### Server (.env)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=https://penklang.vercel.app
PORT=4000
NODE_ENV=production
```

---

## Testing

### Run Full Workflow Test
```bash
node test-complete-workflow.js
```

### Test Checklist
- [x] User Registration
- [x] User Login
- [x] Admin Login
- [x] Create Transaction
- [x] Join Transaction
- [x] Upload Slip
- [x] Admin Verify Payment
- [x] Seller Confirm Delivery
- [x] Buyer Accept Delivery
- [x] Transaction Complete

---

## Security Considerations

### Implemented
- [x] Password Hashing (bcrypt, 12 rounds)
- [x] JWT Authentication
- [x] CORS Protection
- [x] Helmet Security Headers
- [x] Rate Limiting (100 req/15min)
- [x] Input Validation
- [x] SQL Injection Prevention (Prisma)

### To Implement
- [ ] XSS Protection (sanitize inputs)
- [ ] CSRF Protection
- [ ] API Key for external services
- [ ] Audit Logging
- [ ] Data Encryption at rest

---

## Performance

### Current
- Frontend: Vercel Edge Network
- Backend: Railway (Single instance)
- Database: PostgreSQL (Railway)
- Cache: Redis (Upstash)

### Recommendations
- [ ] Add CDN for static assets
- [ ] Implement caching strategy
- [ ] Database indexing optimization
- [ ] Connection pooling
- [ ] Horizontal scaling

---

## Contact & Support

For issues or questions, please create an issue in the repository.

---

*Last Updated: January 2026*
