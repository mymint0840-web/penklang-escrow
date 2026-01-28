import { MessageType } from '@prisma/client';

export interface SocketUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  socketId: string;
}

export interface RoomData {
  transactionId: string;
  users: SocketUser[];
}

export interface MessagePayload {
  transactionId: string;
  type: MessageType;
  content?: string;
  imageUrl?: string;
}

export interface TypingPayload {
  transactionId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface MarkReadPayload {
  transactionId: string;
  userId: string;
}

export interface StatusUpdatePayload {
  transactionId: string;
  status: string;
  message: string;
  timestamp: Date;
}

export interface JoinRoomPayload {
  transactionId: string;
}

export interface LeaveRoomPayload {
  transactionId: string;
}

export interface NewMessageEvent {
  id: string;
  transactionId: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  type: MessageType;
  content?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface AuthenticatedSocket {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
  handshake: {
    auth: {
      token: string;
    };
  };
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  to: (room: string) => {
    emit: (event: string, ...args: any[]) => void;
  };
  disconnect: () => void;
}
