import { useState } from 'react';
import { Clock, ThumbsUp, MessageCircle, Share2, AlertTriangle, TrendingDown, TrendingUp, Minus, MapPin, Store, Bookmark, Flag, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { type Post, getTimeAgo, getPostAge, getMediaGradient, getMediaEmoji } from '../data/mockData';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { openPriceHistory, openStoreProfile, openUserProfile, openReportModal, isAdmin } = useApp();
  const { toggleVouch, vouchedPosts, savedPostIds, toggleSavePost, openCommentSheet, adminDeletePost } = usePosts();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const age = getPostAge(post.timestamp);
  const isVouched = vouchedPosts.has(post.id);
  const isSaved = savedPostIds.has(post.id);

  const handleVouch = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleVouch(post.id);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCommentSheet(post.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${post.productName} – ₱${post.price}/${post.unit}`,
        text: `Found ${post.productName} at ₱${post.price}/${post.unit} in ${post.storeName}. Check it on HanapLokal!`,
      }).catch(() => { });
    }
  };

  const handleStoreTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.storeId) {
      openStoreProfile(post.storeId);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSavePost(post.id);
  };

  const handleUserTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    openUserProfile(post.userId);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    openReportModal({
      type: 'post',
      id: post.id,
      label: `${post.productName} at ${post.storeName}`,
    });
  };

  const insightColors = {
    below: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    lowest: 'bg-blue-50 text-blue-700 border-blue-200',
    above: 'bg-red-50 text-red-700 border-red-200',
    average: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const insightIcons = {
    below: TrendingDown,
    lowest: TrendingDown,
    above: TrendingUp,
    average: Minus,
  };

  const InsightIcon = insightIcons[post.insightType];

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 active:scale-[0.99] transition-all duration-200 cursor-pointer ${age === 'expired' ? 'opacity-50' : ''
        }`}
      onClick={() => openPriceHistory(post.id)}
    >
      {/* User header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <button
          onClick={handleUserTap}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 active:scale-95 transition-transform"
        >
          {post.userAvatar}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUserTap}
              className="font-semibold text-gray-900 text-sm truncate hover:text-orange-600 transition-colors"
            >
              {post.userName}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-orange-50 text-orange-700">
              {post.vouchCount} vouches
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {getTimeAgo(post.timestamp)}
            </span>
          </div>
        </div>
        {age === 'expiring' && (
          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Expiring
          </div>
        )}
      </div>

      {/* Media section */}
      <div className="relative mx-3 rounded-xl overflow-hidden">
        {post.mediaUrl.startsWith('http') ? (
          post.mediaUrl.match(/\.(mp4|mov|webm|ogg)(\?|$)/i) ? (
            <div className="aspect-[4/3] bg-black">
              <video
                src={post.mediaUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-gray-100">
              <img
                src={post.mediaUrl}
                alt={post.productName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )
        ) : (
          <div className={`aspect-[4/3] bg-gradient-to-br ${getMediaGradient(post.mediaUrl)} flex items-center justify-center`}>
            <span className="text-7xl">{getMediaEmoji(post.mediaUrl)}</span>
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-orange-300/50">
            <span className="text-2xl font-black">₱{post.price}</span>
            <span className="text-sm font-medium opacity-90">/{post.unit}</span>
          </div>
        </div>

        {/* Store chip - tappable */}
        <div className="absolute top-3 right-3">
          <button
            onClick={handleStoreTap}
            className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:bg-white hover:shadow-md transition-all active:scale-95"
          >
            <Store className="w-3 h-3 text-orange-500" />
            {post.storeName}
          </button>
        </div>
      </div>

      {/* Product name + Market insight */}
      <div className="px-4 pt-3">
        <h3 className="font-bold text-gray-900">{post.productName}</h3>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border ${insightColors[post.insightType]}`}>
            <InsightIcon className="w-3 h-3" />
            {post.marketInsight}
          </div>
          {/* Store link chip */}
          <button
            onClick={handleStoreTap}
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors active:scale-95"
          >
            <MapPin className="w-3 h-3" />
            {post.storeName}
          </button>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-1 px-4 py-3">
        <button
          onClick={handleVouch}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${isVouched
              ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
              : 'bg-orange-50 hover:bg-orange-100 text-orange-600'
            }`}
        >
          <ThumbsUp className={`w-4 h-4 ${isVouched ? 'fill-current' : ''}`} />
          {isVouched ? 'Vouched' : 'Vouch'}
          <span className={`px-1.5 py-0.5 rounded-md text-xs ${isVouched ? 'bg-orange-400/50' : 'bg-orange-200/60'
            }`}>
            {post.vouchCount}
          </span>
        </button>
        <button
          onClick={handleComment}
          className="flex items-center gap-1.5 text-gray-500 hover:bg-gray-100 px-3 py-2 rounded-xl text-sm transition-colors active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          {post.commentCount}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-gray-500 hover:bg-gray-100 px-3 py-2 rounded-xl text-sm transition-colors active:scale-95 ml-auto"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors active:scale-95 ${isSaved ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          aria-label={isSaved ? 'Remove from saved products' : 'Save product'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={handleReport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors active:scale-95"
          aria-label="Report this post"
        >
          <Flag className="w-4 h-4" />
        </button>

        {/* Admin delete button */}
        {isAdmin && (
          confirmDelete ? (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={e => { e.stopPropagation(); adminDeletePost(post); setConfirmDelete(false); }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-500 text-white active:scale-95"
              >
                Delete
              </button>
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-600 active:scale-95"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors active:scale-95"
              aria-label="Admin delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
