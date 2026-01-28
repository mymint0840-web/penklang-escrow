# Real-time Chat System Documentation

## Overview

The Escrow Platform includes a complete real-time chat system built with Socket.IO, enabling buyers and sellers to communicate within transactions. The system supports text messages, images, typing indicators, read receipts, and online presence tracking.

## Architecture

### Components

1. **Socket Service** (`src/services/socket.service.ts`)
   - Manages WebSocket connections
   - Handles authentication
   - Manages rooms and user presence
   - Broadcasts events to connected clients

2. **Message Service** (`src/services/message.service.ts`)
   - Database operations for messages
   - Message validation and authorization
   - Cursor-based pagination
   - Unread count tracking

3. **Message Controller** (`src/controllers/message.controller.ts`)
   - REST API endpoints for messages
   - Request validation
   - Error handling

4. **Message Routes** (`src/routes/message.routes.ts`)
   - RESTful API routes for message operations

5. **Socket Types** (`src/types/socket.types.ts`)
   - TypeScript interfaces for socket events and payloads

## Features

### Core Features

- Real-time message delivery
- Text and image messages
- System messages for transaction events
- Typing indicators
- Read receipts
- Online/offline presence
- Message history with pagination
- Unread message counts

### Security Features

- JWT-based authentication
- Transaction-level authorization
- User verification before joining rooms
- Redis-based session tracking

## Socket.IO Events

### Client to Server

#### `connection`
Establish WebSocket connection with authentication.

**Authentication:**
```javascript
const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### `join-room`
Join a transaction chat room.

**Payload:**
```typescript
{
  transactionId: string
}
```

**Response:**
- `room-joined`: Confirmation with room details
- `unread-count`: Number of unread messages
- `error`: If joining fails

#### `leave-room`
Leave a transaction chat room.

**Payload:**
```typescript
{
  transactionId: string
}
```

**Response:**
- `room-left`: Confirmation

#### `send-message`
Send a message to the transaction room.

**Payload:**
```typescript
{
  transactionId: string,
  type: 'TEXT' | 'IMAGE' | 'SYSTEM',
  content?: string,
  imageUrl?: string
}
```

**Broadcasts:**
- `new-message`: To all users in the room

#### `typing`
Send typing indicator.

**Payload:**
```typescript
{
  transactionId: string,
  isTyping: boolean
}
```

**Broadcasts:**
- `user-typing`: To other users in the room

#### `mark-read`
Mark messages as read.

**Payload:**
```typescript
{
  transactionId: string,
  userId: string
}
```

**Response:**
- `messages-marked-read`: Confirmation with count

**Broadcasts:**
- `messages-read`: To other users in the room

### Server to Client

#### `connected`
Sent after successful connection.

**Payload:**
```typescript
{
  userId: string,
  message: string
}
```

#### `new-message`
Broadcast when a new message is sent.

**Payload:**
```typescript
{
  id: string,
  transactionId: string,
  senderId: string,
  sender: {
    id: string,
    fullName: string,
    avatarUrl?: string
  },
  type: 'TEXT' | 'IMAGE' | 'SYSTEM',
  content?: string,
  imageUrl?: string,
  isRead: boolean,
  createdAt: Date
}
```

#### `user-typing`
Broadcast when a user is typing.

**Payload:**
```typescript
{
  transactionId: string,
  userId: string,
  userName: string,
  isTyping: boolean
}
```

#### `status-update`
Broadcast when transaction status changes.

**Payload:**
```typescript
{
  transactionId: string,
  status: string,
  message: string,
  timestamp: Date
}
```

#### `user-joined`
Broadcast when a user joins the room.

**Payload:**
```typescript
{
  userId: string,
  userName: string,
  timestamp: Date
}
```

#### `user-left`
Broadcast when a user leaves the room.

**Payload:**
```typescript
{
  userId: string,
  userName: string,
  timestamp: Date
}
```

#### `messages-read`
Broadcast when messages are marked as read.

**Payload:**
```typescript
{
  transactionId: string,
  userId: string,
  timestamp: Date
}
```

#### `error`
Sent when an error occurs.

**Payload:**
```typescript
{
  message: string
}
```

#### `notification`
Send notification to specific user.

**Payload:**
```typescript
{
  type: string,
  title: string,
  message: string,
  transactionId?: string
}
```

## REST API Endpoints

All endpoints require authentication via JWT token in the `Authorization` header.

### Get Messages

```
GET /api/v1/transactions/:id/messages
```

**Query Parameters:**
- `cursor` (optional): ISO date string for pagination
- `limit` (optional): Number of messages to fetch (1-100, default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg123",
        "transactionId": "txn123",
        "senderId": "user123",
        "sender": {
          "id": "user123",
          "fullName": "John Doe",
          "avatarUrl": "https://..."
        },
        "type": "TEXT",
        "content": "Hello!",
        "isRead": false,
        "createdAt": "2024-01-20T10:30:00Z"
      }
    ],
    "nextCursor": "2024-01-20T10:25:00Z",
    "hasMore": true
  }
}
```

