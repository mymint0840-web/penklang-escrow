import { prisma } from '@/config/database';
import { DisputeStatus, DisputeResolution, TransactionStatus } from '@prisma/client';
import { logger } from '@/utils/logger';

/**
 * Create a new dispute for a transaction
 * @param transactionId - Transaction ID
 * @param userId - User ID creating the dispute
 * @param reason - Dispute reason
 * @param description - Detailed description
 * @param evidenceUrls - Array of evidence URLs
 * @returns Created dispute
 */
export async function createDispute(
  transactionId: string,
  userId: string,
  reason: string,
  description?: string,
  evidenceUrls: string[] = []
) {
  try {
    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        disputes: {
          where: {
            status: {
              in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW],
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('ไม่พบธุรกรรม');
    }

    // Validate user is part of transaction
    if (transaction.sellerId !== userId && transaction.buyerId !== userId) {
      throw new Error('คุณไม่มีสิทธิ์สร้างข้อพิพาทสำหรับธุรกรรมนี้');
    }

    // Check if there's already an active dispute
    if (transaction.disputes && transaction.disputes.length > 0) {
      throw new Error('ธุรกรรมนี้มีข้อพิพาทที่กำลังดำเนินการอยู่แล้ว');
    }

    // Validate transaction status - can only dispute certain statuses
    const disputeableStatuses: TransactionStatus[] = [
      TransactionStatus.PAID_HOLDING,
      TransactionStatus.DELIVERED_PENDING,
    ];

    if (!disputeableStatuses.includes(transaction.status)) {
      throw new Error('ไม่สามารถสร้างข้อพิพาทในสถานะธุรกรรมนี้ได้');
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        transactionId,
        createdBy: userId,
        reason,
        description,
        evidenceUrls,
        status: DisputeStatus.OPEN,
      },
      include: {
        transaction: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                email: true,
              },
            },
            buyer: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    // Update transaction status to DISPUTE_OPEN
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.DISPUTE_OPEN,
      },
    });

    logger.info(`Dispute created: ${dispute.id} for transaction ${transactionId} by user ${userId}`);

    return dispute;
  } catch (error) {
    logger.error('Error creating dispute:', error);
    throw error;
  }
}

/**
 * Get dispute by ID
 * @param id - Dispute ID
 * @returns Dispute details
 */
export async function getDisputeById(id: string) {
  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
            buyer: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        resolver: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return dispute;
  } catch (error) {
    logger.error('Error getting dispute:', error);
    throw error;
  }
}

/**
 * Get disputes by transaction ID
 * @param transactionId - Transaction ID
 * @returns List of disputes
 */
export async function getDisputesByTransaction(transactionId: string) {
  try {
    const disputes = await prisma.dispute.findMany({
      where: { transactionId },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        resolver: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return disputes;
  } catch (error) {
    logger.error('Error getting disputes by transaction:', error);
    throw error;
  }
}

/**
 * Resolve a dispute (admin only)
 * @param disputeId - Dispute ID
 * @param adminId - Admin ID resolving the dispute
 * @param resolution - Resolution type
 * @param note - Resolution note
 * @returns Updated dispute
 */
export async function resolveDispute(
  disputeId: string,
  adminId: string,
  resolution: DisputeResolution,
  note?: string
) {
  try {
    // Get dispute
    const dispute = await getDisputeById(disputeId);

    if (!dispute) {
      throw new Error('ไม่พบข้อพิพาท');
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new Error('ข้อพิพาทนี้ได้รับการแก้ไขแล้ว');
    }

    // Determine transaction status based on resolution
    let transactionStatus: TransactionStatus;
    switch (resolution) {
      case DisputeResolution.REFUND_BUYER:
        transactionStatus = TransactionStatus.REFUNDED;
        break;
      case DisputeResolution.RELEASE_SELLER:
        transactionStatus = TransactionStatus.COMPLETED;
        break;
      case DisputeResolution.PARTIAL_REFUND:
        transactionStatus = TransactionStatus.COMPLETED;
        break;
      default:
        throw new Error('ประเภทการแก้ไขข้อพิพาทไม่ถูกต้อง');
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
      include: {
        transaction: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                email: true,
              },
            },
            buyer: {
              select: {
                id: true,
                fullName: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    // Update transaction status
    await prisma.transaction.update({
      where: { id: dispute.transactionId },
      data: {
        status: transactionStatus,
        completedAt: transactionStatus === TransactionStatus.COMPLETED ? new Date() : undefined,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'RESOLVE_DISPUTE',
        targetType: 'Dispute',
        targetId: disputeId,
        details: {
          resolution,
          note,
          transactionId: dispute.transactionId,
        },
      },
    });

    logger.info(`Dispute ${disputeId} resolved by admin ${adminId} with resolution: ${resolution}`);

    return updatedDispute;
  } catch (error) {
    logger.error('Error resolving dispute:', error);
    throw error;
  }
}

/**
 * Update dispute status to under review
 * @param disputeId - Dispute ID
 * @param adminId - Admin ID
 * @returns Updated dispute
 */
export async function markDisputeUnderReview(disputeId: string, adminId: string) {
  try {
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.UNDER_REVIEW,
      },
      include: {
        transaction: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'MARK_DISPUTE_UNDER_REVIEW',
        targetType: 'Dispute',
        targetId: disputeId,
      },
    });

    logger.info(`Dispute ${disputeId} marked as under review by admin ${adminId}`);

    return dispute;
  } catch (error) {
    logger.error('Error marking dispute under review:', error);
    throw error;
  }
}
