# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Penklang** is a Thai-language escrow platform for secure online transactions between buyers and sellers. It's a TypeScript monorepo with Turbo as the build orchestrator.

## Commands

### Root Level (Monorepo)
```bash
npm run dev        # Run all dev servers (client port 3000 + server port 4000)
npm run build      # Build all packages
npm run lint       # Lint all packages
npm run test       # Run tests in all packages
```

### Client
```bash
cd client
npm run dev                           # Start Next.js dev server
npm run test                          # Run Playwright E2E tests
npm run test:ui                       # Run tests with interactive UI
npm run test:headed                   # Run tests in headed browser mode
npx playwright test tests/foo.spec.ts # Run a single test file
npx playwright test -g "test name"    # Run tests matching pattern
```

### Server
```bash
cd server
npm run dev                    # Start Express with tsx watch
npm run prisma:generate        # Generate Prisma Client
npm run prisma:migrate         # Run database migrations (dev)
npm run prisma:migrate:deploy  # Deploy migrations (prod)
npm run prisma:studio          # Open Prisma GUI
npm run prisma:seed            # Seed database with admin user
npm run type-check             # Check types without emitting
```

### Docker
```bash
docker-compose up -d    # Start PostgreSQL and Redis locally
docker-compose down     # Stop containers
```

## Architecture

### Monorepo Structure
```
├── client/           # Next.js 14 frontend (React 18, Tailwind, Zustand)
├── server/           # Express.js backend (Prisma, PostgreSQL, Redis, BullMQ)
├── packages/         # Shared packages
├── turbo.json        # Build orchestration
└── docker-compose.yml
```

### Technology Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Radix UI, Zustand, React Hook Form + Zod
- **Backend**: Express.js, Prisma ORM, PostgreSQL, Redis, BullMQ, Socket.IO
- **Auth**: JWT with bcrypt password hashing
- **File Upload**: Cloudinary
- **Email**: Resend

### Client Architecture (`/client/src`)
- `app/` - Next.js app router with route groups: `(admin)`, `(auth)`, `(dashboard)`
- `components/ui/` - Radix UI wrapped components
- `stores/` - Zustand stores: `auth.store.ts`, `transaction.store.ts`
- `hooks/` - Custom hooks: `useAuth.ts`, `useSocket.ts`
- `lib/api.ts` - Axios instance with JWT interceptors

### Server Architecture (`/server/src`)
- `controllers/` - Request handlers
- `services/` - Business logic layer (auth, transaction, dispute, message, socket)
- `routes/` - Express routes grouped by feature
- `middlewares/` - Auth (JWT), validation (Zod), error handling
- `jobs/` - BullMQ async job handlers
- `prisma/schema.prisma` - Database schema

### Path Aliases
- Server: `@/*` → `src/*` with granular mappings (`@/config`, `@/controllers`, `@/services`, etc.)
- Client: `@/*` → `src/*`

## Key Patterns

### Authentication Flow
1. JWT tokens stored in localStorage
2. Axios interceptor adds token to Authorization header
3. `auth.middleware.ts` validates JWT on protected routes
4. Auto-logout on 401 responses

### Middleware Chain (Server)
Route middlewares must be chained in order:
1. `authMiddleware` - validates JWT, attaches user to request
2. `kycRequiredMiddleware` - requires verified KYC (optional)
3. `adminMiddleware` - requires ADMIN or SUPER_ADMIN role
4. `superAdminMiddleware` - requires SUPER_ADMIN role only

### Validation Pattern
Zod schemas in `server/src/validators/` validate request bodies. Use `validate.middleware.ts`:
```typescript
router.post('/route', validate(yourZodSchema), controller.handler);
```

### Real-time Communication
Socket.IO handles live chat, transaction updates, and notifications. Socket service in `server/src/services/socket.service.ts`.

### Database Models (Prisma)
Core models: User (with roles USER/ADMIN/SUPER_ADMIN), Transaction (with status workflow), PaymentSlip, Message, Dispute, KycDocument

Transaction status flow: WAITING_PAYMENT → PAYMENT_VERIFYING → PAID_HOLDING → DELIVERED_PENDING → COMPLETED (with DISPUTE_OPEN, CANCELLED, REFUNDED, EXPIRED branches)

## API Structure

Base URL: `http://localhost:4000/api/v1`

Routes: `/auth/*`, `/transactions/*`, `/disputes/*`, `/messages/*`, `/admin/*`

## Environment Variables

**Client** (`.env.local`): `NEXT_PUBLIC_API_URL`

**Server** (`.env`): `DATABASE_URL`, `REDIS_HOST/PORT/PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN`, `CLOUDINARY_*`, `RESEND_API_KEY`

## Development Setup

After running `docker-compose up -d` and migrations, seed the database:
```bash
cd server && npm run prisma:seed
```
Default admin: `admin@penklang.com` / `admin123`

## Deployment

- Backend: Railway (`server/railway.json`)
- Frontend: Vercel