### Send Message

```
POST /api/v1/transactions/:id/messages
```

**Body:**
```json
{
  "type": "TEXT",
  "content": "Hello!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg123",
    "transactionId": "txn123",
    "senderId": "user123",
    "sender": {
      "id": "user123",
      "fullName": "John Doe",
      "avatarUrl": "https://..."
    },
    "type": "TEXT",
    "content": "Hello!",
    "isRead": false,
    "createdAt": "2024-01-20T10:30:00Z"
  }
}
```

### Get Unread Count

```
GET /api/v1/transactions/:id/messages/unread-count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn123",
    "unreadCount": 5
  }
}
```

### Get Total Unread Count

```
GET /api/v1/messages/unread-count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUnreadCount": 12
  }
}
```

### Mark Messages as Read

```
POST /api/v1/transactions/:id/messages/mark-read
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn123",
    "markedCount": 5
  }
}
```

### Delete Message

```
DELETE /api/v1/messages/:messageId
```

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

## Client Implementation Examples

### React/TypeScript Example

```typescript
import { io, Socket } from 'socket.io-client';

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

class ChatService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io('http://localhost:4000', {
      auth: { token }
    });

    this.socket.on('connected', (data) => {
      console.log('Connected:', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  joinRoom(transactionId: string) {
    this.socket?.emit('join-room', { transactionId });
  }

  leaveRoom(transactionId: string) {
    this.socket?.emit('leave-room', { transactionId });
  }

  sendMessage(transactionId: string, content: string) {
    this.socket?.emit('send-message', {
      transactionId,
      type: 'TEXT',
      content
    });
  }

  sendTyping(transactionId: string, isTyping: boolean) {
    this.socket?.emit('typing', {
      transactionId,
      isTyping
    });
  }

  markAsRead(transactionId: string, userId: string) {
    this.socket?.emit('mark-read', {
      transactionId,
      userId
    });
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('new-message', callback);
  }

  onUserTyping(callback: (data: any) => void) {
    this.socket?.on('user-typing', callback);
  }

  onStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('status-update', callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const chatService = new ChatService();
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { chatService } from './chatService';

export function useChat(transactionId: string, token: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect
    chatService.connect(token);
    setConnected(true);

    // Join room
    chatService.joinRoom(transactionId);

    // Listen for new messages
    chatService.onNewMessage((message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing
    chatService.onUserTyping((data) => {
      if (data.transactionId === transactionId) {
        setIsTyping(data.isTyping);
      }
    });

    // Cleanup
    return () => {
      chatService.leaveRoom(transactionId);
      chatService.disconnect();
      setConnected(false);
    };
  }, [transactionId, token]);

  const sendMessage = (content: string) => {
    chatService.sendMessage(transactionId, content);
  };

  const sendTyping = (isTyping: boolean) => {
    chatService.sendTyping(transactionId, isTyping);
  };

  return {
    messages,
    isTyping,
    connected,
    sendMessage,
    sendTyping
  };
}
```

