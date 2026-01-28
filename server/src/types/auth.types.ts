import { UserRole, KycStatus, UserStatus } from '@prisma/client';

// Request input types
export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

// JWT Payload
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

// Auth Response
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: UserRole;
    kycStatus: KycStatus;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: Date;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
}

// User data for token generation
export interface UserForToken {
  id: string;
  email: string;
  role: UserRole;
}

// Extended Express Request
export interface AuthRequest extends Express.Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    sessionId: string;
  };
}
