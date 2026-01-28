# คู่มือการติดตั้ง Penklang Escrow Platform

## ความต้องการของระบบ
- Node.js 18+
- PostgreSQL database
- Redis server

## ตัวเลือกการติดตั้ง Database

### ตัวเลือก 1: ใช้ Cloud Services (แนะนำสำหรับการทดสอบ)

#### PostgreSQL - ใช้ Neon (ฟรี)
1. ไปที่ https://neon.tech และสร้างบัญชี
2. สร้าง Project ใหม่
3. คัดลอก Connection String และใส่ใน `server/.env`:
   ```
   DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require"
   ```

#### Redis - ใช้ Upstash (ฟรี)
1. ไปที่ https://upstash.com และสร้างบัญชี
2. สร้าง Redis Database ใหม่
3. คัดลอก Connection Details และใส่ใน `server/.env`:
   ```
   REDIS_HOST=your-redis.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=your-password
   ```

### ตัวเลือก 2: ติดตั้ง Docker Desktop
1. ดาวน์โหลด Docker Desktop จาก https://www.docker.com/products/docker-desktop
2. ติดตั้งและเปิด Docker Desktop
3. รันคำสั่ง:
   ```bash
   docker-compose up -d
   ```

### ตัวเลือก 3: ติดตั้งบนเครื่อง (Windows)

#### PostgreSQL
1. ดาวน์โหลดจาก https://www.postgresql.org/download/windows/
2. ติดตั้งและสร้าง Database ชื่อ `escrow_db`
3. อัพเดท `server/.env`:
   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/escrow_db?schema=public"
   ```

#### Redis
1. ใช้ Windows Subsystem for Linux (WSL) หรือ
2. ดาวน์โหลดจาก https://github.com/microsoftarchive/redis/releases

## การติดตั้งและรัน

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
แก้ไขไฟล์ `server/.env` ให้มี connection string ที่ถูกต้อง

### 3. สร้าง Database Schema
```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 4. รัน Development Server
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 5. เข้าถึงแอพพลิเคชัน
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1
- API Health Check: http://localhost:4000/api/v1/health

## การทดสอบ API

### Health Check
```bash
curl http://localhost:4000/api/v1/health
```

### สร้างบัญชีผู้ใช้
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User",
    "phoneNumber": "0812345678"
  }'
```

## โครงสร้างโปรเจค
```
penklang/
├── client/          # Next.js Frontend
├── server/          # Express.js Backend
├── packages/        # Shared packages
├── docker-compose.yml
└── package.json     # Monorepo root
```

## คำสั่งที่ใช้บ่อย

```bash
# รัน dev ทั้ง frontend และ backend
npm run dev

# รัน build
npm run build

# รัน tests
npm run test

# Prisma commands
cd server
npx prisma studio      # เปิด GUI จัดการ database
npx prisma migrate dev # รัน migrations
npx prisma generate    # สร้าง Prisma Client
```
