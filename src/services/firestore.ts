import {
  addDoc,
  arrayUnion,
  and,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Comment, Post, Store } from '../data/mockData';

export interface ModerationReport {
  id: string;
  entityType: 'post' | 'store';
  entityId: string;
  entityLabel: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved' | 'rejected';
  reporterId: string;
  reporterName: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  participantIds: string[];
  fromUserId: string;
  toUserId: string;
  text: string;
  createdAt: number;
  readBy: string[];
}

type FireTimestamp = { toMillis: () => number };

/** Strip undefined values from an object before sending to Firestore */
function sanitize<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

function toMillis(value: unknown): number {
  if (!value) return Date.now();
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value && 'toMillis' in value) {
    return (value as FireTimestamp).toMillis();
  }
  return Date.now();
}

function toPost(id: string, data: Record<string, unknown>): Post {
  return {
    id,
    userId: String(data.userId ?? 'unknown'),
    userName: String(data.userName ?? 'Anonymous'),
    userAvatar: String(data.userAvatar ?? 'AN'),
    userTrustBadge: (data.userTrustBadge as Post['userTrustBadge']) ?? 'new',
    confidenceLevel: (data.confidenceLevel as Post['confidenceLevel']) ?? 'Medium',
    productName: String(data.productName ?? ''),
    category: String(data.category ?? 'Local Services'),
    price: Number(data.price ?? 0),
    unit: String(data.unit ?? 'kg'),
    mediaUrl: String(data.mediaUrl ?? ''),
    location: String(data.location ?? 'Tanauan, Batangas'),
    storeName: String(data.storeName ?? 'Unknown Store'),
    storeId: String(data.storeId ?? ''),
    locationCoords: {
      lat: Number((data.locationCoords as { lat?: number } | undefined)?.lat ?? 14.0863),
      lng: Number((data.locationCoords as { lng?: number } | undefined)?.lng ?? 121.1486),
    },
    timestamp: toMillis(data.timestamp),
    vouchCount: Number(data.vouchCount ?? 0),
    commentCount: Number(data.commentCount ?? 0),
    marketInsight: String(data.marketInsight ?? 'New report'),
    insightType: (data.insightType as Post['insightType']) ?? 'average',
  };
}

function toStore(id: string, data: Record<string, unknown>): Store {
  return {
    id,
    name: String(data.name ?? ''),
    type: (data.type as Store['type']) ?? 'neighborhood',
    address: String(data.address ?? ''),
    location: String(data.location ?? 'Tanauan, Batangas'),
    locationCoords: {
      lat: Number((data.locationCoords as { lat?: number } | undefined)?.lat ?? 14.0863),
      lng: Number((data.locationCoords as { lng?: number } | undefined)?.lng ?? 121.1486),
    },
    rating: Number(data.rating ?? 0),
    totalPosts: Number(data.totalPosts ?? 0),
    categories: Array.isArray(data.categories)
      ? data.categories.map(value => String(value))
      : [],
    openHours: String(data.openHours ?? 'Store hours unavailable'),
    description: String(data.description ?? ''),
    verified: Boolean(data.verified),
    vouchCount: Number(data.vouchCount ?? 0),
    trustRating: Number(data.trustRating ?? 50),
  };
}

function toComment(id: string, data: Record<string, unknown>): Comment {
  return {
    id,
    postId: String(data.postId ?? ''),
    userId: String(data.userId ?? 'unknown'),
    userName: String(data.userName ?? 'Anonymous'),
    userAvatar: String(data.userAvatar ?? 'AN'),
    text: String(data.text ?? ''),
    timestamp: toMillis(data.timestamp),
  };
}

