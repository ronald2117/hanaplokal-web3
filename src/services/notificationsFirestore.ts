import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AppNotification } from '../data/mockData';

type FireTimestamp = { toMillis: () => number };

function toMillis(value: unknown): number {
  if (!value) return Date.now();
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value && 'toMillis' in value) {
    return (value as FireTimestamp).toMillis();
  }
  return Date.now();
}

export function toNotification(id: string, data: Record<string, unknown>): AppNotification {
  return {
    id,
    userId: String(data.userId ?? ''),
    type: (data.type as AppNotification['type']) ?? 'post_approved',
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    read: Boolean(data.read),
    createdAt: toMillis(data.createdAt),
    linkEntityId: data.linkEntityId ? String(data.linkEntityId) : undefined,
    linkEntityType: data.linkEntityType as AppNotification['linkEntityType'],
  };
}

export function subscribeToNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void
) {
  if (!db) return null;

  const q = query(
    collection(db, 'notifications', userId, 'items'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    snapshot => {
      const notifs = snapshot.docs.map(item => toNotification(item.id, item.data()));
      onData(notifs);
    },
    err => {
      console.warn(`[HanapLokal] ❌ subscribeToNotifications for ${userId} failed:`, err.message);
    }
  );
}

export async function createNotification(
  userId: string,
  payload: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
): Promise<void> {
  if (!db) return;

  const colRef = collection(db, 'notifications', userId, 'items');
  await addDoc(colRef, {
    ...payload,
    userId,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, 'notifications', userId, 'items', notificationId);
  await updateDoc(docRef, { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!db) return;
  const colRef = collection(db, 'notifications', userId, 'items');
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach(item => {
    if (!item.data().read) {
      batch.update(item.ref, { read: true });
    }
  });
  await batch.commit();
}
