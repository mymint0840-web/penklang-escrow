'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Message {
  id: string;
  transactionId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
  content: string;
  image?: string;
  createdAt: string;
}

interface ChatBoxProps {
  transactionId: string;
  currentUserId: string;
}

export default function ChatBox({ transactionId, currentUserId }: ChatBoxProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // เชื่อมต่อ Socket.io
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    setSocket(newSocket);

    // เข้าร่วมห้องแชท
    newSocket.emit('join_transaction', transactionId);

    // รับข้อความใหม่
    newSocket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // รับสถานะการพิมพ์
    newSocket.on('user_typing', (data: { userId: string; typing: boolean }) => {
      if (data.userId !== currentUserId) {
        setTyping(data.typing);
      }
    });

    // โหลดข้อความเก่า
    fetchMessages();

    return () => {
      newSocket.emit('leave_transaction', transactionId);
      newSocket.disconnect();
    };
  }, [transactionId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessages(response.data);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('ไม่สามารถโหลดข้อความได้');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing', { transactionId, userId: currentUserId, typing: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { transactionId, userId: currentUserId, typing: false });
    }, 1000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ต้องไม่เกิน 5 MB');
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() && !imageFile) {
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', newMessage);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${transactionId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setNewMessage('');
      handleRemoveImage();
      if (socket) {
        socket.emit('typing', { transactionId, userId: currentUserId, typing: false });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('ไม่สามารถส่งข้อความได้');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* ส่วนหัว */}
      <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
        <h3 className="text-lg font-semibold">แชทการทำธุรกรรม</h3>
        <p className="text-sm text-blue-100">สื่อสารกับคู่ค้าของคุณ</p>
      </div>

      {/* รายการข้อความ */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: '500px' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p>ยังไม่มีข้อความ</p>
            <p className="text-sm">เริ่มสนทนากับคู่ค้าของคุณได้เลย</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender.id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && (
                    <p className="text-xs text-gray-500 mb-1">
                      {message.sender.firstName} {message.sender.lastName}
                    </p>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.image && (
                      <div className="mb-2 relative w-48 h-48 rounded overflow-hidden">
                        <Image
                          src={message.image}
                          alt="รูปภาพ"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {message.content && (
                      <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {new Date(message.createdAt).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ตัวอย่างรูปภาพที่เลือก */}
      {imagePreview && (
        <div className="px-6 py-2 border-t border-gray-200">
          <div className="relative inline-block">
            <div className="relative w-20 h-20 rounded overflow-hidden">
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
            </div>
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ฟอร์มส่งข้อความ */}
      <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 transition"
            title="แนบรูปภาพ"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="พิมพ์ข้อความ..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !imageFile)}
            className="flex-shrink-0 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sending ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">กด Enter เพื่อส่ง, Shift + Enter เพื่อขึ้นบรรทัดใหม่</p>
      </form>
    </div>
  );
}
