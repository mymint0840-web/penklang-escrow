import { z } from 'zod';

/**
 * Auth Validation Schemas
 * All Zod schemas for authentication endpoints
 */

/**
 * Register validation schema
 */
export const registerSchema = z.object({
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

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'กรุณาระบุอีเมล' })
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'กรุณาระบุรหัสผ่าน' }),
});

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'กรุณาระบุโทเค็นรีเฟรช' }),
});

/**
 * Verify email validation schema
 */
export const verifyEmailSchema = z.object({
  token: z.string({ required_error: 'กรุณาระบุโทเค็นยืนยันอีเมล' }),
});

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'กรุณาระบุอีเมล' })
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .toLowerCase()
    .trim(),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'กรุณาระบุโทเค็นรีเซ็ตรหัสผ่าน' }),
  newPassword: z
    .string({ required_error: 'กรุณาระบุรหัสผ่านใหม่' })
    .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
    .max(128, 'รหัสผ่านต้องมีความยาวไม่เกิน 128 ตัวอักษร'),
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'กรุณาระบุรหัสผ่านปัจจุบัน' }),
  newPassword: z
    .string({ required_error: 'กรุณาระบุรหัสผ่านใหม่' })
    .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
    .max(128, 'รหัสผ่านต้องมีความยาวไม่เกิน 128 ตัวอักษร'),
});
