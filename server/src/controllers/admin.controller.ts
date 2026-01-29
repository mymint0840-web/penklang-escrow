import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/auth.types';
import * as adminService from '@/services/admin.service';
import { resolveDispute as resolveDisputeService } from '@/services/dispute.service';
import { UserStatus, KycStatus, TransactionStatus, DisputeStatus, DisputeResolution } from '@prisma/client';
import { logger } from '@/utils/logger';

/**
 * Get dashboard statistics
 * GET /api/v1/admin/dashboard/stats
 */
export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await adminService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error in getDashboardStats controller:', error);
    next(error);
  }
}

/**
 * Get dashboard activity
 * GET /api/v1/admin/dashboard/activity
 */
export async function getDashboardActivity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const activity = await adminService.getDashboardActivity();

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    logger.error('Error in getDashboardActivity controller:', error);
    next(error);
  }
}

/**
 * Get users with filters
 * GET /api/v1/admin/users
 */
export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      status,
      kycStatus,
      role,
      search,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const filters: any = {};
    if (status) filters.status = status as UserStatus;
    if (kycStatus) filters.kycStatus = kycStatus as KycStatus;
    if (role) filters.role = role as string;
    if (search) filters.search = search as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const pagination: any = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await adminService.getUsers(filters, pagination);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error in getUsers controller:', error);
    next(error);
  }
}

/**
 * Get user by ID
 * GET /api/v1/admin/users/:id
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;

    const user = await adminService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error in getUserById controller:', error);
    next(error);
  }
}

/**
 * Update user status
 * PATCH /api/v1/admin/users/:id/status
 */
export async function updateUserStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลการยืนยันตัวตน',
      });
      return;
    }

    if (!status || !Object.values(UserStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: 'สถานะผู้ใช้งานไม่ถูกต้อง',
      });
      return;
    }

    const user = await adminService.updateUserStatus(
      id,
      status as UserStatus,
      authReq.user.userId
    );

    res.status(200).json({
      success: true,
      message: 'อัปเดตสถานะผู้ใช้งานสำเร็จ',
      data: user,
    });
  } catch (error) {
    logger.error('Error in updateUserStatus controller:', error);
    next(error);
  }
}

/**
 * Get pending KYC list
 * GET /api/v1/admin/kyc/pending
 */
export async function getKycPendingList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit } = req.query;

    const pagination: any = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await adminService.getKycPendingList(pagination);

    res.status(200).json({
      success: true,
      data: result.kycDocuments,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error in getKycPendingList controller:', error);
    next(error);
  }
}

/**
 * Review KYC document
 * POST /api/v1/admin/kyc/:id/review
 */
export async function reviewKyc(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { approved, note } = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลการยืนยันตัวตน',
      });
      return;
    }

    if (typeof approved !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'กรุณาระบุผลการอนุมัติ',
      });
      return;
    }

    const kycDocument = await adminService.reviewKyc(
      id,
      authReq.user.userId,
      approved,
      note
    );

    res.status(200).json({
      success: true,
      message: approved ? 'อนุมัติ KYC สำเร็จ' : 'ปฏิเสธ KYC สำเร็จ',
      data: kycDocument,
    });
  } catch (error) {
    logger.error('Error in reviewKyc controller:', error);
    next(error);
  }
}

/**
 * Get all transactions
 * GET /api/v1/admin/transactions
 */
export async function getAllTransactions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, search, startDate, endDate, page, limit } = req.query;

    const filters: any = {};
    if (status) filters.status = status as TransactionStatus;
    if (search) filters.search = search as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const pagination: any = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await adminService.getAllTransactions(filters, pagination);

    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error in getAllTransactions controller:', error);
    next(error);
  }
}

/**
 * Get transaction by ID
 * GET /api/v1/admin/transactions/:id
 */
export async function getTransactionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { getTransactionById } = await import('@/services/transaction.service');

    const transaction = await getTransactionById(id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'ไม่พบธุรกรรม',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    logger.error('Error in getTransactionById controller:', error);
    next(error);
  }
}

/**
 * Verify payment for a transaction
 * POST /api/v1/admin/transactions/:id/verify-payment
 */
export async function verifyPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { approved, rejectReason } = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลการยืนยันตัวตน',
      });
      return;
    }

    if (typeof approved !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'กรุณาระบุผลการอนุมัติ (approved: true/false)',
      });
      return;
    }

    const { verifyPayment: verifyPaymentService } = await import('@/services/transaction.service');

    const transaction = await verifyPaymentService(
      id,
      authReq.user.userId,
      approved,
      rejectReason
    );

    res.status(200).json({
      success: true,
      message: approved ? 'อนุมัติการชำระเงินสำเร็จ' : 'ปฏิเสธการชำระเงิน',
      data: transaction,
    });
  } catch (error) {
    logger.error('Error in verifyPayment controller:', error);
    next(error);
  }
}

