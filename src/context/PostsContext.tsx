import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  type Post,
  type Comment,
  type PriceAlert,
  mockPosts,
  mockComments,
  getMediaGradient,
} from '../data/mockData';
import {
  createComment,
  createPost,
  loadUserVouches,
  subscribeToComments,
  subscribeToPosts,
  toggleVouch as toggleVouchRemote,
} from '../services/firestore';
import { isFirebaseConfigured } from '../lib/firebase';

interface PostsContextType {
  posts: Post[];
  comments: Comment[];
  alerts: PriceAlert[];
  vouchedPosts: Set<string>;
  savedPostIds: Set<string>;
  commentSheetPostId: string | null;
  openCommentSheet: (postId: string) => void;
  closeCommentSheet: () => void;
  toggleVouch: (postId: string) => boolean;
  addComment: (postId: string, text: string) => boolean;
  addPost: (post: {
    productName: string;
    category: string;
    price: number;
    unit: string;
    mediaUrl: string;
    location?: string;
    storeName?: string;
    storeId?: string;
    locationCoords?: { lat: number; lng: number };
  }) => void;
  deletePost: (postId: string) => void;
  toggleSavePost: (postId: string) => boolean;
  addAlert: (payload: Omit<PriceAlert, 'id' | 'userId' | 'active'>) => boolean;
  toggleAlertActive: (alertId: string) => void;
  deleteAlert: (alertId: string) => void;
  getCommentsForPost: (postId: string) => Comment[];
}

const PostsContext = createContext<PostsContextType | null>(null);

interface PostsProviderProps {
  children: ReactNode;
  isLoggedIn: boolean;
  currentUser: User | null;
  onAuthRequired: () => void;
}

