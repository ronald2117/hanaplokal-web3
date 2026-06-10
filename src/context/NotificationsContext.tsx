import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppNotification } from '../data/mockData';
import { useApp } from './AppContext';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  subscribeToNotifications,
  createNotification as createFirestoreNotification,
  markNotificationRead as markFirestoreNotificationRead,
  markAllNotificationsRead as markAllFirestoreNotificationsRead,
} from '../services/notificationsFirestore';

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (userId: string, payload: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { currentUser, isAdmin, isLoggedIn } = useApp();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Local Storage Fallback Keys
  const getStorageKey = (uid: string) => `hanaplokal_notifications_${uid}`;
  const adminKey = 'hanaplokal_notifications_admin';

  // State for Firestore
  const [userNotifs, setUserNotifs] = useState<AppNotification[]>([]);
  const [adminNotifs, setAdminNotifs] = useState<AppNotification[]>([]);

  // Local state for LocalStorage mode
  const [localNotifs, setLocalNotifs] = useState<AppNotification[]>([]);

  // 1. Firebase subscription
  useEffect(() => {
    if (!isFirebaseConfigured || !isLoggedIn || !currentUser) {
      setUserNotifs([]);
      return;
    }

    const unsub = subscribeToNotifications(currentUser.uid, (data) => {
      setUserNotifs(data);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser, isLoggedIn]);

  useEffect(() => {
    if (!isFirebaseConfigured || !isLoggedIn || !isAdmin) {
      setAdminNotifs([]);
      return;
    }

    const unsub = subscribeToNotifications('admin', (data) => {
      setAdminNotifs(data);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [isAdmin, isLoggedIn]);

  // 2. Local Storage Sync / Load
  const loadLocalNotifications = useCallback(() => {
    if (isFirebaseConfigured || !isLoggedIn || !currentUser) {
      setLocalNotifs([]);
      return;
    }

    const userKey = getStorageKey(currentUser.uid);
    const storedUser = localStorage.getItem(userKey);
    const userList: AppNotification[] = storedUser ? JSON.parse(storedUser) : [];

    let adminList: AppNotification[] = [];
    if (isAdmin) {
      const storedAdmin = localStorage.getItem(adminKey);
      adminList = storedAdmin ? JSON.parse(storedAdmin) : [];
    }

    const merged = [...userList, ...adminList].sort((a, b) => b.createdAt - a.createdAt);
    setLocalNotifs(merged);
  }, [currentUser, isAdmin, isLoggedIn]);

  useEffect(() => {
    loadLocalNotifications();
  }, [loadLocalNotifications]);

  // Combine notifications based on mode
  useEffect(() => {
    if (isFirebaseConfigured) {
      const merged = [...userNotifs, ...adminNotifs].sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(merged);
    } else {
      setNotifications(localNotifs);
    }
  }, [userNotifs, adminNotifs, localNotifs]);

  // Actions
  const addNotification = useCallback(async (
    targetUserId: string,
    payload: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
  ) => {
    if (isFirebaseConfigured) {
      await createFirestoreNotification(targetUserId, payload);
    } else {
      // Local storage implementation
      const newNotif: AppNotification = {
        ...payload,
        id: Math.random().toString(36).substring(2, 9),
        userId: targetUserId,
        read: false,
        createdAt: Date.now(),
      };

      const key = targetUserId === 'admin' ? adminKey : getStorageKey(targetUserId);
      const stored = localStorage.getItem(key);
      const list: AppNotification[] = stored ? JSON.parse(stored) : [];

      // Limit to 50 items
      const updatedList = [newNotif, ...list].slice(0, 50);
      localStorage.setItem(key, JSON.stringify(updatedList));

      // Reload
      loadLocalNotifications();
    }
  }, [loadLocalNotifications]);

  const markRead = useCallback(async (id: string) => {
    if (isFirebaseConfigured && currentUser) {
      const notif = notifications.find(n => n.id === id);
      if (!notif) return;
      await markFirestoreNotificationRead(notif.userId, id);
    } else if (currentUser) {
      const notif = notifications.find(n => n.id === id);
      if (!notif) return;
      const key = notif.userId === 'admin' ? adminKey : getStorageKey(notif.userId);
      const stored = localStorage.getItem(key);
      if (stored) {
        const list: AppNotification[] = JSON.parse(stored);
        const updated = list.map(item => item.id === id ? { ...item, read: true } : item);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      loadLocalNotifications();
    }
  }, [notifications, currentUser, loadLocalNotifications]);

  const markAllRead = useCallback(async () => {
    if (isFirebaseConfigured && currentUser) {
      await markAllFirestoreNotificationsRead(currentUser.uid);
      if (isAdmin) {
        await markAllFirestoreNotificationsRead('admin');
      }
    } else if (currentUser) {
      const userKey = getStorageKey(currentUser.uid);
      const userStored = localStorage.getItem(userKey);
      if (userStored) {
        const list: AppNotification[] = JSON.parse(userStored);
        const updated = list.map(item => ({ ...item, read: true }));
        localStorage.setItem(userKey, JSON.stringify(updated));
      }

      if (isAdmin) {
        const adminStored = localStorage.getItem(adminKey);
        if (adminStored) {
          const list: AppNotification[] = JSON.parse(adminStored);
          const updated = list.map(item => ({ ...item, read: true }));
          localStorage.setItem(adminKey, JSON.stringify(updated));
        }
      }
      loadLocalNotifications();
    }
  }, [currentUser, isAdmin, loadLocalNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isPanelOpen,
        setIsPanelOpen,
        markRead,
        markAllRead,
        addNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
