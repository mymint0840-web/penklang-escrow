import { PrismaClient, UserRole, UserStatus, KycStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Super Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@penklang.com' },
    update: {},
    create: {
      email: 'admin@penklang.com',
      passwordHash: hashedPassword,
      fullName: 'Super Admin',
      displayName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      kycStatus: KycStatus.VERIFIED,
      emailVerified: true,
    },
  });

  console.log('Created Super Admin:', superAdmin.email);

  // Create System Config if not exists
  const systemConfig = await prisma.systemConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      feePercent: 3.5,
      minFee: 10,
      maxFee: 5000,
      paymentTimeoutHours: 24,
      autoReleaseHours: 72,
      minTransactionAmount: 100,
      maxTransactionAmount: 1000000,
      maintenanceMode: false,
    },
  });

  console.log('System config initialized');
  console.log('\n--- Admin Credentials ---');
  console.log('Email: admin@penklang.com');
  console.log('Password: admin123');
  console.log('-------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
