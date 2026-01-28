import { Request, Response, NextFunction } from 'express';
import { KycStatus, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@/config/database';
import { verifyAccessToken } from '@/utils/jwt';
import { AppError } from './errorHandler.middleware';
import { AuthRequest } from '@/types/auth.types';
import { logger } from '@/utils/logger';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request object
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('ไม่พบโทเค็นการยืนยันตัวตน', 401, 'NO_TOKEN');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AppError('โทเค็นไม่ถูกต้อง', 401, 'INVALID_TOKEN');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            kycStatus: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError('เซสชันไม่ถูกต้องหรือหมดอายุแล้ว', 401, 'INVALID_SESSION');
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({ where: { id: session.id } });
      throw new AppError('เซสชันหมดอายุแล้ว', 401, 'SESSION_EXPIRED');
    }

    // Check if user exists and is active
    if (!session.user) {
      throw new AppError('ไม่พบผู้ใช้งาน', 401, 'USER_NOT_FOUND');
    }

    if (session.user.status === UserStatus.BANNED) {
      throw new AppError('บัญชีของคุณถูกระงับการใช้งาน', 403, 'USER_BANNED');
    }

    if (session.user.status === UserStatus.INACTIVE) {
      throw new AppError('บัญชีของคุณไม่ได้เปิดใช้งาน', 403, 'USER_INACTIVE');
    }

    // Attach user data to request
    (req as AuthRequest).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    // Log authentication
    logger.info('User authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Authentication error:', error);
      next(new AppError('เกิดข้อผิดพลาดในการยืนยันตัวตน', 401, 'AUTH_ERROR'));
    }
  }
};

/**
 * KYC Required middleware
 * Checks if user's KYC status is VERIFIED
 * Must be used after authMiddleware
 */
export const kycRequiredMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      throw new AppError('ไม่พบข้อมูลการยืนยันตัวตน', 401, 'NO_AUTH_DATA');
    }

    // Get user's KYC status
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
      select: { kycStatus: true },
    });

    if (!user) {
      throw new AppError('ไม่พบผู้ใช้งาน', 404, 'USER_NOT_FOUND');
    }

    // Check KYC status
    if (user.kycStatus !== KycStatus.VERIFIED) {
      if (user.kycStatus === KycStatus.NONE) {
        throw new AppError(
          'กรุณายืนยันตัวตน (KYC) ก่อนใช้งานฟีเจอร์นี้',
          403,
          'KYC_NOT_SUBMITTED'
        );
      } else if (user.kycStatus === KycStatus.PENDING) {
        throw new AppError(
          'การยืนยันตัวตนของคุณอยู่ระหว่างการตรวจสอบ',
          403,
          'KYC_PENDING'
        );
      } else if (user.kycStatus === KycStatus.REJECTED) {
        throw new AppError(
          'การยืนยันตัวตนของคุณถูกปฏิเสธ กรุณายื่นเอกสารใหม่',
          403,
          'KYC_REJECTED'
        );
      }
    }

    logger.info('KYC verification passed', {
      userId: authReq.user.userId,
      kycStatus: user.kycStatus,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('KYC verification error:', error);
      next(new AppError('เกิดข้อผิดพลาดในการตรวจสอบสถานะ KYC', 500, 'KYC_CHECK_ERROR'));
    }
  }
};

/**
 * Admin middleware
 * Checks if user's role is ADMIN or SUPER_ADMIN
 * Must be used after authMiddleware
 */
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      throw new AppError('ไม่พบข้อมูลการยืนยันตัวตน', 401, 'NO_AUTH_DATA');
    }

    // Check if user is admin
    if (authReq.user.role !== UserRole.ADMIN && authReq.user.role !== UserRole.SUPER_ADMIN) {
      throw new AppError('คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    logger.info('Admin access granted', {
      userId: authReq.user.userId,
      role: authReq.user.role,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Admin check error:', error);
      next(new AppError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์', 500, 'ADMIN_CHECK_ERROR'));
    }
  }
};

/**
 * Super Admin middleware
 * Checks if user's role is SUPER_ADMIN
 * Must be used after authMiddleware
 */
export const superAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      throw new AppError('ไม่พบข้อมูลการยืนยันตัวตน', 401, 'NO_AUTH_DATA');
    }

    // Check if user is super admin
    if (authReq.user.role !== UserRole.SUPER_ADMIN) {
      throw new AppError('คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    logger.info('Super admin access granted', {
      userId: authReq.user.userId,
      role: authReq.user.role,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Super admin check error:', error);
      next(new AppError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์', 500, 'SUPER_ADMIN_CHECK_ERROR'));
    }
  }
};

/**
 * Email verification required middleware
 * Checks if user's email is verified
 * Must be used after authMiddleware
 */
export const emailVerifiedMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      throw new AppError('ไม่พบข้อมูลการยืนยันตัวตน', 401, 'NO_AUTH_DATA');
    }

    // Get user's email verification status
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
      select: { emailVerified: true },
    });

    if (!user) {
      throw new AppError('ไม่พบผู้ใช้งาน', 404, 'USER_NOT_FOUND');
    }

    // Check email verification
    if (!user.emailVerified) {
      throw new AppError(
        'กรุณายืนยันอีเมลของคุณก่อนใช้งานฟีเจอร์นี้',
        403,
        'EMAIL_NOT_VERIFIED'
      );
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Email verification check error:', error);
      next(new AppError('เกิดข้อผิดพลาดในการตรวจสอบการยืนยันอีเมล', 500, 'EMAIL_CHECK_ERROR'));
    }
  }
};
