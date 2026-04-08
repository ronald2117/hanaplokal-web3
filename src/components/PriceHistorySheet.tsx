import { X, TrendingDown, TrendingUp, Minus, BarChart3, Bell, ThumbsUp, MessageCircle, Share2, Store, User, Bookmark, Flag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { mockMarketInsights } from '../data/mockData';
import SparklineChart from './SparklineChart';

export default function PriceHistorySheet() {
  const {
    showPriceHistory,
    closePriceHistory,
    requireAuth,
    openPriceAlert,
    openStoreProfile,
    openUserProfile,
    openReportModal,
  } = useApp();
  const { posts, toggleVouch, vouchedPosts, savedPostIds, toggleSavePost, openCommentSheet } = usePosts();

  if (!showPriceHistory) return null;

  const post = posts.find(p => p.id === showPriceHistory);
  if (!post) return null;

  const insight = mockMarketInsights.find(m => m.productName === post.productName);
  if (!insight) return null;

  const isVouched = vouchedPosts.has(post.id);
  const isSaved = savedPostIds.has(post.id);

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };
  const TrendIcon = trendIcons[insight.trendDirection];

  const trendColors = {
    up: 'text-red-500 bg-red-50',
    down: 'text-emerald-600 bg-emerald-50',
    stable: 'text-gray-500 bg-gray-50',
  };

  const trendLabels = {
    up: `↑ Up ${insight.trendPercent}%`,
    down: `↓ Down ${insight.trendPercent}%`,
    stable: '→ Stable',
  };

  const handleAlert = () => {
    if (requireAuth()) {
      closePriceHistory();
      openPriceAlert();
    }
  };

  const handleVouch = () => {
    toggleVouch(post.id);
  };

  const handleComment = () => {
    closePriceHistory();
    setTimeout(() => openCommentSheet(post.id), 220);
  };

  const handleShare = () => {
    if (!navigator.share) return;
    navigator
      .share({
        title: `${post.productName} - P${post.price}/${post.unit}`,
        text: `${post.userName} posted ${post.productName} at ${post.storeName} for P${post.price}/${post.unit}.`,
      })
      .catch(() => {});
  };

  const handleSave = () => {
    toggleSavePost(post.id);
  };

  const handleReport = () => {
    closePriceHistory();
    setTimeout(() => {
      openReportModal({
        type: 'post',
        id: post.id,
        label: `${post.productName} at ${post.storeName}`,
      });
    }, 220);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePriceHistory} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 animate-slide-up shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <button
          onClick={closePriceHistory}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{insight.productName}</h3>
            <p className="text-sm text-gray-500">{insight.locationCluster}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                closePriceHistory();
                setTimeout(() => openUserProfile(post.userId), 220);
              }}
              className="flex items-center gap-2 min-w-0 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {post.userAvatar}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Posted by</p>
                <p className="text-sm font-bold text-gray-900 truncate inline-flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  {post.userName}
                </p>
              </div>
            </button>
            <button
              onClick={() => {
                if (!post.storeId) return;
                closePriceHistory();
                setTimeout(() => openStoreProfile(post.storeId), 220);
              }}
              className="text-right min-w-0"
            >
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Store</p>
              <p className="text-sm font-bold text-orange-700 truncate inline-flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                {post.storeName}
              </p>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleVouch}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                isVouched
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isVouched ? 'fill-current' : ''}`} />
              {isVouched ? 'Vouched' : 'Vouch'}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${isVouched ? 'bg-orange-400/60' : 'bg-white/70 text-orange-700'}`}>
                {post.vouchCount}
              </span>
            </button>
            <button
              onClick={handleComment}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Comment
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-white text-gray-600">{post.commentCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="w-12 h-11 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex items-center justify-center transition-colors"
              aria-label="Share this report"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className={`w-12 h-11 rounded-xl inline-flex items-center justify-center transition-colors ${
                isSaved ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label={isSaved ? 'Remove from saved products' : 'Save this product'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleReport}
              className="w-12 h-11 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex items-center justify-center transition-colors"
              aria-label="Report this post"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Price stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-orange-50 rounded-2xl p-3 text-center">
            <p className="text-[10px] font-medium text-orange-500 uppercase tracking-wider">Average</p>
            <p className="text-xl font-black text-orange-600 mt-1">₱{insight.avgPrice}</p>
            <p className="text-[10px] text-gray-400">/{insight.unit}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 text-center">
            <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">Lowest</p>
            <p className="text-xl font-black text-emerald-600 mt-1">₱{insight.lowestPrice}</p>
            <p className="text-[10px] text-gray-400">/{insight.unit}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 text-center">
            <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Reports</p>
            <p className="text-xl font-black text-blue-600 mt-1">{insight.totalReports}</p>
            <p className="text-[10px] text-gray-400">today</p>
          </div>
        </div>

        {/* Trend badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${trendColors[insight.trendDirection]}`}>
            <TrendIcon className="w-4 h-4" />
            {trendLabels[insight.trendDirection]}
          </div>
          <span className="text-xs text-gray-400">Last 24 hours</span>
        </div>

        {/* Sparkline chart */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-5">
          <p className="text-xs font-medium text-gray-500 mb-2">Price Movement (24h)</p>
          <SparklineChart data={insight.priceHistory} />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-gray-400">24h ago</span>
            <span className="text-[10px] text-gray-400">Now</span>
          </div>
        </div>

        {/* Price range bar */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 mb-2">Price Range</p>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-emerald-400 to-orange-400 rounded-full"
              style={{
                left: '0%',
                width: '100%',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs font-bold text-emerald-600">₱{insight.lowestPrice}</span>
            <span className="text-xs font-bold text-red-500">₱{insight.highestPrice}</span>
          </div>
        </div>

        {/* Set alert button */}
        <button
          onClick={handleAlert}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Bell className="w-5 h-5" />
          Set Price Alert
        </button>
      </div>
    </div>
  );
}
