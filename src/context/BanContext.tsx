import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface BannedUser {
  userId: string;
  userName: string;
  userAvatar: string;
  bannedAt: number;
  bannedBy: string; // admin display name
}

interface BanContextType {
  bannedUsers: BannedUser[];
  isBanned: (userId: string) => boolean;
  banUser: (user: { userId: string; userName: string; userAvatar: string }, adminName: string) => void;
  unbanUser: (userId: string) => void;
}

const BanContext = createContext<BanContextType | null>(null);

const STORAGE_KEY = 'hanaplokal_banned_users';

export function BanProvider({ children }: { children: ReactNode }) {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BannedUser[]) : [];
    } catch {
      return [];
    }
  });

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bannedUsers));
  }, [bannedUsers]);

  const bannedSet = useMemo(() => new Set(bannedUsers.map(u => u.userId)), [bannedUsers]);

  const isBanned = useCallback((userId: string) => bannedSet.has(userId), [bannedSet]);

  const banUser = useCallback(
    (user: { userId: string; userName: string; userAvatar: string }, adminName: string) => {
      setBannedUsers(prev => {
        if (prev.some(u => u.userId === user.userId)) return prev; // already banned
        return [
          { ...user, bannedAt: Date.now(), bannedBy: adminName },
          ...prev,
        ];
      });
    },
    []
  );

  const unbanUser = useCallback((userId: string) => {
    setBannedUsers(prev => prev.filter(u => u.userId !== userId));
  }, []);

  const value = useMemo(
    () => ({ bannedUsers, isBanned, banUser, unbanUser }),
    [bannedUsers, isBanned, banUser, unbanUser]
  );

  return <BanContext.Provider value={value}>{children}</BanContext.Provider>;
}

export function useBan() {
  const ctx = useContext(BanContext);
  if (!ctx) throw new Error('useBan must be used within BanProvider');
  return ctx;
}
