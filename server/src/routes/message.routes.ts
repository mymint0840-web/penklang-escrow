import { Router } from 'express';
import { messageController } from '@/controllers/message.controller';

const router = Router();

/**
 * Message routes
 * All routes require authentication (middleware should be applied in main app)
 */

// Get total unread message count for authenticated user
router.get('/unread-count', messageController.getTotalUnreadCount.bind(messageController));

// Get messages for a transaction
router.get(
  '/transactions/:id/messages',
  messageController.getMessages.bind(messageController)
);

// Send a message to a transaction (REST backup)
router.post(
  '/transactions/:id/messages',
  messageController.sendMessage.bind(messageController)
);

// Get unread count for a specific transaction
router.get(
  '/transactions/:id/messages/unread-count',
  messageController.getUnreadCount.bind(messageController)
);

// Mark messages as read in a transaction
router.post(
  '/transactions/:id/messages/mark-read',
  messageController.markAsRead.bind(messageController)
);

// Delete a message
router.delete(
  '/messages/:messageId',
  messageController.deleteMessage.bind(messageController)
);

export default router;
