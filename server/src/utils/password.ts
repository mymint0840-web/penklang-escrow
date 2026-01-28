import bcrypt from 'bcrypt';
import { AppError } from '@/middlewares/errorHandler.middleware';

// Salt rounds for bcrypt (12 is recommended for security)
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with 12 salt rounds
 * @param password - Plain text password to hash
 * @returns Hashed password
 * @throws AppError if hashing fails
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Validate password is not empty
    if (!password || password.trim().length === 0) {
      throw new AppError('รหัสผ่านไม่สามารถเป็นค่าว่างได้', 400, 'EMPTY_PASSWORD');
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน', 500, 'PASSWORD_HASH_ERROR');
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to compare
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 * @throws AppError if comparison fails
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    // Validate inputs
    if (!password || !hashedPassword) {
      throw new AppError('รหัสผ่านหรือแฮชไม่ถูกต้อง', 400, 'INVALID_PASSWORD_INPUT');
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, hashedPassword);

    return isMatch;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน', 500, 'PASSWORD_COMPARE_ERROR');
  }
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and error messages
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check minimum length (at least 8 characters)
  if (password.length < 8) {
    errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
  }

  // Check maximum length (not more than 128 characters)
  if (password.length > 128) {
    errors.push('รหัสผ่านต้องมีความยาวไม่เกิน 128 ตัวอักษร');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว');
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate a random password
 * @param length - Length of password (default: 16)
 * @returns Random password string
 */
export const generateRandomPassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one character from each category
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

/**
 * Check if password has been used recently
 * @param password - Password to check
 * @param passwordHistory - Array of previously used password hashes
 * @param limit - Number of previous passwords to check (default: 5)
 * @returns True if password was used recently, false otherwise
 */
export const isPasswordRecentlyUsed = async (
  password: string,
  passwordHistory: string[],
  limit: number = 5
): Promise<boolean> => {
  try {
    // Check only the most recent passwords up to the limit
    const recentPasswords = passwordHistory.slice(-limit);

    // Compare with each password in history
    for (const oldHash of recentPasswords) {
      const isMatch = await comparePassword(password, oldHash);
      if (isMatch) {
        return true;
      }
    }

    return false;
  } catch (error) {
    throw new AppError('เกิดข้อผิดพลาดในการตรวจสอบประวัติรหัสผ่าน', 500, 'PASSWORD_HISTORY_CHECK_ERROR');
  }
};
