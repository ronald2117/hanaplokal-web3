import { X, CheckCircle, MapPin, Clock, ThumbsUp, MessageCircle, ChevronRight, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { useLocation } from '../context/LocationContext';
import { getTimeAgo, getMediaEmoji } from '../data/mockData';

export default function UserProfile() {
  const {
    showUserProfile,
    closeUserProfile,
    openPriceHistory,
    openMessages,
    currentUser,
    isLoggedIn,
    requireAuth,
  } = useApp();
  const { posts } = usePosts();
  const { isWithinRadius } = useLocation();

  if (!showUserProfile) return null;

  const userPosts = posts
    .filter(post => post.userId === showUserProfile && isWithinRadius(post.locationCoords))
    .sort((a, b) => b.timestamp - a.timestamp);

  // Fall back to any post by this user if none are currently within radius.
  const fallbackPost = posts.find(post => post.userId === showUserProfile);
  const profileSource = userPosts[0] ?? fallbackPost;

  if (!profileSource) return null;

  const totalVouches = userPosts.reduce((sum, post) => sum + post.vouchCount, 0);
  const totalComments = userPosts.reduce((sum, post) => sum + post.commentCount, 0);
  const viewerId = currentUser?.uid ?? (isLoggedIn ? 'current_user' : null);
  const canMessage = showUserProfile !== viewerId;

  const handleMessage = () => {
    if (!isLoggedIn) {
      requireAuth();
      return;
    }

    closeUserProfile();
    setTimeout(() => openMessages(showUserProfile), 250);
  };

  return (
    <div className="fixed inset-0 z-[96] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeUserProfile} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden" style={{ maxHeight: '92vh' }}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />

        <button
          onClick={closeUserProfile}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center z-10"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 20px)' }}>
          <div className="px-5 pt-2 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xl font-black flex items-center justify-center shadow-md">
                {profileSource.userAvatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900 truncate">{profileSource.userName}</h2>
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <MapPin className="w-3 h-3 text-orange-500" />
                  <span className="truncate">{profileSource.location}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>Last active {getTimeAgo(profileSource.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-orange-50 rounded-2xl p-3 text-center">
                <p className="text-[10px] font-medium text-orange-500 uppercase tracking-wider">Posts</p>
                <p className="text-xl font-black text-orange-600 mt-0.5">{userPosts.length}</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-3 text-center">
                <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Vouches</p>
                <p className="text-xl font-black text-blue-600 mt-0.5">{totalVouches}</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">Comments</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{totalComments}</p>
              </div>
            </div>

            {canMessage && (
              <button
                onClick={handleMessage}
                className="mt-4 w-full rounded-2xl bg-orange-500 text-white font-semibold py-3 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Send className="w-4 h-4" />
                Message {profileSource.userName}
              </button>
            )}
          </div>

          <div className="h-2 bg-gray-50" />

          <div className="px-5 pt-4 pb-6">
            <h3 className="font-bold text-gray-900 mb-3">Recent Price Posts</h3>
            {userPosts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 font-medium text-sm">No nearby posts in selected radius</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userPosts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => {
                      closeUserProfile();
                      setTimeout(() => openPriceHistory(post.id), 300);
                    }}
                    className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl p-3.5 flex items-center gap-3 transition-colors active:scale-[0.98] text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-gray-100">
                      {getMediaEmoji(post.mediaUrl)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{post.productName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-black text-orange-600">₱{post.price}</span>
                        <span className="text-xs text-gray-400">/{post.unit}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{post.storeName}</span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400">{getTimeAgo(post.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-orange-100 text-orange-700 font-semibold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                        <ThumbsUp className="w-2.5 h-2.5" />
                        {post.vouchCount}
                      </span>
                      <span className="text-[10px] bg-gray-200 text-gray-700 font-semibold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                        <MessageCircle className="w-2.5 h-2.5" />
                        {post.commentCount}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
