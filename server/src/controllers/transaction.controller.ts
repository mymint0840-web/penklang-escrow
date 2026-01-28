import { Request, Response, NextFunction } from 'express';
import {
  createTransaction,
  getTransactionById,
  getUserTransactions,
  joinTransaction,
  uploadPaymentSlip,
  confirmDelivery,
  acceptDelivery,
  cancelTransaction,
} from '@/services/transaction.service';
import { CreateTransactionInput, UploadSlipInput } from '@/types/transaction.types';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import { FeePayer, TransactionStatus } from '@prisma/client';

// Validation schemas
const createTransactionSchema = z.object({
  title: z.string().min(3, 'หัวเรื่องต้องมีอย่างน้อย 3 ตัวอักษร').max(200, 'หัวเรื่องต้องไม่เกิน 200 ตัวอักษร'),
  description: z.string().max(2000, 'รายละเอียดต้องไม่เกิน 2000 ตัวอักษร').optional(),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  feePayer: z.nativeEnum(FeePayer).optional(),
  inviteExpiry: z.string().datetime().optional(),
});

const uploadSlipSchema = z.object({
  imageUrl: z.string().url('URL ของรูปภาพไม่ถูกต้อง'),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  paymentMethod: z.string().optional(),
  transferDate: z.string().datetime().optional(),
  referenceNo: z.string().optional(),
});

/**
 * Create a new transaction
 * POST /api/transactions
 */
export async function createTransactionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get user ID from auth middleware (assumed to be set by auth middleware)
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ',
      });
    }

    // Validate request body
    const validationResult = createTransactionSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: validationResult.error.errors,
      });
    }

    const data: CreateTransactionInput = {
      ...validationResult.data,
      inviteExpiry: validationResult.data.inviteExpiry
        ? new Date(validationResult.data.inviteExpiry)
        : undefined,
    };

    const transaction = await createTransaction(userId, data);

    res.status(201).json({
      success: true,
      message: 'สร้างธุรกรรมสำเร็จ',
      data: transaction,
    });
  } catch (error: any) {
    logger.error('Error in createTransactionController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการสร้างธุรกรรม',
    });
  }
}

/**
 * Get transaction by ID
 * GET /api/transactions/:id
 */
export async function getTransactionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ',
      });
    }

    const transaction = await getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบธุรกรรม',
      });
    }

    // Check if user has access to this transaction
    if (
      transaction.sellerId !== userId &&
      transaction.buyerId !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงธุรกรรมนี้',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    logger.error('Error in getTransactionController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลธุรกรรม',
    });
  }
}

/**
 * Get user's transactions
 * GET /api/transactions
 */
export async function getMyTransactionsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ',
      });
    }

    // Parse query parameters
    const {
      status,
      role = 'all',
      search,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const filters = {
      status: status as TransactionStatus | undefined,
      role: role as 'seller' | 'buyer' | 'all',
      search: search as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await getUserTransactions(userId, filters);

    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('Error in getMyTransactionsController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลธุรกรรม',
    });
  }
}

/**
 * Join a transaction using invite code
 * POST /api/transactions/join/:inviteCode
 */
export async function joinTransactionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const inviteCode = req.params.inviteCode as string;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ',
      });
    }

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรหัสเชิญ',
      });
    }

    const transaction = await joinTransaction(userId, inviteCode);

    res.status(200).json({
      success: true,
      message: 'เข้าร่วมธุรกรรมสำเร็จ',
      data: transaction,
    });
  } catch (error: any) {
    logger.error('Error in joinTransactionController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการเข้าร่วมธุรกรรม',
    });
  }
}

/**
 * Upload payment slip
 * POST /api/transactions/:id/slip
 */
export async function uploadSlipController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ',
      });
    }

    // Validate request body
    const validationResult = uploadSlipSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: validationResult.error.errors,
      });
    }

    const slipData: UploadSlipInput = {
      ...validationResult.data,
      transferDate: validationResult.data.transferDate
        ? new Date(validationResult.data.transferDate)
        : undefined,
    };

    const transaction = await uploadPaymentSlip(id, userId, slipData);

    res.status(200).json({
      success: true,
      message: 'อัปโหลดสลิปการชำระเงินสำเร็จ',
      data: transaction,
    });
  } catch (error: any) {
    logger.error('Error in uploadSlipController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัปโหลดสลิป',
    });
  }
}

/**
 * Confirm delivery (seller)
 * POST /api/transactions/:id/deliver
 */
export async function confirmDeliveryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ',
      });
    }

    const transaction = await confirmDelivery(id, userId);

    res.status(200).json({
      success: true,
      message: 'ยืนยันการจัดส่งสำเร็จ',
      data: transaction,
    });
  } catch (error: any) {
    logger.error('Error in confirmDeliveryController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการยืนยันการจัดส่ง',
    });
  }
}

/**
 * Accept delivery (buyer)
 * POST /api/transactions/:id/accept
 */
export async function acceptDeliveryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ',
      });
    }

    const transaction = await acceptDelivery(id, userId);

    res.status(200).json({
      success: true,
      message: 'ยืนยันการรับสินค้าสำเร็จ',
      data: transaction,
    });
  } catch (error: any) {
    logger.error('Error in acceptDeliveryController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการยืนยันการรับสินค้า',
    });
  }
}

/**
 * Cancel transaction
 * POST /api/transactions/:id/cancel
 */
export async function cancelTransactionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ',
      });
    }

    const transaction = await cancelTransaction(id, userId, reason);

    res.status(200).json({
      success: true,
      message: 'ยกเลิกธุรกรรมสำเร็จ',
      data: transaction,
    });
  } catch (error: any) {
    logger.error('Error in cancelTransactionController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการยกเลิกธุรกรรม',
    });
  }
}
