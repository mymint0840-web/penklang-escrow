import { Router } from 'express';
import * as disputeController from '@/controllers/dispute.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * Dispute Routes
 * Base path: /api/v1
 * All routes require authentication
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

// Transaction dispute routes
router.post('/transactions/:id/dispute', disputeController.createDispute);
router.get('/transactions/:id/dispute', disputeController.getTransactionDisputes);

// General dispute routes
router.get('/disputes/:id', disputeController.getDisputeById);

export default router;
