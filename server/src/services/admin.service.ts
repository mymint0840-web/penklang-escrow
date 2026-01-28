import { prisma } from '@/config/database';
import { UserStatus, KycStatus, DisputeStatus, TransactionStatus } from '@prisma/client';
import { logger } from '@/utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get dashboard statistics
 * @returns Dashboard stats including transactions, GMV, revenue, disputes
 */
export async function getDashboardStats() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total counts
    const [
      totalUsers,
      totalTransactions,
      completedTransactions,
      activeTransactions,
      pendingDisputes,
      pendingKyc,
      totalRevenue,
      monthlyRevenue,
      totalGMV,
      monthlyGMV,
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: { status: UserStatus.ACTIVE },
      }),
      // Total transactions
      prisma.transaction.count(),
      // Completed transactions
      prisma.transaction.count({
        where: { status: TransactionStatus.COMPLETED },
      }),
      // Active transactions
      prisma.transaction.count({
        where: {
          status: {
            in: [
              TransactionStatus.WAITING_PAYMENT,
              TransactionStatus.PAYMENT_VERIFYING,
              TransactionStatus.PAID_HOLDING,
              TransactionStatus.DELIVERED_PENDING,
            ],
          },
        },
      }),
      // Pending disputes
      prisma.dispute.count({
        where: {
          status: {
            in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW],
          },
        },
      }),
      // Pending KYC
      prisma.kycDocument.count({
        where: { status: KycStatus.PENDING },
      }),
      // Total revenue (fee amounts from completed transactions)
      prisma.transaction.aggregate({
        _sum: { feeAmount: true },
        where: { status: TransactionStatus.COMPLETED },
      }),
      // Monthly revenue
      prisma.transaction.aggregate({
        _sum: { feeAmount: true },
        where: {
          status: TransactionStatus.COMPLETED,
          completedAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      // Total GMV (Gross Merchandise Value)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: TransactionStatus.COMPLETED },
      }),
      // Monthly GMV
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: TransactionStatus.COMPLETED,
          completedAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
          },
        },
      },
    });

    // Get transaction status breakdown
    const statusBreakdown = await prisma.transaction.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    return {
      users: {
        total: totalUsers,
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
        active: activeTransactions,
        statusBreakdown: statusBreakdown.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
      },
      financial: {
        totalRevenue: totalRevenue._sum.feeAmount || new Decimal(0),
        monthlyRevenue: monthlyRevenue._sum.feeAmount || new Decimal(0),
        totalGMV: totalGMV._sum.amount || new Decimal(0),
        monthlyGMV: monthlyGMV._sum.amount || new Decimal(0),
      },
      disputes: {
        pending: pendingDisputes,
      },
      kyc: {
        pending: pendingKyc,
      },
      recentTransactions,
    };
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    throw error;
  }
}

/**
 * Get users with filters and pagination
 * @param filters - Filter options
 * @param pagination - Pagination options
 * @returns List of users with pagination
 */
export async function getUsers(
  filters: {
    status?: UserStatus;
    kycStatus?: KycStatus;
    role?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  } = {},
  pagination: { page?: number; limit?: number } = {}
) {
  try {
    const { status, kycStatus, role, search, startDate, endDate } = filters;
    const { page = 1, limit = 20 } = pagination;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (kycStatus) {
      where.kycStatus = kycStatus;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          role: true,
          kycStatus: true,
          emailVerified: true,
          phoneVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              transactionsAsSeller: true,
              transactionsAsBuyer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting users:', error);
    throw error;
  }
}

/**
 * Get user by ID with detailed information
 * @param id - User ID
 * @returns User details
 */
export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        kycDocuments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        transactionsAsSeller: {
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        transactionsAsBuyer: {
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            transactionsAsSeller: true,
            transactionsAsBuyer: true,
            disputesCreated: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('ไม่พบผู้ใช้งาน');
    }

    return user;
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Update user status (ban/unban)
 * @param id - User ID
 * @param status - New status
 * @param adminId - Admin ID performing the action
 * @returns Updated user
 */
export async function updateUserStatus(
  id: string,
  status: UserStatus,
  adminId: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('ไม่พบผู้ใช้งาน');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        role: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE_USER_STATUS',
        targetType: 'User',
        targetId: id,
        previousValue: { status: user.status },
        newValue: { status },
      },
    });

    logger.info(`User ${id} status updated to ${status} by admin ${adminId}`);

    return updatedUser;
  } catch (error) {
    logger.error('Error updating user status:', error);
    throw error;
  }
}

/**
 * Get pending KYC documents
 * @param pagination - Pagination options
 * @returns List of pending KYC documents
 */
