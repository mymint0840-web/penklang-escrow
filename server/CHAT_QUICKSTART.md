# Chat System Quick Start Guide

## Overview

Real-time chat system for the Escrow Platform using Socket.IO. Enables buyers and sellers to communicate within transactions.

## Files Created

```
server/
├── src/
│   ├── services/
│   │   ├── message.service.ts      # Message CRUD operations
│   │   └── socket.service.ts       # Socket.IO event handling
│   ├── controllers/
│   │   └── message.controller.ts   # REST API controllers
│   ├── routes/
│   │   └── message.routes.ts       # REST API routes
│   ├── types/
│   │   └── socket.types.ts         # TypeScript interfaces
│   └── server.ts                   # Updated with socket initialization
├── docs/
│   └── CHAT_SYSTEM.md             # Complete documentation
└── examples/
    └── chat-client.example.ts     # Client implementation examples
```

## Setup Instructions

### 1. Install Dependencies (Already in package.json)

```bash
npm install socket.io
npm install @types/socket.io-client --save-dev
```

### 2. Environment Variables

Ensure these are set in your `.env` file:

```env
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/escrow
```

### 3. Database Setup

The `Message` model is already defined in your Prisma schema. No migration needed!

### 4. Start Server

```bash
npm run dev
```

The chat system is automatically initialized when the server starts.

## Quick Test

### Using Postman/Thunder Client

1. **Authenticate and get JWT token**
   ```
   POST /api/v1/auth/login
   ```

2. **Connect via Socket.IO** (use Socket.IO client library)
   ```javascript
   const socket = io('http://localhost:4000', {
     auth: { token: 'your-jwt-token' }
   });
   ```

3. **Join a room**
   ```javascript
   socket.emit('join-room', { transactionId: 'txn123' });
   ```

4. **Send a message**
   ```javascript
   socket.emit('send-message', {
     transactionId: 'txn123',
     type: 'TEXT',
     content: 'Hello!'
   });
   ```

### Using REST API (Backup)

```bash
# Get messages
GET /api/v1/transactions/:id/messages
Authorization: Bearer YOUR_JWT_TOKEN

# Send message
POST /api/v1/transactions/:id/messages
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "TEXT",
  "content": "Hello!"
}

# Get unread count
GET /api/v1/transactions/:id/messages/unread-count
Authorization: Bearer YOUR_JWT_TOKEN

# Mark as read
POST /api/v1/transactions/:id/messages/mark-read
Authorization: Bearer YOUR_JWT_TOKEN
```

## Client Integration

### React Example

```typescript
import { useChat } from './chat-client.example';

function ChatPage() {
  const {
    messages,
    isTyping,
    connected,
    sendMessage,
    sendTyping
  } = useChat('transaction-id', 'jwt-token', 'user-id');

  return (
    <div>
      <h1>Chat</h1>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>

      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>

      {isTyping && <div>User is typing...</div>}

      <input
        onChange={(e) => {
          sendTyping(true);
          // ... handle input
        }}
      />
      <button onClick={() => sendMessage('Hello!')}>
        Send
      </button>
    </div>
  );
}
```

## Socket.IO Events Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ transactionId }` | Join transaction room |
| `leave-room` | `{ transactionId }` | Leave transaction room |
| `send-message` | `{ transactionId, type, content, imageUrl }` | Send message |
| `typing` | `{ transactionId, isTyping }` | Send typing indicator |
| `mark-read` | `{ transactionId, userId }` | Mark messages as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ userId, message }` | Connection successful |
| `new-message` | `{ id, transactionId, sender, type, content, ... }` | New message received |
| `user-typing` | `{ transactionId, userId, userName, isTyping }` | User typing status |
| `status-update` | `{ transactionId, status, message }` | Transaction status changed |
| `unread-count` | `{ transactionId, count }` | Unread message count |
| `error` | `{ message }` | Error occurred |

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transactions/:id/messages` | Get messages with pagination |
| POST | `/api/v1/transactions/:id/messages` | Send message (REST backup) |
| GET | `/api/v1/transactions/:id/messages/unread-count` | Get unread count |
| GET | `/api/v1/messages/unread-count` | Get total unread count |
| POST | `/api/v1/transactions/:id/messages/mark-read` | Mark messages as read |
| DELETE | `/api/v1/messages/:messageId` | Delete message |

## Features

- ✅ Real-time messaging via WebSocket
- ✅ REST API fallback
- ✅ Text and image messages
- ✅ System messages
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Online/offline presence
- ✅ Cursor-based pagination
- ✅ Unread message counts
- ✅ JWT authentication
- ✅ Transaction-level authorization
- ✅ Redis caching for presence
- ✅ Comprehensive error handling
- ✅ TypeScript support

## Security

- JWT token required for connection
- Users can only access their own transactions
- All messages validated before saving
- XSS protection via content sanitization
- Rate limiting on API endpoints
- Secure WebSocket (WSS) in production

## Performance

- Room-based broadcasting (efficient)
- Redis for presence tracking
- Cursor-based pagination for history
- Connection pooling
- Automatic reconnection

## Troubleshooting

### Connection Issues

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  // Check: JWT token valid? Server running? CORS configured?
});
```

### Messages Not Received

```javascript
// Make sure you joined the room first
socket.emit('join-room', { transactionId: 'txn123' });

// Then send message
socket.emit('send-message', { ... });
```

### Authentication Failed

- Check JWT_SECRET matches between client and server
- Verify token hasn't expired
- Ensure user exists and is ACTIVE

## Testing Checklist

- [ ] Connect to server with valid token
- [ ] Join a transaction room
- [ ] Send a text message
- [ ] Send an image message
- [ ] Receive messages in real-time
- [ ] Typing indicator works
- [ ] Mark messages as read
- [ ] Get unread count
- [ ] Leave room
- [ ] Disconnect gracefully
- [ ] Reconnect after disconnect
- [ ] REST API endpoints work
- [ ] Error handling works

## Next Steps

1. Add authentication middleware to protect REST routes
2. Implement file upload for images
3. Add message search functionality
4. Add push notifications for offline users
5. Add message reactions
6. Add voice/video call support
7. Implement end-to-end encryption

## Resources

- Full Documentation: `docs/CHAT_SYSTEM.md`
- Client Examples: `examples/chat-client.example.ts`
- Socket.IO Docs: https://socket.io/docs/v4/
- Prisma Schema: `prisma/schema.prisma`

## Support

For issues or questions:
- Check logs in `src/logs/` (if configured)
- Review Prisma schema
- Test with Socket.IO client
- Check Redis connection
- Verify database connection

---

**Made with ❤️ for Escrow Platform**