function toReport(id: string, data: Record<string, unknown>): ModerationReport {
  return {
    id,
    entityType: (data.entityType as ModerationReport['entityType']) ?? 'post',
    entityId: String(data.entityId ?? ''),
    entityLabel: String(data.entityLabel ?? ''),
    reason: String(data.reason ?? ''),
    details: String(data.details ?? ''),
    status: (data.status as ModerationReport['status']) ?? 'open',
    reporterId: String(data.reporterId ?? 'unknown'),
    reporterName: String(data.reporterName ?? 'Anonymous'),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

function toChatMessage(id: string, data: Record<string, unknown>): ChatMessage {
  return {
    id,
    conversationId: String(data.conversationId ?? ''),
    participantIds: Array.isArray(data.participantIds)
      ? data.participantIds.map(value => String(value))
      : [],
    fromUserId: String(data.fromUserId ?? ''),
    toUserId: String(data.toUserId ?? ''),
    text: String(data.text ?? ''),
    createdAt: toMillis(data.createdAt),
    readBy: Array.isArray(data.readBy)
      ? data.readBy.map(value => String(value))
      : [],
  };
}

export function getConversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join('__');
}

export function subscribeToPosts(onData: (posts: Post[]) => void): Unsubscribe | null {
  if (!db) return null;
  const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(150));
  return onSnapshot(q, snapshot => {
    onData(snapshot.docs.map(item => toPost(item.id, item.data())));
  });
}

export function subscribeToStores(onData: (stores: Store[]) => void): Unsubscribe | null {
  if (!db) return null;
  const q = query(collection(db, 'stores'), orderBy('name', 'asc'));
  return onSnapshot(q, snapshot => {
    onData(snapshot.docs.map(item => toStore(item.id, item.data())));
  });
}

export function subscribeToComments(onData: (comments: Comment[]) => void): Unsubscribe | null {
  if (!db) return null;
  const q = query(collection(db, 'comments'), orderBy('timestamp', 'asc'), limit(400));
  return onSnapshot(q, snapshot => {
    onData(snapshot.docs.map(item => toComment(item.id, item.data())));
  });
}

export async function createPost(post: Omit<Post, 'id'>): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');
  await addDoc(collection(db, 'posts'), {
    ...sanitize(post),
    timestamp: serverTimestamp(),
  });
  if (post.storeId) {
    await updateDoc(doc(db, 'stores', post.storeId), { totalPosts: increment(1) });
  }
}

export async function createStore(store: Store): Promise<string> {
  if (!db) throw new Error('Firebase is not configured');
  await setDoc(doc(db, 'stores', store.id), {
    ...sanitize(store),
    createdAt: serverTimestamp(),
  });
  return store.id;
}

export function subscribeToDeletedPosts(onData: (posts: Post[]) => void): Unsubscribe | null {
  if (!db) return null;
  const q = query(collection(db, 'deletedPosts'), orderBy('deletedAt', 'desc'), limit(200));
  return onSnapshot(q, snapshot => {
    onData(snapshot.docs.map(item => toPost(item.id, item.data())));
  });
}

export async function softDeletePost(post: Post, adminId: string, adminName: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');
  const batch = writeBatch(db);

  // Copy post to deletedPosts with metadata
  batch.set(doc(db, 'deletedPosts', post.id), {
    ...sanitize(post),
    deletedAt: serverTimestamp(),
    deletedBy: adminId,
    deletedByName: adminName,
  });

  // Remove from posts collection
  batch.delete(doc(db, 'posts', post.id));

  await batch.commit();
}

export async function restorePost(post: Post): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');
  const batch = writeBatch(db);

  // Restore to posts collection (without deletedAt metadata)
  const { ...postData } = sanitize(post);
  batch.set(doc(db, 'posts', post.id), postData);

  // Remove from deletedPosts
  batch.delete(doc(db, 'deletedPosts', post.id));

  await batch.commit();
}

