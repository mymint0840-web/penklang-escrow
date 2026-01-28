/**
 * Chat Client Example for Escrow Platform
 *
 * This file demonstrates how to integrate the real-time chat system
 * in a React/TypeScript application.
 */

import { io, Socket } from 'socket.io-client';

// ===========================
// TYPES
// ===========================

interface Message {
  id: string;
  transactionId: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  type: 'TEXT' | 'IMAGE' | 'SYSTEM';
  content?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

interface TypingStatus {
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface StatusUpdate {
  transactionId: string;
  status: string;
  message: string;
  timestamp: Date;
}

// ===========================
// CHAT SERVICE
// ===========================

class ChatService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Connect to the chat server
   */
  connect(token: string, serverUrl: string = 'http://localhost:4000') {
    if (this.socket?.connected) {
      console.warn('Already connected to chat server');
      return;
    }

    this.socket = io(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  /**
   * Setup core event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.emit('connection-change', true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      this.emit('connection-change', false);
    });

    this.socket.on('connected', (data) => {
      console.log('Authentication successful:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    this.socket.on('new-message', (message: Message) => {
      this.emit('new-message', message);
    });

    this.socket.on('user-typing', (data: TypingStatus & { transactionId: string }) => {
      this.emit('user-typing', data);
    });

    this.socket.on('status-update', (update: StatusUpdate) => {
      this.emit('status-update', update);
    });

    this.socket.on('room-joined', (data) => {
      console.log('Room joined:', data);
      this.emit('room-joined', data);
    });

    this.socket.on('room-left', (data) => {
      console.log('Room left:', data);
      this.emit('room-left', data);
    });

    this.socket.on('unread-count', (data) => {
      this.emit('unread-count', data);
    });

    this.socket.on('messages-marked-read', (data) => {
      this.emit('messages-marked-read', data);
    });

    this.socket.on('messages-read', (data) => {
      this.emit('messages-read', data);
    });

    this.socket.on('user-joined', (data) => {
      this.emit('user-joined', data);
    });

    this.socket.on('user-left', (data) => {
      this.emit('user-left', data);
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });
  }

  /**
   * Join a transaction chat room
   */
  joinRoom(transactionId: string) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to chat server');
    }
    this.socket.emit('join-room', { transactionId });
  }

