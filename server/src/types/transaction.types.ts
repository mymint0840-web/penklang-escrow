import { FeePayer, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Input types for creating transactions
export interface CreateTransactionInput {
  title: string;
  description?: string;
  amount: number;
  feePayer?: FeePayer;
  inviteExpiry?: Date;
}

// Input types for updating transactions
export interface UpdateTransactionInput {
  title?: string;
  description?: string;
  amount?: number;
  feePayer?: FeePayer;
  status?: TransactionStatus;
}

// Input types for joining a transaction
export interface JoinTransactionInput {
  inviteCode: string;
}

// Input types for uploading payment slip
export interface UploadSlipInput {
  imageUrl: string;
  amount: number;
  paymentMethod?: string;
  transferDate?: Date;
  referenceNo?: string;
}

// Response types
export interface TransactionResponse {
  id: string;
  title: string;
  description: string | null;
  amount: Decimal;
  feePercent: Decimal;
  feeAmount: Decimal;
  netAmount: Decimal;
  feePayer: FeePayer;
  status: TransactionStatus;
  sellerId: string;
  buyerId: string | null;
  inviteCode: string | null;
  inviteExpiry: Date | null;
  paidAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  autoReleaseAt: Date | null;
  expiresAt: Date | null;
  isAnonymized: boolean;
  createdAt: Date;
  updatedAt: Date;
  seller?: {
    id: string;
    fullName: string;
    displayName: string | null;
    avatarUrl: string | null;
    email: string;
  };
  buyer?: {
    id: string;
    fullName: string;
    displayName: string | null;
    avatarUrl: string | null;
    email: string;
  } | null;
  paymentSlips?: {
    id: string;
    imageUrl: string;
    amount: Decimal;
    status: string;
    createdAt: Date;
  }[];
}

// Filter types for listing transactions
export interface TransactionFilters {
  status?: TransactionStatus;
  role?: 'seller' | 'buyer' | 'all';
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Fee calculation result
export interface FeeCalculationResult {
  amount: number;
  feePercent: number;
  feeAmount: number;
  netAmount: number;
  feePayer: FeePayer;
}
