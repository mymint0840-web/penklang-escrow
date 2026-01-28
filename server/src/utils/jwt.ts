import jwt, { Secret } from 'jsonwebtoken';
import { TokenPayload, UserForToken } from '@/types/auth.types';
import { AppError } from '@/middlewares/errorHandler.middleware';

// JWT secrets from environment variables
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-token-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generate access and refresh tokens for a user
 * @param user - User data for token generation
 * @param sessionId - Session ID to include in token
 * @returns Object containing access token and refresh token
 */
export const generateTokens = (
  user: UserForToken,
  sessionId: string
): { accessToken: string; refreshToken: string } => {
  // Payload for JWT
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
  };

  // Generate access token
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'escrow-platform',
    audience: 'escrow-platform-api',
  } as jwt.SignOptions);

  // Generate refresh token
  const refreshToken = jwt.sign(
    { userId: user.id, sessionId },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'escrow-platform',
      audience: 'escrow-platform-api',
    } as jwt.SignOptions
  );

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Verify and decode access token
 * @param token - JWT access token
 * @returns Decoded token payload
 * @throws AppError if token is invalid or expired
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'escrow-platform',
      audience: 'escrow-platform-api',
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('โทเค็นหมดอายุแล้ว', 401, 'TOKEN_EXPIRED');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('โทเค็นไม่ถูกต้อง', 401, 'INVALID_TOKEN');
    } else {
      throw new AppError('เกิดข้อผิดพลาดในการตรวจสอบโทเค็น', 401, 'TOKEN_VERIFICATION_ERROR');
    }
  }
};

/**
 * Verify and decode refresh token
 * @param token - JWT refresh token
 * @returns Decoded token payload with userId and sessionId
 * @throws AppError if token is invalid or expired
 */
export const verifyRefreshToken = (
  token: string
): { userId: string; sessionId: string } => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'escrow-platform',
      audience: 'escrow-platform-api',
    }) as { userId: string; sessionId: string };

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('โทเค็นรีเฟรชหมดอายุแล้ว', 401, 'REFRESH_TOKEN_EXPIRED');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('โทเค็นรีเฟรชไม่ถูกต้อง', 401, 'INVALID_REFRESH_TOKEN');
    } else {
      throw new AppError('เกิดข้อผิดพลาดในการตรวจสอบโทเค็นรีเฟรช', 401, 'REFRESH_TOKEN_VERIFICATION_ERROR');
    }
  }
};

/**
 * Generate email verification token
 * @param userId - User ID
 * @returns Verification token
 */
export const generateEmailVerificationToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'email-verification' }, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'escrow-platform',
  });
};

/**
 * Verify email verification token
 * @param token - Verification token
 * @returns User ID from token
 * @throws AppError if token is invalid or expired
 */
export const verifyEmailVerificationToken = (token: string): string => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'escrow-platform',
    }) as { userId: string; type: string };

    if (decoded.type !== 'email-verification') {
      throw new AppError('โทเค็นไม่ถูกต้อง', 400, 'INVALID_TOKEN_TYPE');
    }

    return decoded.userId;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('โทเค็นยืนยันอีเมลหมดอายุแล้ว', 400, 'VERIFICATION_TOKEN_EXPIRED');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('โทเค็นยืนยันอีเมลไม่ถูกต้อง', 400, 'INVALID_VERIFICATION_TOKEN');
    } else if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError('เกิดข้อผิดพลาดในการตรวจสอบโทเค็นยืนยันอีเมล', 400, 'VERIFICATION_ERROR');
    }
  }
};

/**
 * Generate password reset token
 * @param userId - User ID
 * @returns Reset token
 */
export const generatePasswordResetToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'password-reset' }, JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'escrow-platform',
  });
};

/**
 * Verify password reset token
 * @param token - Reset token
 * @returns User ID from token
 * @throws AppError if token is invalid or expired
 */
export const verifyPasswordResetToken = (token: string): string => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'escrow-platform',
    }) as { userId: string; type: string };

    if (decoded.type !== 'password-reset') {
      throw new AppError('โทเค็นไม่ถูกต้อง', 400, 'INVALID_TOKEN_TYPE');
    }

    return decoded.userId;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('โทเค็นรีเซ็ตรหัสผ่านหมดอายุแล้ว', 400, 'RESET_TOKEN_EXPIRED');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง', 400, 'INVALID_RESET_TOKEN');
    } else if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError('เกิดข้อผิดพลาดในการตรวจสอบโทเค็นรีเซ็ตรหัสผ่าน', 400, 'RESET_VERIFICATION_ERROR');
    }
  }
};

/**
 * Calculate token expiration date
 * @param expiresIn - Expiration time string (e.g., "7d", "24h")
 * @returns Date object of expiration
 */
export const calculateExpiryDate = (expiresIn: string): Date => {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) {
    throw new AppError('รูปแบบเวลาหมดอายุไม่ถูกต้อง', 500, 'INVALID_EXPIRY_FORMAT');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const now = new Date();

  switch (unit) {
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 's':
      return new Date(now.getTime() + value * 1000);
    default:
      throw new AppError('หน่วยเวลาไม่ถูกต้อง', 500, 'INVALID_TIME_UNIT');
  }
};
