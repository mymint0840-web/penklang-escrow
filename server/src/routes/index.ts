import { Router } from 'express';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import adminRoutes from './admin.routes';
import disputeRoutes from './dispute.routes';

const router = Router();

/**
 * API Routes
 * Base path: /api/v1
 */

// Health check for API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1',
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// Transaction routes
router.use('/transactions', transactionRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Dispute routes
router.use('/', disputeRoutes);

export default router;
