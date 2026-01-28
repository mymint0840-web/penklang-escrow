import { Request, Response, NextFunction } from 'express';
import { messageService } from '@/services/message.service';
import { socketService } from '@/services/socket.service';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { MessageType } from '@prisma/client';

export class MessageController {
  /**
   * Get messages for a transaction
   * GET /api/v1/transactions/:id/messages
   */
  async getMessages(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const transactionId = req.params.id as string;
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit as string | undefined;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      // Validate transaction access
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        select: {
          sellerId: true,
          buyerId: true,
        },
      });

      if (!transaction) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Transaction not found',
        });
        return;
      }

      const isParticipant =
        transaction.sellerId === userId || transaction.buyerId === userId;

      if (!isParticipant) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You are not authorized to view these messages',
        });
        return;
      }

      // Get messages
      const result = await messageService.getMessages({
        transactionId,
        cursor,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          messages: result.messages,
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      logger.error('Error in getMessages:', error);
      next(error);
    }
  }

  /**
   * Send a message via REST API (backup method)
   * POST /api/v1/transactions/:id/messages
   */
  async sendMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const transactionId = req.params.id as string;
      const { type, content, imageUrl } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      // Validate input
      if (!type || !Object.values(MessageType).includes(type)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid message type',
        });
        return;
      }

      if (type === MessageType.TEXT && !content) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Text message must have content',
        });
        return;
      }

      if (type === MessageType.IMAGE && !imageUrl) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Image message must have imageUrl',
        });
        return;
      }

      // Create message
      const message = await messageService.createMessage({
        transactionId,
        senderId: userId,
        type,
        content,
        imageUrl,
      });

      // Emit via socket if available
      const io = socketService.getIO();
      if (io) {
        const roomName = `transaction-${transactionId}`;
        io.to(roomName).emit('new-message', {
          id: message.id,
          transactionId: message.transactionId,
          senderId: message.senderId,
          sender: message.sender,
          type: message.type,
          content: message.content,
          imageUrl: message.imageUrl,
          isRead: message.isRead,
          createdAt: message.createdAt,
        });
      }

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      logger.error('Error in sendMessage:', error);

      if (error instanceof Error) {
        if (error.message === 'Transaction not found') {
          res.status(404).json({
            error: 'Not Found',
            message: error.message,
          });
          return;
        }

        if (error.message === 'User is not part of this transaction') {
          res.status(403).json({
            error: 'Forbidden',
            message: error.message,
          });
          return;
        }
      }

      next(error);
    }
  }

  /**
   * Get unread message count for a transaction
   * GET /api/v1/transactions/:id/messages/unread-count
   */
  async getUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const transactionId = req.params.id as string;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      const count = await messageService.getUnreadCount(transactionId, userId);

      res.status(200).json({
        success: true,
        data: {
          transactionId,
          unreadCount: count,
        },
      });
    } catch (error) {
      logger.error('Error in getUnreadCount:', error);
      next(error);
    }
  }

  /**
   * Get total unread message count for authenticated user
   * GET /api/v1/messages/unread-count
   */
  async getTotalUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      const count = await messageService.getTotalUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: {
          totalUnreadCount: count,
        },
      });
    } catch (error) {
      logger.error('Error in getTotalUnreadCount:', error);
      next(error);
    }
  }

  /**
   * Mark messages as read
   * POST /api/v1/transactions/:id/messages/mark-read
   */
  async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const transactionId = req.params.id as string;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      const count = await messageService.markAsRead(transactionId, userId);

      res.status(200).json({
        success: true,
        data: {
          transactionId,
          markedCount: count,
        },
      });
    } catch (error) {
      logger.error('Error in markAsRead:', error);
      next(error);
    }
  }

  /**
   * Delete a message
   * DELETE /api/v1/messages/:messageId
   */
  async deleteMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const messageId = req.params.messageId as string;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      await messageService.deleteMessage(messageId, userId);

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteMessage:', error);

      if (error instanceof Error) {
        if (error.message === 'Message not found') {
          res.status(404).json({
            error: 'Not Found',
            message: error.message,
          });
          return;
        }

        if (error.message === 'You can only delete your own messages') {
          res.status(403).json({
            error: 'Forbidden',
            message: error.message,
          });
          return;
        }
      }

      next(error);
    }
  }
}

export const messageController = new MessageController();
