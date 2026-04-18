import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Trash2 } from 'lucide-react';
import { usePosts } from '../context/PostsContext';
import { useApp } from '../context/AppContext';
import { getTimeAgo } from '../data/mockData';
import { subscribeToPostComments } from '../services/firestore';
import { isFirebaseConfigured } from '../lib/firebase';
import type { Comment } from '../data/mockData';

export default function CommentSheet() {
  const { commentSheetPostId, closeCommentSheet, getCommentsForPost, addComment, deleteComment, posts } = usePosts();
  const { isLoggedIn, requireAuth, openUserProfile, currentUser, isAdmin } = useApp();
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [liveComments, setLiveComments] = useState<Comment[] | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const post = posts.find(p => p.id === commentSheetPostId);
  // Use live per-post subscription when Firebase is configured, fall back to context cache
  const comments = isFirebaseConfigured
    ? (liveComments ?? [])
    : (commentSheetPostId ? getCommentsForPost(commentSheetPostId) : []);

  // Subscribe to this post's comments directly when the sheet opens
  useEffect(() => {
    if (!commentSheetPostId || !isFirebaseConfigured) {
      setLiveComments(null);
      return;
    }
    setLiveComments(null); // reset while loading
    const unsub = subscribeToPostComments(commentSheetPostId, (data) => {
      setLiveComments(data);
    });
    return () => { if (unsub) unsub(); };
  }, [commentSheetPostId]);

  // Scroll to bottom when comments change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length]);

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (commentSheetPostId && isLoggedIn) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [commentSheetPostId, isLoggedIn]);

  if (!commentSheetPostId || !post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!isLoggedIn) {
      requireAuth();
      return;
    }

    setSending(true);
    // Simulate tiny delay for feedback
    setTimeout(() => {
      addComment(commentSheetPostId, newComment);
      setNewComment('');
      setSending(false);
    }, 150);
  };

  const handleInputFocus = () => {
    if (!isLoggedIn) {
      requireAuth();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCommentSheet} />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl animate-slide-up flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Comments</h3>
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </div>
          <button
            onClick={closeCommentSheet}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        {/* Post context strip */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {post.userAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{post.productName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ₱{post.price}/{post.unit} · {post.storeName}
              </p>
            </div>
            <div className="bg-orange-500 text-white text-sm font-black px-2.5 py-1 rounded-lg flex-shrink-0">
              ₱{post.price}
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-4 min-h-0">
          {isFirebaseConfigured && liveComments === null ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500 text-sm">Loading comments…</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No comments yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isCurrentUser = currentUser
                ? comment.userId === currentUser.uid
                : comment.userId === 'current_user';
              const isPendingDelete = confirmDeleteId === comment.id;
              return (
                <div key={comment.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                      isCurrentUser
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                        : 'bg-gradient-to-br from-orange-400 to-orange-600'
                    }`}
                  >
                    {comment.userAvatar}
                  </div>
                  <div className={`flex-1 min-w-0 ${isCurrentUser ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                      <button
                        onClick={() => {
                          if (!isCurrentUser) {
                            closeCommentSheet();
                            setTimeout(() => openUserProfile(comment.userId), 250);
                          }
                        }}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                      >
                        {isCurrentUser ? 'You' : comment.userName}
                      </button>
                      <span className="text-[10px] text-gray-400">{getTimeAgo(comment.timestamp)}</span>
                      {(isCurrentUser || isAdmin) && (
                        <button
                          onClick={() => setConfirmDeleteId(isPendingDelete ? null : comment.id)}
                          className={`w-5 h-5 flex items-center justify-center rounded-full transition-all ${
                            isAdmin && !isCurrentUser
                              ? 'text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
                              : 'text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                          }`}
                          aria-label="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`inline-block rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-full ${
                        isCurrentUser
                          ? 'bg-orange-500 text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-md'
                      }`}
                    >
                      {comment.text}
                    </div>
                    {isPendingDelete && (
                      <div className="mt-2 flex items-center gap-2 justify-end">
                        <span className="text-xs text-gray-400">Delete this comment?</span>
                        <button
                          onClick={() => {
                            deleteComment(comment.id, comment.postId);
                            setConfirmDeleteId(null);
                          }}
                          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all px-2.5 py-1 rounded-full"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700/60 px-4 py-3 bg-white dark:bg-gray-900 safe-area-bottom">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={handleInputFocus}
                placeholder={isLoggedIn ? 'Add a comment...' : 'Sign in to comment...'}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 pr-12"
                readOnly={!isLoggedIn}
              />
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || sending || !isLoggedIn}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
                newComment.trim() && !sending && isLoggedIn
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}
            >
              <Send className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
