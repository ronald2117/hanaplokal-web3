import { useState } from 'react';
import { X, TrendingDown, TrendingUp, Minus, BarChart3, Bell, ThumbsUp, MessageCircle, Share2, Store, User, Bookmark, Flag, Map, ExternalLink, MapPin, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import SparklineChart from './SparklineChart';
import { mockMarketInsights, getCategoryEmoji, getMediaEmoji, getMediaGradient } from '../data/mockData';
import { useLocation } from '../context/LocationContext';

export default function PriceHistorySheet() {
  const {
    showPriceHistory,
    closePriceHistory,
    openPriceHistory,
    requireAuth,
    openPriceAlert,
    openStoreProfile,
    openUserProfile,
    openReportModal,
    focusOnMap,
    currentUser,
  } = useApp();
  const { posts, toggleVouch, vouchedPosts, savedPostIds, toggleSavePost, openCommentSheet, userDeletePost } = usePosts();
  const { isWithinRadius, getDistanceFromUser } = useLocation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!showPriceHistory) return null;

  const post = posts.find(p => p.id === showPriceHistory);
  if (!post) return null;

  // Compute dynamic insights from live posts with matching normalized names
  const normalizedProductName = post.productName.trim().toLowerCase();
  const relatedPosts = posts.filter(p => p.productName.trim().toLowerCase() === normalizedProductName);
  
  let insight = null;
  if (relatedPosts.length > 0) {
    const prices = relatedPosts.map(p => p.price);
    const avgPrice = Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2));
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const totalReports = prices.length;
    
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (avgPrice > lowestPrice * 1.08) trendDirection = 'up';
    else if (avgPrice < highestPrice * 0.92) trendDirection = 'down';
    
    const trendPercent = Number((((highestPrice - lowestPrice) / Math.max(lowestPrice, 1)) * 100).toFixed(1));

    // Simple mock historical curve + actual live prices appended
    const mockInsight = mockMarketInsights.find(m => m.productName.trim().toLowerCase() === normalizedProductName);
    let priceHistory = mockInsight ? [...mockInsight.priceHistory] : [];
    prices.forEach(p => priceHistory.push(p));
    // Pad to have enough points for sparkline
    if (priceHistory.length < 5) priceHistory = [avgPrice, avgPrice, ...priceHistory];

    insight = {
      avgPrice,
      lowestPrice,
      highestPrice,
      totalReports,
      trendDirection,
      trendPercent,
      unit: post.unit,
      priceHistory: priceHistory.slice(-15), // keep last 15 points max for the spark chart
    };
  }

  const isVouched = vouchedPosts.has(post.id);
  const isSaved = savedPostIds.has(post.id);

  const trendColors = {
    up: 'text-red-500 bg-red-50',
    down: 'text-emerald-600 bg-emerald-50',
    stable: 'text-gray-500 bg-gray-50',
  };

  const handleAlert = () => {
    if (requireAuth()) {
      closePriceHistory();
      openPriceAlert();
    }
  };

  const handleVouch = () => toggleVouch(post.id);

  const handleComment = () => {
    closePriceHistory();
    setTimeout(() => openCommentSheet(post.id), 220);
  };

  const handleShare = () => {
    if (!navigator.share) return;
    navigator.share({
      title: `${post.productName} - ₱${post.price}/${post.unit}`,
      text: `${post.userName} posted ${post.productName} at ${post.storeName} for ₱${post.price}/${post.unit}.`,
    }).catch(() => {});
  };

  const handleSave = () => toggleSavePost(post.id);

  const handleReport = () => {
    closePriceHistory();
    setTimeout(() => {
      openReportModal({ type: 'post', id: post.id, label: `${post.productName} at ${post.storeName}` });
    }, 220);
  };

  const handleDelete = () => {
    userDeletePost(post);
    closePriceHistory();
  };

  const isOwner = Boolean(currentUser && currentUser.uid === post.userId);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePriceHistory} />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 animate-slide-up shadow-2xl overflow-y-auto"
        style={{ maxHeight: '90vh' }}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <button
          onClick={closePriceHistory}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Post header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{post.productName}</h3>
            <p className="text-sm text-gray-500">{post.location}</p>
          </div>
        </div>

        {/* Price highlight */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-xs font-medium">Reported Price</p>
            <p className="text-white text-3xl font-black">
              ₱{post.price}
              <span className="text-base font-medium opacity-80">/{post.unit}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-orange-100 text-xs">{post.marketInsight}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
              post.insightType === 'below' || post.insightType === 'lowest'
                ? 'bg-emerald-400/30 text-white'
                : post.insightType === 'above'
                ? 'bg-red-400/30 text-white'
                : 'bg-white/20 text-white'
            }`}>
              {post.category}
            </span>
          </div>
        </div>

        {/* User + Store + Actions */}
        <div className="bg-gray-50 rounded-2xl p-3 mb-4 space-y-2.5">

          {/* Row 1: Posted by + Store */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => { closePriceHistory(); setTimeout(() => openUserProfile(post.userId), 220); }}
              className="flex items-center gap-2 min-w-0 text-left flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {post.userAvatar}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Posted by</p>
                <p className="text-sm font-bold text-gray-900 truncate">{post.userName}</p>
              </div>
            </button>
            <button
              onClick={() => {
                if (!post.storeId) return;
                closePriceHistory();
                setTimeout(() => openStoreProfile(post.storeId), 220);
              }}
              className="text-right min-w-0 flex-1"
            >
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Store</p>
              <p className="text-sm font-bold text-orange-700 truncate flex items-center justify-end gap-1">
                <Store className="w-3 h-3 flex-shrink-0" />
                {post.storeName}
              </p>
            </button>
          </div>

          {/* Row 2: Primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleVouch}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                isVouched ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
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
          </div>

          {/* Row 3: Secondary icon actions + map links */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: icon-only secondary actions */}
            <div className="flex items-center gap-1">
              <button onClick={handleShare} className="w-9 h-9 rounded-xl bg-white text-gray-500 hover:bg-gray-100 inline-flex items-center justify-center transition-colors" aria-label="Share">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={handleSave} className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-colors ${isSaved ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-500 hover:bg-gray-100'}`} aria-label="Save">
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button onClick={handleReport} className="w-9 h-9 rounded-xl bg-white text-gray-500 hover:bg-gray-100 inline-flex items-center justify-center transition-colors" aria-label="Report">
                <Flag className="w-4 h-4" />
              </button>
              {isOwner && (
                confirmDelete ? (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={handleDelete}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-500 text-white active:scale-95"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white text-gray-600 active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-9 h-9 rounded-xl bg-white text-red-400 hover:bg-red-50 inline-flex items-center justify-center transition-colors ml-1"
                    aria-label="Delete my post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}
            </div>

            {/* Right: map links */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => { closePriceHistory(); setTimeout(() => focusOnMap(post.id, 'prices'), 220); }}
                className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 inline-flex items-center justify-center transition-colors active:scale-[0.98]"
                aria-label="View on map"
              >
                <Map className="w-4 h-4" />
              </button>
              <a
                href={`https://www.google.com/maps?q=${post.locationCoords.lat},${post.locationCoords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white text-gray-500 hover:bg-gray-100 inline-flex items-center justify-center transition-colors active:scale-[0.98]"
                aria-label="Open in Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Market insight section — only when mock data is available */}
        {insight ? (
          <>
            {/* <div className="grid grid-cols-3 gap-3 mb-5">
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

            <div className="flex items-center justify-between mb-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${trendColors[insight.trendDirection]}`}>
                {insight.trendDirection === 'up'
                  ? <TrendingUp className="w-4 h-4" />
                  : insight.trendDirection === 'down'
                  ? <TrendingDown className="w-4 h-4" />
                  : <Minus className="w-4 h-4" />
                }
                {insight.trendDirection === 'up'
                  ? `↑ Up ${insight.trendPercent}%`
                  : insight.trendDirection === 'down'
                  ? `↓ Down ${insight.trendPercent}%`
                  : '→ Stable'}
              </div>
              <span className="text-xs text-gray-400">Last 24 hours</span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-5">
              <p className="text-xs font-medium text-gray-500 mb-2">Price Movement (24h)</p>
              <SparklineChart data={insight.priceHistory} />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-gray-400">24h ago</span>
                <span className="text-[10px] text-gray-400">Now</span>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 mb-2">Price Range</p>
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="absolute h-full bg-gradient-to-r from-emerald-400 to-orange-400 rounded-full" style={{ left: '0%', width: '100%' }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs font-bold text-emerald-600">₱{insight.lowestPrice}</span>
                <span className="text-xs font-bold text-red-500">₱{insight.highestPrice}</span>
              </div>
            </div> */}
          </>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-5 mb-5 text-center">
            <p className="text-2xl mb-1">📊</p>
            <p className="text-sm font-semibold text-gray-600">No price history yet</p>
            <p className="text-xs text-gray-400 mt-1">
              More data will appear as the community reports prices for this item.
            </p>
          </div>
        )}

        {/* Similar Products Nearby */}
        {(() => {
          const similarPosts = posts.filter(p => 
            p.id !== post.id && 
            p.category === post.category && 
            isWithinRadius(p.locationCoords)
          );

          if (similarPosts.length === 0) return null;

          return (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-900 mb-3 px-1">Similar Products Nearby</h4>
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar -mx-5 px-5">
                {similarPosts.map(sp => {
                  const distance = getDistanceFromUser(sp.locationCoords);
                  const formattedDistance = distance < 1 ? '< 1' : distance.toFixed(1);
                  return (
                    <button
                      key={sp.id}
                      onClick={() => {
                        closePriceHistory();
                        setTimeout(() => openPriceHistory(sp.id), 300);
                      }}
                      className="snap-start flex-shrink-0 w-40 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left active:scale-95 transition-transform"
                    >
                      <div className={`aspect-video bg-gradient-to-br ${getMediaGradient(sp.mediaUrl)} flex items-center justify-center`}>
                        <span className="text-3xl">{getCategoryEmoji(sp.category) || getMediaEmoji(sp.mediaUrl)}</span>
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-gray-900 text-sm truncate">{sp.productName}</p>
                        <p className="text-orange-600 font-black text-sm mt-0.5">₱{sp.price}/{sp.unit}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{sp.storeName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {formattedDistance}km
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 
        <button
          onClick={handleAlert}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Bell className="w-5 h-5" />
          Set Price Alert
        </button>
        */}
      </div>
    </div>
  );
}
