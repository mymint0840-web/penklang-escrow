import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { messageService } from './message.service';
import {
  AuthenticatedSocket,
  MessagePayload,
  TypingPayload,
  MarkReadPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  NewMessageEvent,
  StatusUpdatePayload,
} from '@/types/socket.types';
import { MessageType } from '@prisma/client';

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Initialize Socket.IO server with authentication and event handlers
   */
  initializeSocket(io: SocketIOServer): void {
    this.io = io;

    // Authentication middleware
    io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
          email: string;
        };

        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            status: true,
          },
        });

        if (!user || user.status !== 'ACTIVE') {
          return next(new Error('User not found or inactive'));
        }

        // Attach user to socket
        (socket as any).userId = user.id;
        (socket as any).user = user;

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    io.on('connection', (socket: Socket) => {
      this.handleConnection(socket as unknown as AuthenticatedSocket);
    });

    logger.info('Socket.IO initialized');
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = (socket as any).userId;
    const user = (socket as any).user;

    logger.info(`User connected: ${user.fullName} (${socket.id})`);

    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socket.id);

    // Store user connection in Redis for presence tracking
    this.setUserOnline(userId, socket.id);

    // Register event handlers
    socket.on('join-room', (data: JoinRoomPayload) =>
      this.handleJoinRoom(socket, data)
    );
    socket.on('leave-room', (data: LeaveRoomPayload) =>
      this.handleLeaveRoom(socket, data)
    );
    socket.on('send-message', (data: MessagePayload) =>
      this.handleSendMessage(socket, data)
    );
    socket.on('typing', (data: TypingPayload) => this.handleTyping(socket, data));
    socket.on('mark-read', (data: MarkReadPayload) =>
      this.handleMarkRead(socket, data)
    );
    socket.on('disconnect', () => this.handleDisconnect(socket));

    // Send initial connection success
    socket.emit('connected', {
      userId: user.id,
      message: 'Connected to chat server',
    });
  }

  /**
   * Handle user joining a transaction room
   */
  private async handleJoinRoom(
    socket: AuthenticatedSocket,
    data: JoinRoomPayload
  ): Promise<void> {
    try {
      const userId = (socket as any).userId;
      const { transactionId } = data;

      // Validate transaction and user access
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
        socket.emit('error', { message: 'Transaction not found' });
        return;
      }

      // Check if user is part of the transaction
      const isParticipant =
        transaction.sellerId === userId || transaction.buyerId === userId;

      if (!isParticipant) {
        socket.emit('error', {
          message: 'You are not authorized to join this room',
        });
        return;
      }

      // Join the room
      const roomName = `transaction-${transactionId}`;
      socket.join(roomName);

      // Store room membership in Redis
      await redis.sadd(`room:${transactionId}:users`, userId);
      await redis.set(
        `user:${userId}:room:${transactionId}`,
        socket.id,
        'EX',
        3600
      );

      logger.info(`User ${userId} joined room ${roomName}`);

      // Notify others in the room
      socket.to(roomName).emit('user-joined', {
        userId,
        userName: (socket as any).user.fullName,
        timestamp: new Date(),
      });

      // Send confirmation to user
      socket.emit('room-joined', {
        transactionId,
        roomName,
      });

      // Get unread count
      const unreadCount = await messageService.getUnreadCount(
        transactionId,
        userId
      );
      socket.emit('unread-count', { transactionId, count: unreadCount });
    } catch (error) {
      logger.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Handle user leaving a transaction room
   */
  private async handleLeaveRoom(
    socket: AuthenticatedSocket,
    data: LeaveRoomPayload
  ): Promise<void> {
    try {
      const userId = (socket as any).userId;
      const { transactionId } = data;

      const roomName = `transaction-${transactionId}`;
      socket.leave(roomName);

      // Remove from Redis
      await redis.srem(`room:${transactionId}:users`, userId);
      await redis.del(`user:${userId}:room:${transactionId}`);

      logger.info(`User ${userId} left room ${roomName}`);

      // Notify others in the room
      socket.to(roomName).emit('user-left', {
        userId,
        userName: (socket as any).user.fullName,
        timestamp: new Date(),
      });

      socket.emit('room-left', { transactionId });
    } catch (error) {
      logger.error('Error leaving room:', error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  }

  /**
   * Handle sending a message
   */
  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: MessagePayload
  ): Promise<void> {
    try {
      const userId = (socket as any).userId;
      const user = (socket as any).user;
      const { transactionId, type, content, imageUrl } = data;

      // Create message in database
      const message = await messageService.createMessage({
        transactionId,
        senderId: userId,
        type: type || MessageType.TEXT,
        content,
        imageUrl,
      });

      // Prepare message event
      const messageEvent: NewMessageEvent = {
        id: message.id,
        transactionId: message.transactionId,
        senderId: message.senderId,
        sender: {
          id: user.id,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
        },
        type: message.type,
        content: message.content || undefined,
        imageUrl: message.imageUrl || undefined,
        isRead: false,
        createdAt: message.createdAt,
      };

      // Broadcast to room
      const roomName = `transaction-${transactionId}`;
      this.io!.to(roomName).emit('new-message', messageEvent);

      logger.info(`Message ${message.id} sent to room ${roomName}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle typing indicator
   */
  private async handleTyping(
    socket: AuthenticatedSocket,
    data: TypingPayload
  ): Promise<void> {
    try {
      const userId = (socket as any).userId;
      const user = (socket as any).user;
      const { transactionId, isTyping } = data;

      const roomName = `transaction-${transactionId}`;

      // Broadcast typing status to others in the room (not to sender)
      socket.to(roomName).emit('user-typing', {
        transactionId,
        userId,
        userName: user.fullName,
        isTyping,
      });
    } catch (error) {
      logger.error('Error handling typing:', error);
    }
  }

  /**
   * Handle marking messages as read
   */
  private async handleMarkRead(
    socket: AuthenticatedSocket,
    data: MarkReadPayload
  ): Promise<void> {
    try {
      const userId = (socket as any).userId;
      const { transactionId } = data;

      // Mark messages as read
      const count = await messageService.markAsRead(transactionId, userId);

      // Notify user
      socket.emit('messages-marked-read', {
        transactionId,
        count,
      });

      // Notify others in the room that messages have been read
      const roomName = `transaction-${transactionId}`;
      socket.to(roomName).emit('messages-read', {
        transactionId,
        userId,
        timestamp: new Date(),
      });

      logger.info(
        `Marked ${count} messages as read in transaction ${transactionId}`
      );
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  /**
   * Handle user disconnect
   */
  private async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    try {
      const userId = (socket as any).userId;
      const user = (socket as any).user;

      logger.info(`User disconnected: ${user?.fullName} (${socket.id})`);

      // Remove socket from connected users
      if (userId && this.connectedUsers.has(userId)) {
        this.connectedUsers.get(userId)!.delete(socket.id);
        if (this.connectedUsers.get(userId)!.size === 0) {
          this.connectedUsers.delete(userId);
          // User is completely offline
          await this.setUserOffline(userId);
        }
      }

      // Clean up Redis
      await redis.del(`socket:${socket.id}`);
    } catch (error) {
      logger.error('Error handling disconnect:', error);
    }
  }

  /**
   * Emit transaction status update to room
   */
  async emitStatusUpdate(data: StatusUpdatePayload): Promise<void> {
    if (!this.io) {
      logger.warn('Socket.IO not initialized');
      return;
    }

    try {
      const roomName = `transaction-${data.transactionId}`;
      this.io.to(roomName).emit('status-update', data);

      logger.info(
        `Status update emitted to room ${roomName}: ${data.status}`
      );
    } catch (error) {
      logger.error('Error emitting status update:', error);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(
    userId: string,
    notification: any
  ): Promise<void> {
    if (!this.io) {
      logger.warn('Socket.IO not initialized');
      return;
    }

    try {
      const socketIds = this.connectedUsers.get(userId);
      if (socketIds && socketIds.size > 0) {
        socketIds.forEach((socketId) => {
          this.io!.to(socketId).emit('notification', notification);
        });
        logger.info(`Notification sent to user ${userId}`);
      }
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * Set user online status in Redis
   */
  private async setUserOnline(userId: string, socketId: string): Promise<void> {
    try {
      await redis.set(`user:${userId}:online`, '1', 'EX', 3600);
      await redis.set(`socket:${socketId}`, userId, 'EX', 3600);
    } catch (error) {
      logger.error('Error setting user online:', error);
    }
  }

  /**
   * Set user offline status in Redis
   */
  private async setUserOffline(userId: string): Promise<void> {
    try {
      await redis.del(`user:${userId}:online`);
    } catch (error) {
      logger.error('Error setting user offline:', error);
    }
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const result = await redis.get(`user:${userId}:online`);
      return result === '1';
    } catch (error) {
      logger.error('Error checking user online status:', error);
      return false;
    }
  }

  /**
   * Get online users in a room
   */
  async getOnlineUsersInRoom(transactionId: string): Promise<string[]> {
    try {
      const userIds = await redis.smembers(`room:${transactionId}:users`);
      const onlineUsers: string[] = [];

      for (const userId of userIds) {
        const isOnline = await this.isUserOnline(userId);
        if (isOnline) {
          onlineUsers.push(userId);
        }
      }

      return onlineUsers;
    } catch (error) {
      logger.error('Error getting online users:', error);
      return [];
    }
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
