import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/auth.types';
import * as disputeService from '@/services/dispute.service';
import { logger } from '@/utils/logger';

/**
 * Create a dispute for a transaction
 * POST /api/v1/transactions/:id/dispute
 */
export async function createDispute(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const transactionId = req.params.id as string;
    const { reason, description, evidenceUrls } = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลการยืนยันตัวตน',
      });
      return;
    }

    if (!reason) {
      res.status(400).json({
        success: false,
        message: 'กรุณาระบุเหตุผลในการสร้างข้อพิพาท',
      });
      return;
    }

    const dispute = await disputeService.createDispute(
      transactionId,
      authReq.user.userId,
      reason,
      description,
      evidenceUrls || []
    );

    res.status(201).json({
      success: true,
      message: 'สร้างข้อพิพาทสำเร็จ',
      data: dispute,
    });
  } catch (error) {
    logger.error('Error in createDispute controller:', error);
    next(error);
  }
}

/**
 * Get disputes for a transaction
 * GET /api/v1/transactions/:id/dispute
 */
export async function getTransactionDisputes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const transactionId = req.params.id as string;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลการยืนยันตัวตน',
      });
      return;
    }

    const disputes = await disputeService.getDisputesByTransaction(transactionId);

    res.status(200).json({
      success: true,
      data: disputes,
    });
  } catch (error) {
    logger.error('Error in getTransactionDisputes controller:', error);
    next(error);
  }
}

/**
 * Get dispute by ID
 * GET /api/v1/disputes/:id
 */
export async function getDisputeById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลการยืนยันตัวตน',
      });
      return;
    }

    const dispute = await disputeService.getDisputeById(id);

    if (!dispute) {
      res.status(404).json({
        success: false,
        message: 'ไม่พบข้อพิพาท',
      });
      return;
    }

    // Check if user has access to this dispute
    const userId = authReq.user.userId;
    const isParticipant =
      dispute.createdBy === userId ||
      dispute.transaction.sellerId === userId ||
      dispute.transaction.buyerId === userId;

    if (!isParticipant && authReq.user.role === 'USER') {
      res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงข้อพิพาทนี้',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    logger.error('Error in getDisputeById controller:', error);
    next(error);
  }
}