  /**
   * Leave a transaction chat room
   */
  leaveRoom(transactionId: string) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to chat server');
    }
    this.socket.emit('leave-room', { transactionId });
  }

  /**
   * Send a text message
   */
  sendTextMessage(transactionId: string, content: string) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to chat server');
    }
    this.socket.emit('send-message', {
      transactionId,
      type: 'TEXT',
      content,
    });
  }

  /**
   * Send an image message
   */
  sendImageMessage(transactionId: string, imageUrl: string) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to chat server');
    }
    this.socket.emit('send-message', {
      transactionId,
      type: 'IMAGE',
      imageUrl,
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(transactionId: string, isTyping: boolean) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', {
      transactionId,
      isTyping,
    });
  }

  /**
   * Mark messages as read
   */
  markAsRead(transactionId: string, userId: string) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to chat server');
    }
    this.socket.emit('mark-read', {
      transactionId,
      userId,
    });
  }

  /**
   * Register event listener
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Disconnect from chat server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const chatService = new ChatService();

// ===========================
// REACT HOOK
// ===========================

import { useEffect, useState, useCallback, useRef } from 'react';

export function useChat(transactionId: string, token: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Connect and join room
  useEffect(() => {
    try {
      chatService.connect(token);
      chatService.joinRoom(transactionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }

    // Cleanup
    return () => {
      chatService.leaveRoom(transactionId);
    };
  }, [transactionId, token]);

  // Listen for connection changes
  useEffect(() => {
    const handleConnectionChange = (status: boolean) => {
      setConnected(status);
      if (!status) {
        setError('Disconnected from server');
      } else {
        setError(null);
      }
    };

    chatService.on('connection-change', handleConnectionChange);

    return () => {
      chatService.off('connection-change', handleConnectionChange);
    };
  }, []);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.transactionId === transactionId) {
        setMessages(prev => [...prev, message]);

        // Auto mark as read if message is from other user
        if (message.senderId !== userId) {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    chatService.on('new-message', handleNewMessage);

    return () => {
      chatService.off('new-message', handleNewMessage);
    };
  }, [transactionId, userId]);

  // Listen for typing indicator
  useEffect(() => {
    const handleUserTyping = (data: TypingStatus & { transactionId: string }) => {
      if (data.transactionId === transactionId && data.userId !== userId) {
        setIsTyping(data.isTyping);

        // Clear typing indicator after 3 seconds
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    };

    chatService.on('user-typing', handleUserTyping);

    return () => {
      chatService.off('user-typing', handleUserTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [transactionId, userId]);

  // Listen for unread count
  useEffect(() => {
    const handleUnreadCount = (data: { transactionId: string; count: number }) => {
      if (data.transactionId === transactionId) {
        setUnreadCount(data.count);
      }
    };

    chatService.on('unread-count', handleUnreadCount);

    return () => {
      chatService.off('unread-count', handleUnreadCount);
    };
  }, [transactionId]);

  // Listen for messages marked as read
  useEffect(() => {
    const handleMessagesRead = (data: { transactionId: string }) => {
      if (data.transactionId === transactionId) {
        setUnreadCount(0);
      }
    };

    chatService.on('messages-marked-read', handleMessagesRead);

    return () => {
      chatService.off('messages-marked-read', handleMessagesRead);
    };
  }, [transactionId]);

  // Listen for errors
  useEffect(() => {
    const handleError = (error: any) => {
      setError(error.message || 'An error occurred');
    };

    chatService.on('error', handleError);

    return () => {
      chatService.off('error', handleError);
    };
  }, []);

  // Send message
  const sendMessage = useCallback((content: string) => {
    try {
      chatService.sendTextMessage(transactionId, content);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [transactionId]);

  // Send image
  const sendImage = useCallback((imageUrl: string) => {
    try {
      chatService.sendImageMessage(transactionId, imageUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send image');
    }
  }, [transactionId]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    chatService.sendTyping(transactionId, isTyping);
  }, [transactionId]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    try {
      chatService.markAsRead(transactionId, userId);
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, [transactionId, userId]);

  return {
    messages,
    isTyping,
    connected,
    unreadCount,
    error,
    sendMessage,
    sendImage,
    sendTyping,
    markAsRead,
  };
}

// ===========================
// REACT COMPONENT EXAMPLE
// ===========================

export function ChatComponent({ transactionId, token, userId }: {
  transactionId: string;
  token: string;
  userId: string;
}) {
  const {
    messages,
    isTyping,
    connected,
    unreadCount,
    error,
    sendMessage,
    sendTyping,
    markAsRead,
  } = useChat(transactionId, token, userId);

  const [inputValue, setInputValue] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Send typing indicator
    sendTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
      sendTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mark as read when component mounts or receives new messages
  useEffect(() => {
    if (unreadCount > 0) {
      markAsRead();
    }
  }, [messages.length, markAsRead, unreadCount]);

  return (
    <div className="chat-container">
      {/* Connection Status */}
      <div className={`status-bar ${connected ? 'connected' : 'disconnected'}`}>
        {connected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.senderId === userId ? 'sent' : 'received'}`}
          >
            <div className="message-header">
              <img src={message.sender.avatarUrl} alt={message.sender.fullName} />
              <span>{message.sender.fullName}</span>
            </div>
            <div className="message-content">
              {message.type === 'TEXT' && <p>{message.content}</p>}
              {message.type === 'IMAGE' && <img src={message.imageUrl} alt="message" />}
              {message.type === 'SYSTEM' && <em>{message.content}</em>}
            </div>
            <div className="message-footer">
              <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
              {message.isRead && <span>✓✓</span>}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="typing-indicator">
            Someone is typing...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="input-container">
        <textarea
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button onClick={handleSendMessage} disabled={!connected || !inputValue.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

// ===========================
// REST API CLIENT
// ===========================

export class ChatAPIClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async getMessages(transactionId: string, cursor?: string, limit?: number) {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', limit.toString());

    return this.request<{
      success: boolean;
      data: {
        messages: Message[];
        nextCursor: string | null;
        hasMore: boolean;
      };
    }>(`/api/v1/transactions/${transactionId}/messages?${params}`);
  }

  async sendMessage(transactionId: string, type: string, content?: string, imageUrl?: string) {
    return this.request<{
      success: boolean;
      data: Message;
    }>(`/api/v1/transactions/${transactionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ type, content, imageUrl }),
    });
  }

  async getUnreadCount(transactionId: string) {
    return this.request<{
      success: boolean;
      data: {
        transactionId: string;
        unreadCount: number;
      };
    }>(`/api/v1/transactions/${transactionId}/messages/unread-count`);
  }

  async getTotalUnreadCount() {
    return this.request<{
      success: boolean;
      data: {
        totalUnreadCount: number;
      };
    }>(`/api/v1/messages/unread-count`);
  }

  async markAsRead(transactionId: string) {
    return this.request<{
      success: boolean;
      data: {
        transactionId: string;
        markedCount: number;
      };
    }>(`/api/v1/transactions/${transactionId}/messages/mark-read`, {
      method: 'POST',
    });
  }

  async deleteMessage(messageId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/v1/messages/${messageId}`, {
      method: 'DELETE',
    });
  }
}
