import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { usePosts } from '../context/PostsContext';
import { useApp } from '../context/AppContext';
import { getTimeAgo } from '../data/mockData';

export default function CommentSheet() {
  const { commentSheetPostId, closeCommentSheet, getCommentsForPost, addComment, posts } = usePosts();
  const { isLoggedIn, requireAuth, openUserProfile } = useApp();
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const post = posts.find(p => p.id === commentSheetPostId);
  const comments = commentSheetPostId ? getCommentsForPost(commentSheetPostId) : [];

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
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-900">Comments</h3>
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </div>
          <button
            onClick={closeCommentSheet}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Post context strip */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {post.userAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{post.productName}</p>
              <p className="text-xs text-gray-500">
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
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 font-medium">No comments yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isCurrentUser = comment.userId === 'current_user';
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
                        className="text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                      >
                        {isCurrentUser ? 'You' : comment.userName}
                      </button>
                      <span className="text-[10px] text-gray-400">{getTimeAgo(comment.timestamp)}</span>
                    </div>
                    <div
                      className={`inline-block rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-full ${
                        isCurrentUser
                          ? 'bg-orange-500 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {comment.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white safe-area-bottom">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={handleInputFocus}
                placeholder={isLoggedIn ? 'Add a comment...' : 'Sign in to comment...'}
                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 pr-12"
                readOnly={!isLoggedIn}
              />
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || sending || !isLoggedIn}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
                newComment.trim() && !sending && isLoggedIn
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200'
                  : 'bg-gray-200 text-gray-400'
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
