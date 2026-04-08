import { useState } from 'react';
import { X, MapPin, Clock, Star, CheckCircle, ChevronRight, TrendingDown, TrendingUp, Minus, Tag, ThumbsUp, Flag, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePosts } from '../context/PostsContext';
import { useStores } from '../context/StoresContext';
import { useLocation } from '../context/LocationContext';
import { getStoreTypeLabel, getStoreEmoji, getTimeAgo, getMediaEmoji } from '../data/mockData';

export default function StoreProfile() {
  const { showStoreProfile, closeStoreProfile, openPriceHistory, openReportModal, isAdmin } = useApp();
  const { posts } = usePosts();
  const { stores, toggleStoreVouch, vouchedStores, adminDeleteStore } = useStores();
  const { isWithinRadius } = useLocation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!showStoreProfile) return null;

  const store = stores.find(s => s.id === showStoreProfile && isWithinRadius(s.locationCoords));
  if (!store) return null;

  const isStoreVouched = vouchedStores.has(store.id);

  // Find all posts mentioning this store
  const storePosts = posts.filter(p => p.storeId === store.id && isWithinRadius(p.locationCoords));

  // Compute price stats for this store
  const avgPrice = storePosts.length > 0
    ? (storePosts.reduce((sum, p) => sum + p.price, 0) / storePosts.length).toFixed(0)
    : '—';
  const lowestPost = storePosts.length > 0
    ? storePosts.reduce((min, p) => p.price < min.price ? p : min)
    : null;

  // Group posts by category
  const categoryGroups: Record<string, typeof storePosts> = {};
  storePosts.forEach(p => {
    if (!categoryGroups[p.category]) categoryGroups[p.category] = [];
    categoryGroups[p.category].push(p);
  });

  const insightColors = {
    below: 'text-emerald-600',
    lowest: 'text-blue-600',
    above: 'text-red-500',
    average: 'text-gray-500',
  };

  const insightIcons = {
    below: TrendingDown,
    lowest: TrendingDown,
    above: TrendingUp,
    average: Minus,
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeStoreProfile} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden" style={{ maxHeight: '92vh' }}>
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />

        {/* Close button */}
        <button
          onClick={closeStoreProfile}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center z-10"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 20px)' }}>
          {/* Store header */}
          <div className="px-5 pb-4 pt-2">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                {getStoreEmoji(store.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900 truncate">{store.name}</h2>
                  {store.verified && (
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    {getStoreTypeLabel(store.type)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${store.verified ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {store.verified ? 'Verified Store' : 'Unverified Store'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-gray-700">{store.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
                  <MapPin className="w-3 h-3 text-orange-500" />
                  <span className="truncate">{store.address}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{store.openHours}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{store.description}</p>

            <div className="mt-3 bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Community Vouches</span>
              <span className="text-sm font-black text-orange-600">{store.vouchCount}</span>
            </div>

            {/* Category tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {store.categories.map(cat => (
                <span key={cat} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 px-5 pb-4">
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-medium text-orange-500 uppercase tracking-wider">Posts</p>
              <p className="text-xl font-black text-orange-600 mt-0.5">{storePosts.length}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">Avg Price</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">₱{avgPrice}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Lowest</p>
              <p className="text-xl font-black text-blue-600 mt-0.5">
                {lowestPost ? `₱${lowestPost.price}` : '—'}
              </p>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleStoreVouch(store.id)}
                className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  isStoreVouched ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-orange-50 text-orange-600'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${isStoreVouched ? 'fill-current' : ''}`} />
                {isStoreVouched ? 'Vouched' : 'Vouch'}
                <span className={`px-2 py-0.5 rounded-md text-xs ${isStoreVouched ? 'bg-orange-400/60' : 'bg-orange-100'}`}>
                  {store.vouchCount}
                </span>
              </button>
              <button
                onClick={() => {
                  closeStoreProfile();
                  setTimeout(() => {
                    openReportModal({
                      type: 'store',
                      id: store.id,
                      label: store.name,
                    });
                  }, 200);
                }}
                className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-red-50 text-red-600 active:scale-[0.98]"
              >
                <Flag className="w-4 h-4" />
                Report
              </button>
            </div>
            {isAdmin && (
              <div className="mt-2 text-center">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        adminDeleteStore(store);
                        setConfirmDelete(false);
                        closeStoreProfile();
                      }}
                      className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 text-white active:scale-95"
                    >
                      Delete Store
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-red-50 text-red-500 hover:bg-red-100 active:scale-[0.98] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Store (Admin)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-2 bg-gray-50" />

          {/* Price Reports Section */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" />
                Price Reports
              </h3>
              <span className="text-xs text-gray-400">{storePosts.length} total</span>
            </div>

            {storePosts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 font-medium text-sm">No price reports yet</p>
                <p className="text-gray-400 text-xs mt-1">Be the first to post a price from this store!</p>
              </div>
            ) : (
              <div className="space-y-2 pb-6">
                {storePosts.map(post => {
                  const InsightIcon = insightIcons[post.insightType];
                  return (
                    <button
                      key={post.id}
                      onClick={() => {
                        closeStoreProfile();
                        setTimeout(() => openPriceHistory(post.id), 300);
                      }}
                      className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl p-3.5 flex items-center gap-3 transition-colors active:scale-[0.98] text-left"
                    >
                      {/* Product emoji */}
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-gray-100">
                        {getMediaEmoji(post.mediaUrl)}
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{post.productName}</h4>
                          <InsightIcon className={`w-3 h-3 flex-shrink-0 ${insightColors[post.insightType]}`} />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-black text-orange-600">₱{post.price}</span>
                          <span className="text-xs text-gray-400">/{post.unit}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">{getTimeAgo(post.timestamp)}</span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] text-gray-400">{post.vouchCount} vouches</span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom safe area padding */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