/**
 * Get all disputes
 * GET /api/v1/admin/disputes
 */
export async function getDisputes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, page, limit } = req.query;

    const filters: any = {};
    if (status) filters.status = status as DisputeStatus;
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await adminService.getDisputes(filters);

    res.status(200).json({
      success: true,
      data: result.disputes,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error in getDisputes controller:', error);
    next(error);
  }
}

/**
 * Resolve dispute
 * POST /api/v1/admin/disputes/:id/resolve
 */
export async function resolveDispute(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { resolution, note } = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลการยืนยันตัวตน',
      });
      return;
    }

    if (!resolution || !Object.values(DisputeResolution).includes(resolution)) {
      res.status(400).json({
        success: false,
        message: 'ประเภทการแก้ไขข้อพิพาทไม่ถูกต้อง',
      });
      return;
    }

    const dispute = await resolveDisputeService(
      id,
      authReq.user.userId,
      resolution as DisputeResolution,
      note
    );

    res.status(200).json({
      success: true,
      message: 'แก้ไขข้อพิพาทสำเร็จ',
      data: dispute,
    });
  } catch (error) {
    logger.error('Error in resolveDispute controller:', error);
    next(error);
  }
}

/**
 * Get system configuration
 * GET /api/v1/admin/config
 */
export async function getSystemConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const config = await adminService.getSystemConfig();

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error('Error in getSystemConfig controller:', error);
    next(error);
  }
}

/**
 * Update system configuration
 * PATCH /api/v1/admin/config
 */
export async function updateSystemConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลการยืนยันตัวตน',
      });
      return;
    }

    const {
      feePercent,
      minFee,
      maxFee,
      paymentTimeoutHours,
      autoReleaseHours,
      minTransactionAmount,
      maxTransactionAmount,
      platformBankName,
      platformBankAccountNo,
      platformBankAccountName,
      maintenanceMode,
      transactionFeePercent,
      platformBankAccountNumber,
    } = req.body;

    const data: any = {};
    if (feePercent !== undefined) data.feePercent = parseFloat(feePercent);
    if (transactionFeePercent !== undefined) data.feePercent = parseFloat(transactionFeePercent);
    if (minFee !== undefined) data.minFee = parseFloat(minFee);
    if (maxFee !== undefined) data.maxFee = parseFloat(maxFee);
    if (paymentTimeoutHours !== undefined) data.paymentTimeoutHours = parseInt(paymentTimeoutHours);
    if (autoReleaseHours !== undefined) data.autoReleaseHours = parseInt(autoReleaseHours);
    if (minTransactionAmount !== undefined) data.minTransactionAmount = parseFloat(minTransactionAmount);
    if (maxTransactionAmount !== undefined) data.maxTransactionAmount = parseFloat(maxTransactionAmount);
    if (platformBankName !== undefined) data.platformBankName = platformBankName;
    if (platformBankAccountNo !== undefined) data.platformBankAccountNo = platformBankAccountNo;
    if (platformBankAccountNumber !== undefined) data.platformBankAccountNo = platformBankAccountNumber;
    if (platformBankAccountName !== undefined) data.platformBankAccountName = platformBankAccountName;
    if (maintenanceMode !== undefined) data.maintenanceMode = maintenanceMode;

    const config = await adminService.updateSystemConfig(data, authReq.user.userId);

    res.status(200).json({
      success: true,
      message: 'อัปเดตการตั้งค่าระบบสำเร็จ',
      data: config,
    });
  } catch (error) {
    logger.error('Error in updateSystemConfig controller:', error);
    next(error);
  }
}

/**
 * Toggle maintenance mode
 * POST /api/v1/admin/settings/maintenance-mode
 */
export async function toggleMaintenanceMode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { enabled } = req.body;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลการยืนยันตัวตน',
      });
      return;
    }

    if (typeof enabled !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'กรุณาระบุสถานะ (enabled: true/false)',
      });
      return;
    }

    const config = await adminService.updateSystemConfig(
      { maintenanceMode: enabled },
      authReq.user.userId
    );

    res.status(200).json({
      success: true,
      message: enabled ? 'เปิดโหมดปิดปรับปรุงสำเร็จ' : 'ปิดโหมดปิดปรับปรุงสำเร็จ',
      data: config,
    });
  } catch (error) {
    logger.error('Error in toggleMaintenanceMode controller:', error);
    next(error);
  }
}
