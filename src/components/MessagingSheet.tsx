import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, MessageCircle, Send, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMessages } from '../context/MessagesContext';
import { usePosts } from '../context/PostsContext';
import { getTimeAgo } from '../data/mockData';

interface UserMeta {
  name: string;
  avatar: string;
}

export default function MessagingSheet() {
  const { showMessages, closeMessages, currentUser, isLoggedIn } = useApp();
  const { conversations, getMessagesWithUser, sendMessage, markConversationRead } = useMessages();
  const { posts, comments } = usePosts();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeUserId = currentUser?.uid ?? (isLoggedIn ? 'current_user' : null);

  const userMap = useMemo(() => {
    const map = new Map<string, UserMeta>();

    if (activeUserId) {
      map.set(activeUserId, {
        name: currentUser?.displayName ?? 'You',
        avatar: (currentUser?.displayName?.slice(0, 2) ?? 'YO').toUpperCase(),
      });
    }

    posts.forEach(post => {
      if (!map.has(post.userId)) {
        map.set(post.userId, { name: post.userName, avatar: post.userAvatar });
      }
    });

    comments.forEach(comment => {
      if (!map.has(comment.userId)) {
        map.set(comment.userId, { name: comment.userName, avatar: comment.userAvatar });
      }
    });

    return map;
  }, [activeUserId, comments, currentUser?.displayName, posts]);

  useEffect(() => {
    if (!showMessages) return;
    if (showMessages === 'inbox') {
      setSelectedUserId(null);
      return;
    }
    setSelectedUserId(showMessages);
  }, [showMessages]);

  useEffect(() => {
    if (!selectedUserId) return;
    markConversationRead(selectedUserId);
  }, [markConversationRead, selectedUserId]);

  const activeMessages = selectedUserId ? getMessagesWithUser(selectedUserId) : [];
  const activeUserMeta = selectedUserId
    ? userMap.get(selectedUserId) ?? { name: 'Community User', avatar: 'CU' }
    : null;

  useEffect(() => {
    if (!selectedUserId || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeMessages.length, selectedUserId]);

  if (!showMessages) return null;

  return (
    <div className="fixed inset-0 z-[97] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeMessages} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden" style={{ height: '90vh' }}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />

        <div className="px-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          {selectedUserId ? (
            <button
              onClick={() => setSelectedUserId(null)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-orange-500" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">
              {selectedUserId ? activeUserMeta?.name : 'Messages'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {selectedUserId ? 'Direct message' : 'Talk with community members'}
            </p>
          </div>

          <button
            onClick={closeMessages}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!selectedUserId ? (
          <div className="overflow-y-auto h-[calc(90vh-78px)] px-4 py-4">
            {conversations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center px-6">
                <div>
                  <div className="w-16 h-16 mx-auto rounded-full bg-orange-50 flex items-center justify-center mb-3">
                    <MessageCircle className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="font-bold text-gray-900">No conversations yet</p>
                  <p className="text-sm text-gray-500 mt-1">Open a user profile and tap Message to start chatting.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map(conversation => {
                  const meta = userMap.get(conversation.userId) ?? { name: 'Community User', avatar: 'CU' };
                  return (
                    <button
                      key={conversation.conversationId}
                      onClick={() => setSelectedUserId(conversation.userId)}
                      className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-2xl p-3.5 flex items-start gap-3 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                        {meta.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm text-gray-900 truncate">{meta.name}</p>
                          <p className="text-[10px] text-gray-400">{getTimeAgo(conversation.lastMessageAt)}</p>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="overflow-y-auto h-[calc(90vh-145px)] px-4 py-4 space-y-2 bg-gray-50">
              {activeMessages.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">Say hi to start your conversation.</p>
              ) : (
                activeMessages.map(message => {
                  const mine = message.fromUserId === activeUserId;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          mine ? 'bg-orange-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className={`text-[10px] mt-1 ${mine ? 'text-orange-100' : 'text-gray-400'}`}>
                          {getTimeAgo(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-100 px-3 py-2.5 bg-white">
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      if (!selectedUserId) return;
                      const ok = sendMessage(selectedUserId, draft);
                      if (ok) setDraft('');
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <button
                  onClick={() => {
                    if (!selectedUserId) return;
                    const ok = sendMessage(selectedUserId, draft);
                    if (ok) setDraft('');
                  }}
                  className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center disabled:bg-gray-300"
                  disabled={!draft.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
