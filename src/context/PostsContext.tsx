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
  deleteComment as deleteCommentRemote,
  loadUserVouches,
  subscribeToComments,
  subscribeToPosts,
  subscribeToDeletedPosts,
  softDeletePost,
  restorePost as restorePostRemote,
  toggleVouch as toggleVouchRemote,
  permanentlyDeletePost,
} from '../services/firestore';
import { isFirebaseConfigured } from '../lib/firebase';

interface PostsContextType {
  posts: Post[];
  comments: Comment[];
  alerts: PriceAlert[];
  postsLoading: boolean;
  vouchedPosts: Set<string>;
  savedPostIds: Set<string>;
  commentSheetPostId: string | null;
  openCommentSheet: (postId: string) => void;
  closeCommentSheet: () => void;
  toggleVouch: (postId: string) => boolean;
  addComment: (postId: string, text: string) => boolean;
  deleteComment: (commentId: string, postId: string) => void;
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
  userDeletePost: (post: import('../data/mockData').Post) => void;
  adminDeletePost: (post: import('../data/mockData').Post) => void;
  deletedPosts: import('../data/mockData').Post[];
  restorePost: (post: import('../data/mockData').Post) => void;
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
  isAdmin: boolean;
  currentUser: User | null;
  onAuthRequired: () => void;
}

export function PostsProvider({ children, isLoggedIn, isAdmin, currentUser, onAuthRequired }: PostsProviderProps) {
  const [posts, setPosts] = useState<Post[]>(isFirebaseConfigured ? [] : mockPosts);
  const [comments, setComments] = useState<Comment[]>(isFirebaseConfigured ? [] : mockComments);
  const [deletedPosts, setDeletedPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(isFirebaseConfigured);
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

    const unsubPosts = subscribeToPosts(data => {
      setPosts(data);
      setPostsLoading(false);
    });
    const unsubComments = subscribeToComments(setComments);
    const unsubDeleted = isAdmin ? subscribeToDeletedPosts(setDeletedPosts) : null;

    return () => {
      if (unsubPosts) unsubPosts();
      if (unsubComments) unsubComments();
      if (unsubDeleted) unsubDeleted();
    };
  }, [isAdmin]);

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

  const deleteComment = useCallback((commentId: string, postId: string): void => {
    // Optimistic: remove locally and decrement count
    const removed = comments.find(c => c.id === commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, commentCount: Math.max(p.commentCount - 1, 0) } : p
      )
    );

    if (isFirebaseConfigured) {
      deleteCommentRemote(commentId, postId).catch(err => {
        console.error('[HanapLokal] ❌ Failed to delete comment:', err);
        // Rollback
        if (removed) setComments(prev => [...prev, removed].sort((a, b) => a.timestamp - b.timestamp));
        setPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
          )
        );
      });
    }
  }, [comments, isFirebaseConfigured]);

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
      mediaUrl: postData.mediaUrl.startsWith('http') ? postData.mediaUrl : (gradient !== 'from-gray-100 via-gray-50 to-gray-100' ? mediaKey : postData.category.toLowerCase()),
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

  const userDeletePost = useCallback((post: Post) => {
    // Guard: only the post's owner may call this
    if (!isLoggedIn || !currentUser || currentUser.uid !== post.userId) return;

    // Optimistic removal
    setPosts(prev => prev.filter(p => p.id !== post.id));
    setComments(prev => prev.filter(c => c.postId !== post.id));
    setVouchedPosts(prev => { const next = new Set(prev); next.delete(post.id); return next; });
    setSavedPostIds(prev => { const next = new Set(prev); next.delete(post.id); return next; });

    if (isFirebaseConfigured) {
      permanentlyDeletePost(post.id).catch(err => {
        console.error('[HanapLokal] ❌ Failed to permanently delete post:', err);
        // Roll back
        setPosts(prev => [post, ...prev]);
      });
    }
  }, [currentUser, isLoggedIn]);

  const adminDeletePost = useCallback((post: Post) => {
    // Optimistic: remove from local state
    setPosts(prev => prev.filter(p => p.id !== post.id));
    setDeletedPosts(prev => [post, ...prev]);

    if (isFirebaseConfigured && currentUser) {
      softDeletePost(post, currentUser.uid, currentUser.displayName ?? 'Admin').catch(err => {
        console.error('[HanapLokal] ❌ Failed to admin-delete post:', err);
        // Rollback
        setPosts(prev => [post, ...prev]);
        setDeletedPosts(prev => prev.filter(p => p.id !== post.id));
      });
    }
  }, [currentUser]);

  const restorePost = useCallback((post: Post) => {
    // Optimistic: move from deletedPosts back to posts
    setDeletedPosts(prev => prev.filter(p => p.id !== post.id));
    setPosts(prev => [post, ...prev]);

    if (isFirebaseConfigured) {
      restorePostRemote(post).catch(err => {
        console.error('[HanapLokal] ❌ Failed to restore post:', err);
        // Rollback
        setDeletedPosts(prev => [post, ...prev]);
        setPosts(prev => prev.filter(p => p.id !== post.id));
      });
    }
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
        postsLoading,
        vouchedPosts,
        savedPostIds,
        commentSheetPostId,
        openCommentSheet,
        closeCommentSheet,
        toggleVouch,
        addComment,
        deleteComment,
        addPost,
        deletePost,
        userDeletePost,
        adminDeletePost,
        deletedPosts,
        restorePost,
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
