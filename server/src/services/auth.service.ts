import { UserRole, UserStatus, KycStatus } from '@prisma/client';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { hashPassword, comparePassword, validatePasswordStrength } from '@/utils/password';
import {
  generateTokens,
  verifyRefreshToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  calculateExpiryDate,
} from '@/utils/jwt';
import { AppError } from '@/middlewares/errorHandler.middleware';
import { RegisterInput, LoginInput, AuthResponse } from '@/types/auth.types';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';

/**
 * Auth Service
 * Handles all authentication-related business logic
 */
class AuthService {
  /**
   * Register a new user
   * @param data - Registration data
   * @returns User with tokens
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    const { email, password, fullName, phone, displayName } = data;

    try {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `รหัสผ่านไม่ตรงตามเงื่อนไข: ${passwordValidation.errors.join(', ')}`,
          400,
          'WEAK_PASSWORD'
        );
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new AppError('อีเมลนี้ถูกใช้งานแล้ว', 400, 'EMAIL_EXISTS');
      }

      // Check if phone already exists (if provided)
      if (phone) {
        const existingPhone = await prisma.user.findUnique({
          where: { phone },
        });

        if (existingPhone) {
          throw new AppError('หมายเลขโทรศัพท์นี้ถูกใช้งานแล้ว', 400, 'PHONE_EXISTS');
        }
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          fullName,
          displayName: displayName || fullName,
          phone,
          status: UserStatus.ACTIVE,
          role: UserRole.USER,
          kycStatus: KycStatus.NONE,
          emailVerified: false,
          phoneVerified: false,
        },
      });

      // Store password in history
      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash,
        },
      });

      // Generate email verification token
      const verificationToken = generateEmailVerificationToken(user.id);

      // Store verification token in Redis (expires in 24 hours)
      await redis.setex(
        `email-verification:${user.id}`,
        24 * 60 * 60,
        verificationToken
      );

      // TODO: Send verification email
      logger.info('Email verification token generated', {
        userId: user.id,
        email: user.email,
      });

      // Create session and generate tokens
      const sessionId = nanoid();
      const tokens = generateTokens(
        { id: user.id, email: user.email, role: user.role },
        sessionId
      );

      const expiresAt = calculateExpiryDate(
        process.env.JWT_REFRESH_EXPIRES_IN || '30d'
      );

      const session = await prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt,
        },
      });

      // Log registration
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
      });

      // Create security log
      await prisma.securityLog.create({
        data: {
          event: 'USER_REGISTERED',
          userId: user.id,
          success: true,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          kycStatus: user.kycStatus,
          status: user.status,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          createdAt: user.createdAt,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Registration error:', error);
      throw new AppError('เกิดข้อผิดพลาดในการสมัครสมาชิก', 500, 'REGISTRATION_ERROR');
    }
  }

  /**
   * Login user
   * @param email - User email
   * @param password - User password
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @returns User with tokens
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Create security log for failed login
        await prisma.securityLog.create({
          data: {
            event: 'LOGIN_FAILED',
            success: false,
            details: { reason: 'User not found', email },
            ipAddress,
            userAgent,
          },
        });

        throw new AppError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401, 'INVALID_CREDENTIALS');
      }

      // Check user status
      if (user.status === UserStatus.BANNED) {
        throw new AppError('บัญชีของคุณถูกระงับการใช้งาน', 403, 'USER_BANNED');
      }

      if (user.status === UserStatus.INACTIVE) {
        throw new AppError('บัญชีของคุณไม่ได้เปิดใช้งาน', 403, 'USER_INACTIVE');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        // Create security log for failed login
        await prisma.securityLog.create({
          data: {
            event: 'LOGIN_FAILED',
            userId: user.id,
            success: false,
            details: { reason: 'Invalid password' },
            ipAddress,
            userAgent,
          },
        });

        throw new AppError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401, 'INVALID_CREDENTIALS');
      }

      // Create session and generate tokens
      const sessionId = nanoid();
      const tokens = generateTokens(
        { id: user.id, email: user.email, role: user.role },
        sessionId
      );

      const expiresAt = calculateExpiryDate(
        process.env.JWT_REFRESH_EXPIRES_IN || '30d'
      );

      const session = await prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Log successful login
      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        ipAddress,
      });

      // Create security log
      await prisma.securityLog.create({
        data: {
          event: 'LOGIN_SUCCESS',
          userId: user.id,
          success: true,
          ipAddress,
          userAgent,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          kycStatus: user.kycStatus,
          status: user.status,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          createdAt: user.createdAt,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Login error:', error);
      throw new AppError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 500, 'LOGIN_ERROR');
    }
  }

  /**
   * Refresh access token
   * @param refreshToken - Refresh token
   * @returns New tokens
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find session
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true },
      });

      if (!session || session.refreshToken !== refreshToken) {
        throw new AppError('โทเค็นรีเฟรชไม่ถูกต้อง', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Check if session expired
      if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } });
        throw new AppError('เซสชันหมดอายุแล้ว', 401, 'SESSION_EXPIRED');
      }

      // Check user status
      if (session.user.status !== UserStatus.ACTIVE) {
        throw new AppError('บัญชีของคุณไม่ได้เปิดใช้งาน', 403, 'USER_INACTIVE');
      }

      // Generate new tokens
      const tokens = generateTokens(
        {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
        session.id
      );

      // Update session
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });

      logger.info('Token refreshed', {
        userId: session.user.id,
        sessionId: session.id,
      });

      return tokens;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Token refresh error:', error);
      throw new AppError('เกิดข้อผิดพลาดในการรีเฟรชโทเค็น', 500, 'REFRESH_ERROR');
    }
  }

  /**
   * Logout user
   * @param userId - User ID
   * @param sessionId - Session ID
   */
  async logout(userId: string, sessionId: string): Promise<void> {
    try {
      // Delete session
      const deleted = await prisma.session.deleteMany({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (deleted.count === 0) {
        throw new AppError('ไม่พบเซสชัน', 404, 'SESSION_NOT_FOUND');
      }

      logger.info('User logged out', {
        userId,
        sessionId,
      });

      // Create security log
      await prisma.securityLog.create({
        data: {
          event: 'LOGOUT',
          userId,
          success: true,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Logout error:', error);
      throw new AppError('เกิดข้อผิดพลาดในการออกจากระบบ', 500, 'LOGOUT_ERROR');
    }
  }

  /**
   * Verify email
   * @param token - Verification token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      // Verify token
      const userId = verifyEmailVerificationToken(token);

      // Check if token exists in Redis
      const storedToken = await redis.get(`email-verification:${userId}`);

      if (!storedToken || storedToken !== token) {
        throw new AppError('โทเค็นยืนยันอีเมลไม่ถูกต้องหรือหมดอายุแล้ว', 400, 'INVALID_VERIFICATION_TOKEN');
      }

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });

      // Delete token from Redis
      await redis.del(`email-verification:${userId}`);

      logger.info('Email verified', { userId });

      // Create security log
      await prisma.securityLog.create({
        data: {
          event: 'EMAIL_VERIFIED',
          userId,
          success: true,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Email verification error:', error);
      throw new AppError('เกิดข้อผิดพลาดในการยืนยันอีเมล', 500, 'EMAIL_VERIFICATION_ERROR');
    }
  }

  /**
   * Request password reset
   * @param email - User email
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Don't reveal if email exists
        logger.info('Password reset requested for non-existent email', { email });
        return;
      }

      // Generate reset token
      const resetToken = generatePasswordResetToken(user.id);

      // Store token in Redis (expires in 1 hour)
      await redis.setex(`password-reset:${user.id}`, 60 * 60, resetToken);

      // TODO: Send reset email
      logger.info('Password reset token generated', {
        userId: user.id,
        email: user.email,
      });

      // Create security log
      await prisma.securityLog.create({
        data: {
          event: 'PASSWORD_RESET_REQUESTED',
          userId: user.id,
          success: true,
        },
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw new AppError('เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน', 500, 'FORGOT_PASSWORD_ERROR');
    }
  }

  /**
   * Reset password
   * @param token - Reset token
   * @param newPassword - New password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify token
      const userId = verifyPasswordResetToken(token);

      // Check if token exists in Redis
      const storedToken = await redis.get(`password-reset:${userId}`);

      if (!storedToken || storedToken !== token) {
        throw new AppError('โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว', 400, 'INVALID_RESET_TOKEN');
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

      // Get user with password history
      const user = await prisma.user.findUnique({
        where: { id: userId },
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

      // Check if password was used recently
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
        where: { id: userId },
        data: { passwordHash },
      });

      // Add to password history
      await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash,
        },
      });

      // Delete reset token
      await redis.del(`password-reset:${userId}`);

      // Delete all sessions (force re-login)
      await prisma.session.deleteMany({
        where: { userId },
      });

      logger.info('Password reset successfully', { userId });

      // Create security log
      await prisma.securityLog.create({
        data: {
          event: 'PASSWORD_RESET',
          userId,
          success: true,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Reset password error:', error);
      throw new AppError('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน', 500, 'RESET_PASSWORD_ERROR');
    }
  }
}

export const authService = new AuthService();