export async function createComment(comment: Omit<Comment, 'id'>): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');
  await addDoc(collection(db, 'comments'), {
    ...comment,
    timestamp: serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', comment.postId), { commentCount: increment(1) });
}

export async function toggleVouch(postId: string, userId: string, alreadyVouched: boolean): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');

  const postRef = doc(db, 'posts', postId);
  const vouchRef = doc(db, 'postVouches', `${postId}_${userId}`);

  await runTransaction(db, async tx => {
    const existing = await tx.get(vouchRef);
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists()) return;

    const baseCount = Number(postSnap.data().vouchCount ?? 0);
    if (alreadyVouched || existing.exists()) {
      tx.delete(vouchRef);
      tx.update(postRef, { vouchCount: Math.max(baseCount - 1, 0) });
      return;
    }

    tx.set(vouchRef, {
      postId,
      userId,
      createdAt: serverTimestamp(),
    });
    tx.update(postRef, { vouchCount: baseCount + 1 });
  });
}

export async function loadUserVouches(userId: string): Promise<Set<string>> {
  if (!db) return new Set();
  const q = query(collection(db, 'postVouches'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const ids = snapshot.docs.map(item => String(item.data().postId ?? ''));
  return new Set(ids.filter(Boolean));
}

export async function toggleStoreVouch(storeId: string, userId: string, alreadyVouched: boolean): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');

  const storeRef = doc(db, 'stores', storeId);
  const vouchRef = doc(db, 'storeVouches', `${storeId}_${userId}`);

  await runTransaction(db, async tx => {
    const existing = await tx.get(vouchRef);
    const storeSnap = await tx.get(storeRef);
    if (!storeSnap.exists()) return;

    const data = storeSnap.data();
    const baseCount = Number(data.vouchCount ?? 0);
    const verifiedBoost = data.verified ? 10 : 0;

    if (alreadyVouched || existing.exists()) {
      const nextCount = Math.max(baseCount - 1, 0);
      tx.delete(vouchRef);
      tx.update(storeRef, {
        vouchCount: nextCount,
        trustRating: Math.min(100, Math.max(45, 50 + nextCount * 1.1 + verifiedBoost)),
      });
      return;
    }

    const nextCount = baseCount + 1;
    tx.set(vouchRef, {
      storeId,
      userId,
      createdAt: serverTimestamp(),
    });
    tx.update(storeRef, {
      vouchCount: nextCount,
      trustRating: Math.min(100, Math.max(45, 50 + nextCount * 1.1 + verifiedBoost)),
    });
  });
}

export async function loadUserStoreVouches(userId: string): Promise<Set<string>> {
  if (!db) return new Set();
  const q = query(collection(db, 'storeVouches'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const ids = snapshot.docs.map(item => String(item.data().storeId ?? ''));
  return new Set(ids.filter(Boolean));
}

export function subscribeToReports(onData: (reports: ModerationReport[]) => void): Unsubscribe | null {
  if (!db) return null;
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(300));
  return onSnapshot(q, snapshot => {
    onData(snapshot.docs.map(item => toReport(item.id, item.data())));
  });
}

export async function createReport(report: Omit<ModerationReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');
  await addDoc(collection(db, 'reports'), {
    ...report,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateReportStatus(reportId: string, status: ModerationReport['status']): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');
  await updateDoc(doc(db, 'reports', reportId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToUserMessages(
  userId: string,
  onData: (messages: ChatMessage[]) => void
): Unsubscribe | null {
  if (!db || !userId) return null;
  const q = query(
    collection(db, 'messages'),
    where('participantIds', 'array-contains', userId),
    orderBy('createdAt', 'asc'),
    limit(600)
  );
  return onSnapshot(q, snapshot => {
    onData(snapshot.docs.map(item => toChatMessage(item.id, item.data())));
  });
}

export async function createMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');
  await addDoc(collection(db, 'messages'), {
    ...message,
    createdAt: serverTimestamp(),
  });
}

export async function markConversationRead(currentUserId: string, otherUserId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured');
  const q = query(
    collection(db, 'messages'),
    and(
      where('toUserId', '==', currentUserId),
      where('fromUserId', '==', otherUserId)
    )
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach(item => {
    batch.update(item.ref, { readBy: arrayUnion(currentUserId) });
  });
  await batch.commit();
}