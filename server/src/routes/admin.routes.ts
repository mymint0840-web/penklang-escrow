import { Router } from 'express';
import * as adminController from '@/controllers/admin.controller';
import { authMiddleware, adminMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * Admin Routes
 * Base path: /api/v1/admin
 * All routes require authentication and admin role
 */

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', adminController.updateUserStatus);

// KYC Management
router.get('/kyc/pending', adminController.getKycPendingList);
router.post('/kyc/:id/review', adminController.reviewKyc);

// Transaction Management
router.get('/transactions', adminController.getAllTransactions);
router.get('/transactions/:id', adminController.getTransactionById);

// Dispute Management
router.get('/disputes', adminController.getDisputes);
router.post('/disputes/:id/resolve', adminController.resolveDispute);

// System Configuration
router.get('/config', adminController.getSystemConfig);
router.patch('/config', adminController.updateSystemConfig);

export default router;
