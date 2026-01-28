export interface User {
  id: string;
  email: string;
  fullName: string;
  name?: string; // Alias for fullName for compatibility
  phone?: string;
  avatar?: string;
  avatarUrl?: string;
  role: 'buyer' | 'seller' | 'admin' | 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}
