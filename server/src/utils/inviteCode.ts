import { customAlphabet } from 'nanoid';

/**
 * Generate a unique invite code for transactions
 * Format: 8 characters using uppercase letters and numbers
 * Example: ABC123XY
 */
export function generateInviteCode(): string {
  // Use custom alphabet: uppercase letters and numbers, excluding similar-looking characters
  // Excluded: 0, O, I, 1, L to avoid confusion
  const alphabet = '234567889ABCDEFGHJKMNPQRSTUVWXYZ';

  // Create nanoid generator with 8 character length
  const nanoid = customAlphabet(alphabet, 8);

  return nanoid();
}

/**
 * Validate invite code format
 * @param code - The invite code to validate
 * @returns true if valid format, false otherwise
 */
export function validateInviteCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Check length
  if (code.length !== 8) {
    return false;
  }

  // Check if contains only valid characters
  const validPattern = /^[234567889ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;
  return validPattern.test(code);
}

/**
 * Generate a unique invite code with retry logic
 * Ensures the code doesn't already exist in the database
 * @param checkExists - Function to check if code exists in database
 * @param maxRetries - Maximum number of retry attempts (default: 10)
 * @returns A unique invite code
 */
export async function generateUniqueInviteCode(
  checkExists: (code: string) => Promise<boolean>,
  maxRetries: number = 10
): Promise<string> {
  let attempts = 0;

  while (attempts < maxRetries) {
    const code = generateInviteCode();
    const exists = await checkExists(code);

    if (!exists) {
      return code;
    }

    attempts++;
  }

  throw new Error('ไม่สามารถสร้างรหัสเชิญที่ไม่ซ้ำได้ กรุณาลองใหม่อีกครั้ง');
}
