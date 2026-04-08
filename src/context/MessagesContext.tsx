import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  createMessage as createMessageRemote,
  getConversationId,
  markConversationRead as markConversationReadRemote,
  subscribeToUserMessages,
  type ChatMessage,
} from '../services/firestore';
import { isFirebaseConfigured } from '../lib/firebase';

interface ConversationSummary {
  userId: string;
  conversationId: string;
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: number;
}

interface MessagesContextType {
  messages: ChatMessage[];
  conversations: ConversationSummary[];
  sendMessage: (toUserId: string, text: string) => boolean;
  getMessagesWithUser: (userId: string) => ChatMessage[];
  markConversationRead: (userId: string) => void;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

interface MessagesProviderProps {
  children: ReactNode;
  isLoggedIn: boolean;
  currentUser: User | null;
  onAuthRequired: () => void;
}

export function MessagesProvider({ children, isLoggedIn, currentUser, onAuthRequired }: MessagesProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const activeUserId = currentUser?.uid ?? (isLoggedIn ? 'current_user' : null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        const raw = localStorage.getItem('hanaplokal_messages');
        setMessages(raw ? (JSON.parse(raw) as ChatMessage[]) : []);
      } catch {
        setMessages([]);
      }
      return;
    }

    if (!activeUserId) {
      setMessages([]);
      return;
    }

    const unsub = subscribeToUserMessages(activeUserId, setMessages);
    return () => {
      if (unsub) unsub();
    };
  }, [activeUserId]);

  useEffect(() => {
    if (isFirebaseConfigured) return;
    localStorage.setItem('hanaplokal_messages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = useCallback((toUserId: string, text: string): boolean => {
    if (!isLoggedIn || !activeUserId) {
      onAuthRequired();
      return false;
    }

    const trimmed = text.trim();
    if (!trimmed || !toUserId || toUserId === activeUserId) return true;

    const conversationId = getConversationId(activeUserId, toUserId);
    const optimisticMessage: ChatMessage = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      participantIds: [activeUserId, toUserId].sort(),
      fromUserId: activeUserId,
      toUserId,
      text: trimmed,
      createdAt: Date.now(),
      readBy: [activeUserId],
    };

    setMessages(prev => [...prev, optimisticMessage]);

    if (isFirebaseConfigured) {
      void createMessageRemote({
        conversationId,
        participantIds: optimisticMessage.participantIds,
        fromUserId: optimisticMessage.fromUserId,
        toUserId: optimisticMessage.toUserId,
        text: optimisticMessage.text,
        readBy: optimisticMessage.readBy,
      });
    }

    return true;
  }, [activeUserId, isLoggedIn, onAuthRequired]);

  const getMessagesWithUser = useCallback((userId: string): ChatMessage[] => {
    if (!activeUserId || !userId) return [];
    const conversationId = getConversationId(activeUserId, userId);
    return messages
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [activeUserId, messages]);

  const markConversationRead = useCallback((userId: string) => {
    if (!activeUserId || !userId) return;

    setMessages(prev =>
      prev.map(message => {
        if (
          message.toUserId === activeUserId &&
          message.fromUserId === userId &&
          !message.readBy.includes(activeUserId)
        ) {
          return { ...message, readBy: [...message.readBy, activeUserId] };
        }
        return message;
      })
    );

    if (isFirebaseConfigured) {
      void markConversationReadRemote(activeUserId, userId);
    }
  }, [activeUserId]);

  const conversations = useMemo<ConversationSummary[]>(() => {
    if (!activeUserId) return [];

    const map = new Map<string, ConversationSummary>();

    messages.forEach(message => {
      if (!message.participantIds.includes(activeUserId)) return;
      const otherId = message.fromUserId === activeUserId ? message.toUserId : message.fromUserId;
      if (!otherId) return;

      const existing = map.get(otherId);
      const unread = message.toUserId === activeUserId && !message.readBy.includes(activeUserId) ? 1 : 0;

      if (!existing || message.createdAt >= existing.lastMessageAt) {
        map.set(otherId, {
          userId: otherId,
          conversationId: message.conversationId,
          lastMessage: message.text,
          lastMessageAt: message.createdAt,
          unreadCount: (existing?.unreadCount ?? 0) + unread,
        });
      } else if (unread > 0) {
        map.set(otherId, { ...existing, unreadCount: existing.unreadCount + unread });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [activeUserId, messages]);

  return (
    <MessagesContext.Provider
      value={{
        messages,
        conversations,
        sendMessage,
        getMessagesWithUser,
        markConversationRead,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
}