export function PostsProvider({ children, isLoggedIn, currentUser, onAuthRequired }: PostsProviderProps) {
  const [posts, setPosts] = useState<Post[]>(isFirebaseConfigured ? [] : mockPosts);
  const [comments, setComments] = useState<Comment[]>(isFirebaseConfigured ? [] : mockComments);
  const [vouchedPosts, setVouchedPosts] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = `hanaplokal_alerts_${currentUser?.uid ?? 'guest'}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setAlerts([]);
        return;
      }
      const parsed = JSON.parse(raw) as PriceAlert[];
      setAlerts(parsed);
    } catch {
      setAlerts([]);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    const storageKey = `hanaplokal_alerts_${currentUser?.uid ?? 'guest'}`;
    localStorage.setItem(storageKey, JSON.stringify(alerts));
  }, [alerts, currentUser?.uid]);

  useEffect(() => {
    const storageKey = `hanaplokal_saved_posts_${currentUser?.uid ?? 'guest'}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setSavedPostIds(new Set());
        return;
      }
      const parsed = JSON.parse(raw) as string[];
      setSavedPostIds(new Set(parsed));
    } catch {
      setSavedPostIds(new Set());
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    const storageKey = `hanaplokal_saved_posts_${currentUser?.uid ?? 'guest'}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(savedPostIds)));
  }, [savedPostIds, currentUser?.uid]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubPosts = subscribeToPosts(setPosts);
    const unsubComments = subscribeToComments(setComments);

    return () => {
      if (unsubPosts) unsubPosts();
      if (unsubComments) unsubComments();
    };
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) {
      setVouchedPosts(new Set());
      return;
    }

    void loadUserVouches(currentUser.uid).then(setVouchedPosts);
  }, [currentUser]);

  const openCommentSheet = useCallback((postId: string) => {
    setCommentSheetPostId(postId);
  }, []);

  const closeCommentSheet = useCallback(() => {
    setCommentSheetPostId(null);
  }, []);

  const toggleVouch = useCallback((postId: string): boolean => {
    if (!isLoggedIn) {
      onAuthRequired();
      return false;
    }

    const alreadyVouched = vouchedPosts.has(postId);

    setVouchedPosts(prev => {
      const next = new Set(prev);
      if (alreadyVouched) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          vouchCount: alreadyVouched ? Math.max(p.vouchCount - 1, 0) : p.vouchCount + 1,
        };
      })
    );

    if (isFirebaseConfigured && currentUser) {
      void toggleVouchRemote(postId, currentUser.uid, alreadyVouched).catch(() => {
        setVouchedPosts(prev => {
          const next = new Set(prev);
          if (alreadyVouched) {
            next.add(postId);
          } else {
            next.delete(postId);
          }
          return next;
        });
      });
    }

    return true;
  }, [currentUser, isLoggedIn, onAuthRequired, vouchedPosts]);

  const addComment = useCallback((postId: string, text: string): boolean => {
    if (!isLoggedIn) {
      onAuthRequired();
      return false;
    }

    const trimmed = text.trim();
    if (!trimmed) return true;

    const newComment: Comment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      postId,
      userId: currentUser?.uid ?? 'current_user',
      userName: currentUser?.displayName ?? 'You',
      userAvatar: currentUser?.displayName?.slice(0, 2).toUpperCase() ?? 'YU',
      text: trimmed,
      timestamp: Date.now(),
    };

    setComments(prev => [...prev, newComment]);

    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      )
    );

    if (isFirebaseConfigured) {
      createComment({
        postId,
        userId: newComment.userId,
        userName: newComment.userName,
        userAvatar: newComment.userAvatar,
        text: trimmed,
        timestamp: Date.now(),
      }).catch(err => {
        console.error('[HanapLokal] ❌ Failed to save comment to Firestore:', err);
      });
    } else {
      console.warn('[HanapLokal] ⚠️ Firebase not configured — comment saved locally only.');
    }

    return true;
  }, [currentUser, isLoggedIn, onAuthRequired]);

  const addPost = useCallback((postData: {
    productName: string;
    category: string;
    price: number;
    unit: string;
    mediaUrl: string;
    location?: string;
    storeName?: string;
    storeId?: string;
    locationCoords?: { lat: number; lng: number };
  }) => {
    const mediaKey = postData.mediaUrl || postData.category.toLowerCase();
    const gradient = getMediaGradient(mediaKey);

    const newPost: Post = {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: currentUser?.uid ?? 'current_user',
      userName: currentUser?.displayName ?? 'You',
      userAvatar: currentUser?.displayName?.slice(0, 2).toUpperCase() ?? 'YU',
      userTrustBadge: 'new',
      confidenceLevel: 'Medium',
      timestamp: Date.now(),
      vouchCount: 0,
      commentCount: 0,
      marketInsight: 'New report',
      insightType: 'average',
      // Explicit field assignment — no spread overwriting fallbacks with undefined
      productName: postData.productName,
      category: postData.category,
      price: postData.price,
      unit: postData.unit,
      mediaUrl: gradient !== 'from-gray-100 via-gray-50 to-gray-100' ? mediaKey : postData.category.toLowerCase(),
      location: postData.location ?? 'Tanauan, Batangas',
      storeName: postData.storeName ?? 'Current Location',
      storeId: postData.storeId ?? '',
      locationCoords: postData.locationCoords ?? { lat: 14.0863 + (Math.random() - 0.5) * 0.01, lng: 121.1486 + (Math.random() - 0.5) * 0.01 },
    };

    setPosts(prev => [newPost, ...prev]);

    if (isFirebaseConfigured) {
      const { id: _id, ...payload } = newPost;
      createPost(payload).catch(err => {
        console.error('[HanapLokal] ❌ Failed to save post to Firestore:', err);
      });
    } else {
      console.warn('[HanapLokal] ⚠️ Firebase not configured — post saved locally only.');
    }
  }, [currentUser]);

  const deletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setComments(prev => prev.filter(c => c.postId !== postId));
    setVouchedPosts(prev => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
    setSavedPostIds(prev => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  }, []);

  const toggleSavePost = useCallback((postId: string): boolean => {
    if (!isLoggedIn) {
      onAuthRequired();
      return false;
    }

    setSavedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    return true;
  }, [isLoggedIn, onAuthRequired]);

  const addAlert = useCallback((payload: Omit<PriceAlert, 'id' | 'userId' | 'active'>): boolean => {
    if (!isLoggedIn) {
      onAuthRequired();
      return false;
    }

    const newAlert: PriceAlert = {
      id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUser?.uid ?? 'current_user',
      productName: payload.productName,
      targetPrice: payload.targetPrice,
      unit: payload.unit,
      radius: payload.radius,
      location: payload.location,
      active: true,
    };

    setAlerts(prev => [newAlert, ...prev]);
    return true;
  }, [currentUser?.uid, isLoggedIn, onAuthRequired]);

  const toggleAlertActive = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => (
      alert.id === alertId ? { ...alert, active: !alert.active } : alert
    )));
  }, []);

  const deleteAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const getCommentsForPost = useCallback((postId: string): Comment[] => {
    return comments
      .filter(c => c.postId === postId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [comments]);

  return (
    <PostsContext.Provider
      value={{
        posts,
        comments,
        alerts,
        vouchedPosts,
        savedPostIds,
        commentSheetPostId,
        openCommentSheet,
        closeCommentSheet,
        toggleVouch,
        addComment,
        addPost,
        deletePost,
        toggleSavePost,
        addAlert,
        toggleAlertActive,
        deleteAlert,
        getCommentsForPost,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
}
