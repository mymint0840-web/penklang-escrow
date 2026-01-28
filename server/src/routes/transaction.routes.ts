import { Router } from 'express';
import {
  createTransactionController,
  getTransactionController,
  getMyTransactionsController,
  joinTransactionController,
  uploadSlipController,
  confirmDeliveryController,
  acceptDeliveryController,
  cancelTransactionController,
} from '@/controllers/transaction.controller';

const router = Router();

/**
 * Transaction Routes
 * All routes require authentication (add auth middleware before using)
 */

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private (Authenticated users)
 * @body    { title, description?, amount, feePayer?, inviteExpiry? }
 */
router.post('/', createTransactionController);

/**
 * @route   GET /api/transactions
 * @desc    Get current user's transactions
 * @access  Private (Authenticated users)
 * @query   { status?, role?, search?, startDate?, endDate?, page?, limit? }
 */
router.get('/', getMyTransactionsController);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction details by ID
 * @access  Private (Transaction participants only)
 * @params  { id: string }
 */
router.get('/:id', getTransactionController);

/**
 * @route   POST /api/transactions/join/:inviteCode
 * @desc    Join a transaction using invite code
 * @access  Private (Authenticated users)
 * @params  { inviteCode: string }
 */
router.post('/join/:inviteCode', joinTransactionController);

/**
 * @route   POST /api/transactions/:id/slip
 * @desc    Upload payment slip for a transaction
 * @access  Private (Buyer only)
 * @params  { id: string }
 * @body    { imageUrl, amount, paymentMethod?, transferDate?, referenceNo? }
 */
router.post('/:id/slip', uploadSlipController);

/**
 * @route   POST /api/transactions/:id/deliver
 * @desc    Confirm delivery (seller action)
 * @access  Private (Seller only)
 * @params  { id: string }
 */
router.post('/:id/deliver', confirmDeliveryController);

/**
 * @route   POST /api/transactions/:id/accept
 * @desc    Accept delivery and complete transaction (buyer action)
 * @access  Private (Buyer only)
 * @params  { id: string }
 */
router.post('/:id/accept', acceptDeliveryController);

/**
 * @route   POST /api/transactions/:id/cancel
 * @desc    Cancel a transaction
 * @access  Private (Transaction participants only)
 * @params  { id: string }
 * @body    { reason?: string }
 */
router.post('/:id/cancel', cancelTransactionController);

export default router;