export async function getKycPendingList(pagination: { page?: number; limit?: number } = {}) {
  try {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [kycDocuments, total] = await Promise.all([
      prisma.kycDocument.findMany({
        where: { status: KycStatus.PENDING },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              displayName: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.kycDocument.count({
        where: { status: KycStatus.PENDING },
      }),
    ]);

    return {
      kycDocuments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting pending KYC list:', error);
    throw error;
  }
}

/**
 * Review KYC document
 * @param kycId - KYC Document ID
 * @param adminId - Admin ID reviewing
 * @param approved - Whether approved or rejected
 * @param note - Review note
 * @returns Updated KYC document
 */
export async function reviewKyc(
  kycId: string,
  adminId: string,
  approved: boolean,
  note?: string
) {
  try {
    const kycDocument = await prisma.kycDocument.findUnique({
      where: { id: kycId },
      include: { user: true },
    });

    if (!kycDocument) {
      throw new Error('ไม่พบเอกสาร KYC');
    }

    if (kycDocument.status !== KycStatus.PENDING) {
      throw new Error('เอกสาร KYC นี้ได้รับการตรวจสอบแล้ว');
    }

    const newStatus = approved ? KycStatus.VERIFIED : KycStatus.REJECTED;

    // Update KYC document
    const updatedKyc = await prisma.kycDocument.update({
      where: { id: kycId },
      data: {
        status: newStatus,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Update user's KYC status
    await prisma.user.update({
      where: { id: kycDocument.userId },
      data: { kycStatus: newStatus },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'REVIEW_KYC',
        targetType: 'KycDocument',
        targetId: kycId,
        details: {
          approved,
          note,
          userId: kycDocument.userId,
        },
        previousValue: { status: KycStatus.PENDING },
        newValue: { status: newStatus },
      },
    });

    logger.info(`KYC ${kycId} ${approved ? 'approved' : 'rejected'} by admin ${adminId}`);

    return updatedKyc;
  } catch (error) {
    logger.error('Error reviewing KYC:', error);
    throw error;
  }
}

/**
 * Get all transactions with filters and pagination (admin)
 * @param filters - Filter options
 * @param pagination - Pagination options
 * @returns List of transactions
 */
export async function getAllTransactions(
  filters: {
    status?: TransactionStatus;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  } = {},
  pagination: { page?: number; limit?: number } = {}
) {
  try {
    const { status, search, startDate, endDate } = filters;
    const { page = 1, limit = 20 } = pagination;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { inviteCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              email: true,
              fullName: true,
              displayName: true,
            },
          },
          buyer: {
            select: {
              id: true,
              email: true,
              fullName: true,
              displayName: true,
            },
          },
          paymentSlips: {
            select: {
              id: true,
              status: true,
              amount: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          disputes: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting all transactions:', error);
    throw error;
  }
}

/**
 * Get disputes with filters (admin)
 * @param filters - Filter options
 * @returns List of disputes
 */
export async function getDisputes(
  filters: {
    status?: DisputeStatus;
    page?: number;
    limit?: number;
  } = {}
) {
  try {
    const { status, page = 1, limit = 20 } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          transaction: {
            include: {
              seller: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  displayName: true,
                },
              },
              buyer: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  displayName: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              email: true,
              fullName: true,
              displayName: true,
            },
          },
          resolver: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      disputes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting disputes:', error);
    throw error;
  }
}

/**
 * Get system configuration
 * @returns System config
 */
export async function getSystemConfig() {
  try {
    let config = await prisma.systemConfig.findUnique({
      where: { id: 'singleton' },
      include: {
        updater: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Create default config if it doesn't exist
    if (!config) {
      config = await prisma.systemConfig.create({
        data: { id: 'singleton' },
        include: {
          updater: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
    }

    return config;
  } catch (error) {
    logger.error('Error getting system config:', error);
    throw error;
  }
}

/**
 * Update system configuration
 * @param data - Config data to update
 * @param adminId - Admin ID performing the update
 * @returns Updated config
 */
export async function updateSystemConfig(
  data: {
    feePercent?: number;
    minFee?: number;
    maxFee?: number;
    paymentTimeoutHours?: number;
    autoReleaseHours?: number;
    minTransactionAmount?: number;
    maxTransactionAmount?: number;
    platformBankName?: string;
    platformBankAccountNo?: string;
    platformBankAccountName?: string;
    maintenanceMode?: boolean;
  },
  adminId: string
) {
  try {
    const currentConfig = await getSystemConfig();

    const updatedConfig = await prisma.systemConfig.update({
      where: { id: 'singleton' },
      data: {
        ...data,
        updatedBy: adminId,
      },
      include: {
        updater: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE_SYSTEM_CONFIG',
        targetType: 'SystemConfig',
        targetId: 'singleton',
        previousValue: currentConfig,
        newValue: data,
      },
    });

    logger.info(`System config updated by admin ${adminId}`);

    return updatedConfig;
  } catch (error) {
    logger.error('Error updating system config:', error);
    throw error;
  }
}
