import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/auth.service';
import { AppError } from '@/middlewares/errorHandler.middleware';
import { AuthRequest } from '@/types/auth.types';
import { logger } from '@/utils/logger';

/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints
 */
class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName, phone, displayName } = req.body;

      // Validate required fields
      if (!email || !password || !fullName) {
        throw new AppError('กรุณากรอกข้อมูลให้ครบถ้วน', 400, 'MISSING_REQUIRED_FIELDS');
      }

      // Register user
      const result = await authService.register({
        email,
        password,
        fullName,
        phone,
        displayName,
      });

      logger.info('User registration successful', {
        userId: result.user.id,
        email: result.user.email,
      });

      res.status(201).json({
        success: true,
        message: 'สมัครสมาชิกสำเร็จ',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw new AppError('กรุณากรอกอีเมลและรหัสผ่าน', 400, 'MISSING_CREDENTIALS');
      }

      // Get IP and user agent
      const ipAddress = (req.ip || req.socket.remoteAddress) as string;
      const userAgent = req.get('user-agent');

      // Login user
      const result = await authService.login(email, password, ipAddress, userAgent);

      logger.info('User login successful', {
        userId: result.user.id,
        email: result.user.email,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Validate refresh token
      if (!refreshToken) {
        throw new AppError('กรุณาระบุโทเค็นรีเฟรช', 400, 'MISSING_REFRESH_TOKEN');
      }

      // Refresh token
      const tokens = await authService.refreshToken(refreshToken);

      logger.info('Token refreshed successfully');

      res.status(200).json({
        success: true,
        message: 'รีเฟรชโทเค็นสำเร็จ',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        throw new AppError('ไม่พบข้อมูลการยืนยันตัวตน', 401, 'NO_AUTH_DATA');
      }

      // Logout user
      await authService.logout(authReq.user.userId, authReq.user.sessionId);

      logger.info('User logout successful', {
        userId: authReq.user.userId,
        sessionId: authReq.user.sessionId,
      });

      res.status(200).json({
        success: true,
        message: 'ออกจากระบบสำเร็จ',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      // Validate token
      if (!token) {
        throw new AppError('กรุณาระบุโทเค็นยืนยันอีเมล', 400, 'MISSING_TOKEN');
      }

      // Verify email
      await authService.verifyEmail(token);

      logger.info('Email verified successfully');

      res.status(200).json({
        success: true,
        message: 'ยืนยันอีเมลสำเร็จ',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      // Validate email
      if (!email) {
        throw new AppError('กรุณาระบุอีเมล', 400, 'MISSING_EMAIL');
      }

      // Request password reset
      await authService.forgotPassword(email);

      logger.info('Password reset requested', { email });

      res.status(200).json({
        success: true,
        message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      // Validate inputs
      if (!token || !newPassword) {
        throw new AppError('กรุณาระบุโทเค็นและรหัสผ่านใหม่', 400, 'MISSING_FIELDS');
      }

      // Reset password
      await authService.resetPassword(token, newPassword);

      logger.info('Password reset successful');

      res.status(200).json({
        success: true,
        message: 'รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        throw new AppError('ไม่พบข้อมูลการยืนยันตัวตน', 401, 'NO_AUTH_DATA');
      }

      // Get user data
      const { prisma } = await import('@/config/database');
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          displayName: true,
          avatarUrl: true,
          phone: true,
          bankName: true,
          bankAccountNo: true,
          bankAccountName: true,
          role: true,
          status: true,
          kycStatus: true,
          emailVerified: true,
          phoneVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('ไม่พบผู้ใช้งาน', 404, 'USER_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend email verification
   * POST /api/v1/auth/resend-verification
   */
  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        throw new AppError('ไม่พบข้อมูลการยืนยันตัวตน', 401, 'NO_AUTH_DATA');
      }

      // Get user
      const { prisma } = await import('@/config/database');
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.userId },
      });

      if (!user) {
        throw new AppError('ไม่พบผู้ใช้งาน', 404, 'USER_NOT_FOUND');
      }

      if (user.emailVerified) {
        throw new AppError('อีเมลได้รับการยืนยันแล้ว', 400, 'EMAIL_ALREADY_VERIFIED');
      }

      // Generate new verification token
      const { generateEmailVerificationToken } = await import('@/utils/jwt');
      const verificationToken = generateEmailVerificationToken(user.id);

      // Store token in Redis
      const { redis } = await import('@/config/redis');
      await redis.setex(
        `email-verification:${user.id}`,
        24 * 60 * 60,
        verificationToken
      );

      // TODO: Send verification email
      logger.info('Email verification resent', {
        userId: user.id,
        email: user.email,
      });

      res.status(200).json({
        success: true,
        message: 'ส่งอีเมลยืนยันใหม่แล้ว',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        throw new AppError('ไม่พบข้อมูลการยืนยันตัวตน', 401, 'NO_AUTH_DATA');
      }

      const { currentPassword, newPassword } = req.body;

      // Validate inputs
      if (!currentPassword || !newPassword) {
        throw new AppError('กรุณาระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่', 400, 'MISSING_FIELDS');
      }

      // Get user
      const { prisma } = await import('@/config/database');
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.userId },
        include: {
          passwordHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!user) {
        throw new AppError('ไม่พบผู้ใช้งาน', 404, 'USER_NOT_FOUND');
      }

      // Verify current password
      const { comparePassword, hashPassword, validatePasswordStrength } = await import('@/utils/password');
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);

      if (!isCurrentPasswordValid) {
        throw new AppError('รหัสผ่านปัจจุบันไม่ถูกต้อง', 401, 'INVALID_CURRENT_PASSWORD');
      }

      // Validate new password
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `รหัสผ่านไม่ตรงตามเงื่อนไข: ${passwordValidation.errors.join(', ')}`,
          400,
          'WEAK_PASSWORD'
        );
      }

      // Check if new password is same as current
      const isSameAsCurrent = await comparePassword(newPassword, user.passwordHash);
      if (isSameAsCurrent) {
        throw new AppError('รหัสผ่านใหม่ต้องไม่เหมือนกับรหัสผ่านปัจจุบัน', 400, 'SAME_PASSWORD');
      }

      // Check password history
      for (const history of user.passwordHistory) {
        const isMatch = await comparePassword(newPassword, history.passwordHash);
        if (isMatch) {
          throw new AppError(
            'รหัสผ่านนี้เคยถูกใช้งานแล้ว กรุณาใช้รหัสผ่านอื่น',
            400,
            'PASSWORD_RECENTLY_USED'
          );
        }
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Add to password history
      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash,
        },
      });

      // Delete all other sessions except current
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          id: { not: authReq.user.sessionId },
        },
      });

      logger.info('Password changed successfully', { userId: user.id });

      // Create security log
      await prisma.securityLog.create({
        data: {
          event: 'PASSWORD_CHANGED',
          userId: user.id,
          success: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'เปลี่ยนรหัสผ่านสำเร็จ',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
