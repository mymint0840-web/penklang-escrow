import { prisma } from '@/config/database';
import { MessageType } from '@prisma/client';
import { logger } from '@/utils/logger';

export interface CreateMessageInput {
  transactionId: string;
  senderId: string;
  type: MessageType;
  content?: string;
  imageUrl?: string;
}

export interface GetMessagesInput {
  transactionId: string;
  cursor?: string;
  limit?: number;
}

export interface MessageWithSender {
  id: string;
  transactionId: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  type: MessageType;
  content: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: Date;
}

export class MessageService {
  /**
   * Create a new message in a transaction
   */
  async createMessage(input: CreateMessageInput): Promise<MessageWithSender> {
    try {
      const { transactionId, senderId, type, content, imageUrl } = input;

      // Validate transaction exists and user has access
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        select: {
          id: true,
          sellerId: true,
          buyerId: true,
          status: true,
        },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Check if user is part of the transaction
      const isParticipant =
        transaction.sellerId === senderId || transaction.buyerId === senderId;

      if (!isParticipant) {
        throw new Error('User is not part of this transaction');
      }

      // Validate message content
      if (type === MessageType.TEXT && !content) {
        throw new Error('Text message must have content');
      }

      if (type === MessageType.IMAGE && !imageUrl) {
        throw new Error('Image message must have imageUrl');
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          transactionId,
          senderId,
          type,
          content: content || null,
          imageUrl: imageUrl || null,
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      logger.info(`Message created: ${message.id} in transaction ${transactionId}`);

      return message;
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a transaction with cursor-based pagination
   */
  async getMessages(input: GetMessagesInput): Promise<{
    messages: MessageWithSender[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    try {
      const { transactionId, cursor, limit = 50 } = input;

      // Validate limit
      const validLimit = Math.min(Math.max(1, limit), 100);

      // Build query
      const messages = await prisma.message.findMany({
        where: {
          transactionId,
          ...(cursor && {
            createdAt: {
              lt: new Date(cursor),
            },
          }),
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: validLimit + 1, // Fetch one extra to determine if there are more
      });

      // Check if there are more messages
      const hasMore = messages.length > validLimit;
      const resultMessages = hasMore ? messages.slice(0, validLimit) : messages;

      // Get next cursor
      const nextCursor =
        hasMore && resultMessages.length > 0
          ? resultMessages[resultMessages.length - 1].createdAt.toISOString()
          : null;

      logger.info(
        `Retrieved ${resultMessages.length} messages for transaction ${transactionId}`
      );

      return {
        messages: resultMessages,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read for a user in a transaction
   */
  async markAsRead(transactionId: string, userId: string): Promise<number> {
    try {
      // Get transaction to determine the other user
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        select: {
          sellerId: true,
          buyerId: true,
        },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Mark all messages from the other user as read
      const result = await prisma.message.updateMany({
        where: {
          transactionId,
          senderId: {
            not: userId,
          },
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      logger.info(
        `Marked ${result.count} messages as read in transaction ${transactionId} for user ${userId}`
      );

      return result.count;
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for a user in a transaction
   */
  async getUnreadCount(transactionId: string, userId: string): Promise<number> {
    try {
      const count = await prisma.message.count({
        where: {
          transactionId,
          senderId: {
            not: userId,
          },
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get total unread message count for a user across all transactions
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      // Get all transactions where user is buyer or seller
      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [{ sellerId: userId }, { buyerId: userId }],
        },
        select: {
          id: true,
        },
      });

      const transactionIds = transactions.map((t) => t.id);

      // Count unread messages
      const count = await prisma.message.count({
        where: {
          transactionId: {
            in: transactionIds,
          },
          senderId: {
            not: userId,
          },
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      logger.error('Error getting total unread count:', error);
      throw error;
    }
  }

  /**
   * Delete a message (soft delete by setting content to null)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: {
          senderId: true,
        },
      });

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.senderId !== userId) {
        throw new Error('You can only delete your own messages');
      }

      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: '[Message deleted]',
          imageUrl: null,
        },
      });

      logger.info(`Message ${messageId} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService();