## Database Schema

The chat system uses the `Message` model from Prisma:

```prisma
model Message {
  id            String      @id @default(cuid())
  transactionId String
  senderId      String
  type          MessageType @default(TEXT)
  content       String?
  imageUrl      String?
  metadata      Json?
  isRead        Boolean     @default(false)
  createdAt     DateTime    @default(now())

  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  sender      User        @relation(fields: [senderId], references: [id])

  @@index([transactionId])
  @@index([senderId])
  @@index([isRead])
  @@index([createdAt])
  @@map("messages")
}

enum MessageType {
  TEXT
  IMAGE
  SYSTEM
}
```

## Redis Usage

The chat system uses Redis for:

1. **User Presence Tracking**
   - `user:{userId}:online` - Online status (TTL: 1 hour)
   - `socket:{socketId}` - Socket to user mapping (TTL: 1 hour)

2. **Room Membership**
   - `room:{transactionId}:users` - Set of user IDs in room
   - `user:{userId}:room:{transactionId}` - User's socket in room (TTL: 1 hour)

## Performance Considerations

1. **Pagination**: Messages use cursor-based pagination for efficient loading
2. **Redis Caching**: Online presence is cached in Redis for fast lookups
3. **Room-based Broadcasting**: Messages only sent to relevant users
4. **Connection Pooling**: Socket.IO handles connection management efficiently

## Error Handling

All socket events and REST endpoints include comprehensive error handling:

- **Authentication Errors**: Invalid or expired tokens
- **Authorization Errors**: User not part of transaction
- **Validation Errors**: Invalid message types or missing content
- **Database Errors**: Connection issues or query failures

Errors are logged and appropriate responses are sent to clients.

## Testing

### Manual Testing with Socket.IO Client

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);

  // Join room
  socket.emit('join-room', { transactionId: 'txn123' });
});

socket.on('room-joined', (data) => {
  console.log('Joined room:', data);

  // Send message
  socket.emit('send-message', {
    transactionId: 'txn123',
    type: 'TEXT',
    content: 'Hello!'
  });
});

socket.on('new-message', (message) => {
  console.log('New message:', message);
});

socket.on('error', (error) => {
  console.error('Error:', error);
});
```

## Environment Variables

Required environment variables:

```env
# Socket.IO
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# JWT
JWT_SECRET=your-secret-key

# Redis
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/escrow
```

## Security Best Practices

1. **Always validate JWT tokens** before allowing socket connections
2. **Verify user permissions** before allowing room access
3. **Sanitize message content** to prevent XSS attacks
4. **Rate limit socket events** to prevent abuse
5. **Use HTTPS/WSS** in production
6. **Implement message size limits** to prevent DoS attacks
7. **Log security events** for audit trail

## Future Enhancements

- File upload support with progress tracking
- Message reactions (emoji reactions)
- Voice/video call integration
- Message search functionality
- Message threading/replies
- User mentions (@username)
- Rich text formatting
- Message encryption (end-to-end)
- Typing indicator timeouts
- Message delivery status (sent, delivered, read)
- Offline message queue
- Push notifications for offline users

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if server is running
   - Verify CORS settings
   - Check JWT token validity

2. **Messages Not Received**
   - Verify user joined the room
   - Check socket connection status
   - Review server logs for errors

3. **Authentication Failed**
   - Check JWT secret matches
   - Verify token expiration
   - Ensure user exists and is active

4. **High Latency**
   - Check Redis connection
   - Review database query performance
   - Monitor server resources

## Support

For issues or questions:
- Check server logs: `src/logs/`
- Review Prisma schema: `prisma/schema.prisma`
- Contact development team
