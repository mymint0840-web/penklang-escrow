import { prisma } from '@/config/database';
import { TransactionStatus, FeePayer, PaymentSlipStatus } from '@prisma/client';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  UploadSlipInput,
  TransactionFilters,
  TransactionResponse,
} from '@/types/transaction.types';
import { calculateFee, getSystemConfig } from './fee.service';
import { generateUniqueInviteCode } from '@/utils/inviteCode';
import { logger } from '@/utils/logger';

/**
 * Create a new transaction
 * @param sellerId - ID of the seller creating the transaction
 * @param data - Transaction creation data
 * @returns Created transaction
 */
export async function createTransaction(
  sellerId: string,
  data: CreateTransactionInput
): Promise<TransactionResponse> {
  try {
    // Validate seller exists and is active
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    if (seller.status !== 'ACTIVE') {
      throw new Error('บัญชีของคุณไม่ได้เปิดใช้งาน');
    }

    // Calculate fees
    const feeCalculation = await calculateFee(
      data.amount,
      data.feePayer || FeePayer.BUYER
    );

    // Generate unique invite code
    const inviteCode = await generateUniqueInviteCode(async (code) => {
      const existing = await prisma.transaction.findUnique({
        where: { inviteCode: code },
      });
      return !!existing;
    });

    // Get system config for expiry times
    const config = await getSystemConfig();

    // Set invite expiry (default 7 days from now)
    const inviteExpiry =
      data.inviteExpiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        title: data.title,
        description: data.description,
        amount: data.amount,
        feePercent: feeCalculation.feePercent,
        feeAmount: feeCalculation.feeAmount,
        netAmount: feeCalculation.netAmount,
        feePayer: data.feePayer || FeePayer.BUYER,
        status: TransactionStatus.WAITING_PAYMENT,
        sellerId: sellerId,
        inviteCode: inviteCode,
        inviteExpiry: inviteExpiry,
        expiresAt: new Date(
          Date.now() + config.paymentTimeoutHours * 60 * 60 * 1000
        ),
      },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Transaction created: ${transaction.id} by seller ${sellerId}`);

    return transaction;
  } catch (error) {
    logger.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Get transaction by ID with all relations
 * @param id - Transaction ID
 * @returns Transaction details
 */
export async function getTransactionById(
  id: string
): Promise<TransactionResponse | null> {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        paymentSlips: {
          select: {
            id: true,
            imageUrl: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return transaction;
  } catch (error) {
    logger.error('Error getting transaction:', error);
    throw error;
  }
}

/**
 * Get transaction by invite code
 * @param code - Invite code
 * @returns Transaction details
 */
export async function getTransactionByInviteCode(
  code: string
): Promise<TransactionResponse | null> {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { inviteCode: code },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        paymentSlips: {
          select: {
            id: true,
            imageUrl: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return transaction;
  } catch (error) {
    logger.error('Error getting transaction by invite code:', error);
    throw error;
  }
}

/**
 * Get user's transactions with filters
 * @param userId - User ID
 * @param filters - Filter options
 * @returns List of transactions
 */
export async function getUserTransactions(
  userId: string,
  filters: TransactionFilters = {}
) {
  try {
    const {
      status,
      role = 'all',
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    // Build where clause
    const where: any = {};

    // Filter by role
    if (role === 'seller') {
      where.sellerId = userId;
    } else if (role === 'buyer') {
      where.buyerId = userId;
    } else {
      // all - user is either seller or buyer
      where.OR = [{ sellerId: userId }, { buyerId: userId }];
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by search term (title or description)
    if (search) {
      where.OR = [
        ...(where.OR || []),
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              displayName: true,
              avatarUrl: true,
              email: true,
            },
          },
          buyer: {
            select: {
              id: true,
              fullName: true,
              displayName: true,
              avatarUrl: true,
              email: true,
            },
          },
          paymentSlips: {
            select: {
              id: true,
              imageUrl: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
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
    logger.error('Error getting user transactions:', error);
    throw error;
  }
}

/**
 * Buyer joins a transaction using invite code
 * @param buyerId - ID of the buyer joining
 * @param inviteCode - Transaction invite code
 * @returns Updated transaction
 */
export async function joinTransaction(
  buyerId: string,
  inviteCode: string
): Promise<TransactionResponse> {
  try {
    // Get transaction by invite code
    const transaction = await getTransactionByInviteCode(inviteCode);

    if (!transaction) {
      throw new Error('ไม่พบธุรกรรมที่ต้องการเข้าร่วม');
    }

    // Validate transaction can be joined
    if (transaction.buyerId) {
      throw new Error('ธุรกรรมนี้มีผู้ซื้อแล้ว');
    }

    if (transaction.sellerId === buyerId) {
      throw new Error('คุณไม่สามารถเข้าร่วมธุรกรรมของตัวเองได้');
    }

    if (transaction.status !== TransactionStatus.WAITING_PAYMENT) {
      throw new Error('ธุรกรรมนี้ไม่สามารถเข้าร่วมได้ในขณะนี้');
    }

    // Check if invite code is expired
    if (transaction.inviteExpiry && transaction.inviteExpiry < new Date()) {
      throw new Error('รหัสเชิญหมดอายุแล้ว');
    }

    // Validate buyer
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    if (buyer.status !== 'ACTIVE') {
      throw new Error('บัญชีของคุณไม่ได้เปิดใช้งาน');
    }

    // Update transaction with buyer
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        buyerId: buyerId,
      },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        paymentSlips: {
          select: {
            id: true,
            imageUrl: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    logger.info(
      `Buyer ${buyerId} joined transaction ${transaction.id}`
    );

    return updatedTransaction;
  } catch (error) {
    logger.error('Error joining transaction:', error);
    throw error;
  }
}

/**
 * Upload payment slip for a transaction
 * @param transactionId - Transaction ID
 * @param buyerId - Buyer ID uploading the slip
 * @param slipData - Payment slip data
 * @returns Updated transaction
 */
export async function uploadPaymentSlip(
  transactionId: string,
  buyerId: string,
  slipData: UploadSlipInput
): Promise<TransactionResponse> {
  try {
    // Get transaction
    const transaction = await getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('ไม่พบธุรกรรม');
    }

    // Validate buyer is part of transaction
    if (transaction.buyerId !== buyerId) {
      throw new Error('คุณไม่ใช่ผู้ซื้อในธุรกรรมนี้');
    }

    // Validate transaction status
    if (
      transaction.status !== TransactionStatus.WAITING_PAYMENT &&
      transaction.status !== TransactionStatus.PAYMENT_VERIFYING
    ) {
      throw new Error('ไม่สามารถอัปโหลดสลิปในสถานะนี้ได้');
    }

    // Validate payment amount
    const expectedAmount = Number(transaction.netAmount);
    if (slipData.amount < expectedAmount * 0.99) {
      // Allow 1% tolerance
      throw new Error(
        `จำนวนเงินไม่ถูกต้อง ต้องชำระอย่างน้อย ${expectedAmount} บาท`
      );
    }

    // Create payment slip
    await prisma.paymentSlip.create({
      data: {
        transactionId: transactionId,
        imageUrl: slipData.imageUrl,
        amount: slipData.amount,
        paymentMethod: slipData.paymentMethod,
        transferDate: slipData.transferDate || new Date(),
        referenceNo: slipData.referenceNo,
        status: PaymentSlipStatus.PENDING,
      },
    });

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.PAYMENT_VERIFYING,
      },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        paymentSlips: {
          select: {
            id: true,
            imageUrl: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    logger.info(
      `Payment slip uploaded for transaction ${transactionId}`
    );

    return updatedTransaction;
  } catch (error) {
    logger.error('Error uploading payment slip:', error);
    throw error;
  }
}

/**
 * Admin verifies payment slip
 * @param transactionId - Transaction ID
 * @param adminId - Admin ID verifying the payment
 * @param approved - Whether payment is approved
 * @param rejectReason - Reason if rejected
 * @returns Updated transaction
 */
export async function verifyPayment(
  transactionId: string,
  adminId: string,
  approved: boolean,
  rejectReason?: string
): Promise<TransactionResponse> {
  try {
    // Get transaction with payment slips
    const transaction = await getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('ไม่พบธุรกรรม');
    }

    if (transaction.status !== TransactionStatus.PAYMENT_VERIFYING) {
      throw new Error('ธุรกรรมไม่ได้อยู่ในสถานะรอตรวจสอบการชำระเงิน');
    }

    // Get latest payment slip
    const latestSlip = transaction.paymentSlips?.[0];
    if (!latestSlip) {
      throw new Error('ไม่พบสลิปการชำระเงิน');
    }

    // Update payment slip status
    await prisma.paymentSlip.update({
      where: { id: latestSlip.id },
      data: {
        status: approved
          ? PaymentSlipStatus.APPROVED
          : PaymentSlipStatus.REJECTED,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectReason: rejectReason,
      },
    });

    // Get system config for auto-release time
    const config = await getSystemConfig();

    // Update transaction status
    const newStatus = approved
      ? TransactionStatus.PAID_HOLDING
      : TransactionStatus.WAITING_PAYMENT;

    const updateData: any = {
      status: newStatus,
    };

    if (approved) {
      updateData.paidAt = new Date();
      updateData.autoReleaseAt = new Date(
        Date.now() + config.autoReleaseHours * 60 * 60 * 1000
      );
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        paymentSlips: {
          select: {
            id: true,
            imageUrl: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    logger.info(
      `Payment ${approved ? 'approved' : 'rejected'} for transaction ${transactionId} by admin ${adminId}`
    );

    return updatedTransaction;
  } catch (error) {
    logger.error('Error verifying payment:', error);
    throw error;
  }
}

/**
 * Seller confirms delivery
 * @param transactionId - Transaction ID
 * @param sellerId - Seller ID confirming delivery
 * @returns Updated transaction
 */
export async function confirmDelivery(
  transactionId: string,
  sellerId: string
): Promise<TransactionResponse> {
  try {
    const transaction = await getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('ไม่พบธุรกรรม');
    }

    if (transaction.sellerId !== sellerId) {
      throw new Error('คุณไม่ใช่ผู้ขายในธุรกรรมนี้');
    }

    if (transaction.status !== TransactionStatus.PAID_HOLDING) {
      throw new Error('ไม่สามารถยืนยันการจัดส่งในสถานะนี้ได้');
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.DELIVERED_PENDING,
        deliveredAt: new Date(),
      },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        paymentSlips: {
          select: {
            id: true,
            imageUrl: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    logger.info(
      `Delivery confirmed for transaction ${transactionId} by seller ${sellerId}`
    );

    return updatedTransaction;
  } catch (error) {
    logger.error('Error confirming delivery:', error);
    throw error;
  }
}

/**
 * Buyer accepts delivery and completes transaction
 * @param transactionId - Transaction ID
 * @param buyerId - Buyer ID accepting delivery
 * @returns Updated transaction
 */
export async function acceptDelivery(
  transactionId: string,
  buyerId: string
): Promise<TransactionResponse> {
  try {
    const transaction = await getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('ไม่พบธุรกรรม');
    }

    if (transaction.buyerId !== buyerId) {
      throw new Error('คุณไม่ใช่ผู้ซื้อในธุรกรรมนี้');
    }

    if (transaction.status !== TransactionStatus.DELIVERED_PENDING) {
      throw new Error('ไม่สามารถยืนยันการรับสินค้าในสถานะนี้ได้');
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        paymentSlips: {
          select: {
            id: true,
            imageUrl: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    logger.info(
      `Transaction ${transactionId} completed by buyer ${buyerId}`
    );

    return updatedTransaction;
  } catch (error) {
    logger.error('Error accepting delivery:', error);
    throw error;
  }
}

/**
 * Cancel a transaction
 * @param transactionId - Transaction ID
 * @param userId - User ID requesting cancellation
 * @param reason - Cancellation reason
 * @returns Updated transaction
 */
export async function cancelTransaction(
  transactionId: string,
  userId: string,
  reason?: string
): Promise<TransactionResponse> {
  try {
    const transaction = await getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('ไม่พบธุรกรรม');
    }

    // Validate user is part of transaction
    if (
      transaction.sellerId !== userId &&
      transaction.buyerId !== userId
    ) {
      throw new Error('คุณไม่มีสิทธิ์ยกเลิกธุรกรรมนี้');
    }

    // Check if transaction can be cancelled
    if (
      transaction.status === TransactionStatus.COMPLETED ||
      transaction.status === TransactionStatus.CANCELLED ||
      transaction.status === TransactionStatus.REFUNDED
    ) {
      throw new Error('ไม่สามารถยกเลิกธุรกรรมในสถานะนี้ได้');
    }

    // If payment is already verified, cannot cancel without admin
    if (transaction.status === TransactionStatus.PAID_HOLDING) {
      throw new Error(
        'ธุรกรรมถูกชำระเงินแล้ว กรุณาติดต่อผู้ดูแลระบบเพื่อยกเลิก'
      );
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        paymentSlips: {
          select: {
            id: true,
            imageUrl: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    logger.info(
      `Transaction ${transactionId} cancelled by user ${userId}. Reason: ${reason || 'N/A'}`
    );

    return updatedTransaction;
  } catch (error) {
    logger.error('Error cancelling transaction:', error);
    throw error;
  }
}

/**
 * Update transaction status (admin only)
 * @param id - Transaction ID
 * @param status - New status
 * @returns Updated transaction
 */
export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus
): Promise<TransactionResponse> {
  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: { status },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        paymentSlips: {
          select: {
            id: true,
            imageUrl: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    logger.info(
      `Transaction ${id} status updated to ${status}`
    );

    return transaction;
  } catch (error) {
    logger.error('Error updating transaction status:', error);
    throw error;
  }
}
