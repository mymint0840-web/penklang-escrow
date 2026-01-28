import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { validateBody } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/middlewares/errorHandler.middleware';
import { z } from 'zod';

const router = Router();

/**
 * Validation schemas
 */

// Register schema
const registerSchema = z.object({
  email: z
    .string({ required_error: 'กรุณาระบุอีเมล' })
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'กรุณาระบุรหัสผ่าน' })
    .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
    .max(128, 'รหัสผ่านต้องมีความยาวไม่เกิน 128 ตัวอักษร'),
  fullName: z
    .string({ required_error: 'กรุณาระบุชื่อ-นามสกุล' })
    .min(2, 'ชื่อ-นามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษร')
    .max(100, 'ชื่อ-นามสกุลต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    .trim(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'หมายเลขโทรศัพท์ไม่ถูกต้อง ต้องเป็นตัวเลข 10 หลัก')
    .optional(),
  displayName: z
    .string()
    .min(2, 'ชื่อที่แสดงต้องมีความยาวอย่างน้อย 2 ตัวอักษร')
    .max(50, 'ชื่อที่แสดงต้องมีความยาวไม่เกิน 50 ตัวอักษร')
    .trim()
    .optional(),
});

// Login schema
const loginSchema = z.object({
  email: z
    .string({ required_error: 'กรุณาระบุอีเมล' })
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'กรุณาระบุรหัสผ่าน' }),
});

// Refresh token schema
const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'กรุณาระบุโทเค็นรีเฟรช' }),
});

// Verify email schema
const verifyEmailSchema = z.object({
  token: z.string({ required_error: 'กรุณาระบุโทเค็นยืนยันอีเมล' }),
});

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'กรุณาระบุอีเมล' })
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .toLowerCase()
    .trim(),
});

// Reset password schema
const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'กรุณาระบุโทเค็นรีเซ็ตรหัสผ่าน' }),
  newPassword: z
    .string({ required_error: 'กรุณาระบุรหัสผ่านใหม่' })
    .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
    .max(128, 'รหัสผ่านต้องมีความยาวไม่เกิน 128 ตัวอักษร'),
});

// Change password schema
const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'กรุณาระบุรหัสผ่านปัจจุบัน' }),
  newPassword: z
    .string({ required_error: 'กรุณาระบุรหัสผ่านใหม่' })
    .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
    .max(128, 'รหัสผ่านต้องมีความยาวไม่เกิน 128 ตัวอักษร'),
});

/**
 * Public Routes
 */

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(authController.register.bind(authController))
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(authController.login.bind(authController))
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  validateBody(refreshTokenSchema),
  asyncHandler(authController.refreshToken.bind(authController))
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email',
  validateBody(verifyEmailSchema),
  asyncHandler(authController.verifyEmail.bind(authController))
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword.bind(authController))
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword.bind(authController))
);

/**
 * Protected Routes (require authentication)
 */

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (delete session)
 * @access  Private
 */
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(authController.logout.bind(authController))
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(authController.getCurrentUser.bind(authController))
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post(
  '/resend-verification',
  authMiddleware,
  asyncHandler(authController.resendVerification.bind(authController))
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (requires current password)
 * @access  Private
 */
router.post(
  '/change-password',
  authMiddleware,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword.bind(authController))
);

export default router;
