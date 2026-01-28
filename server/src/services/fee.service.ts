import { prisma } from '@/config/database';
import { FeePayer } from '@prisma/client';
import { FeeCalculationResult } from '@/types/transaction.types';

/**
 * Get current system configuration including fee settings
 */
export async function getSystemConfig() {
  let config = await prisma.systemConfig.findUnique({
    where: { id: 'singleton' },
  });

  // If config doesn't exist, create default one
  if (!config) {
    config = await prisma.systemConfig.create({
      data: {
        id: 'singleton',
        feePercent: 3.5,
        minFee: 10,
        maxFee: 5000,
        paymentTimeoutHours: 24,
        autoReleaseHours: 72,
        minTransactionAmount: 100,
        maxTransactionAmount: 1000000,
      },
    });
  }

  return config;
}

/**
 * Calculate transaction fee based on amount and fee payer
 * @param amount - Transaction amount in THB
 * @param feePayer - Who pays the fee (BUYER, SELLER, or HALF_HALF)
 * @returns FeeCalculationResult with fee details
 */
export async function calculateFee(
  amount: number,
  feePayer: FeePayer = FeePayer.BUYER
): Promise<FeeCalculationResult> {
  // Validate amount
  if (amount <= 0) {
    throw new Error('จำนวนเงินต้องมากกว่า 0');
  }

  // Get system config for fee calculation
  const config = await getSystemConfig();

  const minAmount = Number(config.minTransactionAmount);
  const maxAmount = Number(config.maxTransactionAmount);

  // Validate amount range
  if (amount < minAmount) {
    throw new Error(`จำนวนเงินขั้นต่ำคือ ${minAmount} บาท`);
  }

  if (amount > maxAmount) {
    throw new Error(`จำนวนเงินสูงสุดคือ ${maxAmount.toLocaleString()} บาท`);
  }

  // Calculate fee
  const feePercent = Number(config.feePercent);
  let feeAmount = Math.ceil((amount * feePercent) / 100);

  // Apply min and max fee limits
  const minFee = Number(config.minFee);
  const maxFee = Number(config.maxFee);

  if (feeAmount < minFee) {
    feeAmount = minFee;
  } else if (feeAmount > maxFee) {
    feeAmount = maxFee;
  }

  // Calculate net amount based on fee payer
  let netAmount: number;

  switch (feePayer) {
    case FeePayer.BUYER:
      // Buyer pays fee on top of the amount
      netAmount = amount + feeAmount;
      break;

    case FeePayer.SELLER:
      // Seller receives amount minus fee
      netAmount = amount - feeAmount;
      if (netAmount <= 0) {
        throw new Error('ค่าธรรมเนียมสูงเกินไป ผู้ขายจะได้รับเงินไม่เพียงพอ');
      }
      break;

    case FeePayer.HALF_HALF:
      // Fee is split between buyer and seller
      const halfFee = Math.ceil(feeAmount / 2);
      netAmount = amount + halfFee;
      break;

    default:
      throw new Error('ประเภทผู้จ่ายค่าธรรมเนียมไม่ถูกต้อง');
  }

  return {
    amount,
    feePercent,
    feeAmount,
    netAmount,
    feePayer,
  };
}

/**
 * Calculate total amount buyer needs to pay
 * @param amount - Transaction amount
 * @param feePayer - Who pays the fee
 * @returns Total amount buyer needs to pay
 */
export async function calculateBuyerTotal(
  amount: number,
  feePayer: FeePayer
): Promise<number> {
  const calculation = await calculateFee(amount, feePayer);

  switch (feePayer) {
    case FeePayer.BUYER:
      return amount + calculation.feeAmount;

    case FeePayer.SELLER:
      return amount;

    case FeePayer.HALF_HALF:
      return amount + Math.ceil(calculation.feeAmount / 2);

    default:
      return amount;
  }
}

/**
 * Calculate amount seller will receive
 * @param amount - Transaction amount
 * @param feePayer - Who pays the fee
 * @returns Amount seller will receive
 */
export async function calculateSellerReceives(
  amount: number,
  feePayer: FeePayer
): Promise<number> {
  const calculation = await calculateFee(amount, feePayer);

  switch (feePayer) {
    case FeePayer.BUYER:
      return amount;

    case FeePayer.SELLER:
      return amount - calculation.feeAmount;

    case FeePayer.HALF_HALF:
      return amount - Math.ceil(calculation.feeAmount / 2);

    default:
      return amount;
  }
}

/**
 * Get fee breakdown for display purposes
 * @param amount - Transaction amount
 * @param feePayer - Who pays the fee
 * @returns Detailed fee breakdown
 */
export async function getFeeBreakdown(amount: number, feePayer: FeePayer) {
  const calculation = await calculateFee(amount, feePayer);
  const buyerTotal = await calculateBuyerTotal(amount, feePayer);
  const sellerReceives = await calculateSellerReceives(amount, feePayer);

  return {
    transactionAmount: amount,
    feePercent: calculation.feePercent,
    feeAmount: calculation.feeAmount,
    feePayer: feePayer,
    buyerPays: buyerTotal,
    sellerReceives: sellerReceives,
    breakdown: {
      buyerFee: feePayer === FeePayer.BUYER ? calculation.feeAmount : feePayer === FeePayer.HALF_HALF ? Math.ceil(calculation.feeAmount / 2) : 0,
      sellerFee: feePayer === FeePayer.SELLER ? calculation.feeAmount : feePayer === FeePayer.HALF_HALF ? Math.ceil(calculation.feeAmount / 2) : 0,
    },
  };
}
