import { useState } from 'react';
import {
  LogOut,
  CheckCircle,
  Bell,
  ShieldCheck,
  Camera,
  Settings,
  ChevronRight,
  ChevronLeft,
  Star,
  TrendingUp,
  User,
  MapPin,
  Moon,
  Globe,
  Info,
  Save,
  X,
  Trash2,
  MessageCircle,
  ThumbsUp,
  Store,
  Clock,
  Package,
  Bookmark,
  Award,
  Users,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLocation } from '../context/LocationContext';
import { usePosts } from '../context/PostsContext';
import { useStores } from '../context/StoresContext';
import { useReports } from '../context/ReportsContext';
import { useMessages } from '../context/MessagesContext';
import { useBan } from '../context/BanContext';
import { getTimeAgo, getMediaEmoji, getStoreEmoji } from '../data/mockData';

type SubView = 'main' | 'settings' | 'myPosts' | 'priceAlerts' | 'savedProducts' | 'myImpact' | 'adminReports' | 'adminDeletedPosts' | 'adminDeletedStores' | 'adminBannedUsers';

export default function ProfilePage() {
  const {
    isLoggedIn,
    openAuthModal,
    logout,
    currentUser,
    openPriceHistory,
    openStoreProfile,
    openPriceAlert,
    openMessages,
    isAdmin,
    darkMode,
    toggleDarkMode,
    deactivateAccount,
    deleteAccount,
  } = useApp();
  const { radiusKm, setRadiusKm } = useLocation();
  const {
    posts,
    comments,
    alerts,
    deletePost,
    deletedPosts,
    restorePost,
    vouchedPosts,
    savedPostIds,
    toggleVouch,
    toggleSavePost,
    openCommentSheet,
    toggleAlertActive,
    deleteAlert,
    userDeletePost,
  } = usePosts();
  const { stores, deletedStores, restoreStore } = useStores();
  const { reports, updateReportStatus } = useReports();
  const { conversations } = useMessages();
  const { bannedUsers, unbanUser } = useBan();

  const [subView, setSubView] = useState<SubView>('main');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Settings local state
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? 'HanapLokal User');
  const [settingsRadius, setSettingsRadius] = useState(String(radiusKm));
  const [notifPriceAlerts, setNotifPriceAlerts] = useState(true);
  const [notifVouches, setNotifVouches] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifTrending, setNotifTrending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUserId = currentUser?.uid ?? 'current_user';

  const initials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'HL';

  const handleSaveSettings = () => {
    const r = parseFloat(settingsRadius);
    if (!isNaN(r)) {
      if (r > 100) {
        alert('Maximum search radius cannot exceed 100 km.');
        return;
      }
      if (r >= 0.5) {
        setRadiusKm(r);
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeactivate = () => {
    // Delete all of the user's own posts
    const myPostsToDelete = posts.filter(p => p.userId === (currentUser?.uid ?? 'current_user'));
    myPostsToDelete.forEach(post => userDeletePost(post));
    // Mark account as deactivated and log out
    deactivateAccount();
    void logout();
  };

  // My posts
  const myPosts = posts.filter(p => p.userId === currentUserId);
  const savedProducts = posts.filter(p => savedPostIds.has(p.id));
  const myTotalVouches = myPosts.reduce((sum, p) => sum + p.vouchCount, 0);
  const myTotalComments = myPosts.reduce((sum, p) => sum + p.commentCount, 0);
  const myStoreIds = new Set(myPosts.map(post => post.storeId).filter(Boolean));
  const myLowestReports = myPosts.filter(post => post.insightType === 'lowest').length;
  const storesAdded = stores.filter(store => store.description.includes('Community-added') && store.id.startsWith('s_')).length;

  const myComments = comments.filter(comment => myPosts.some(post => post.id === comment.postId));
  const openReports = reports.filter(report => report.status === 'open');
  const unreadMessages = conversations.reduce((sum, convo) => sum + convo.unreadCount, 0);
  const helpedUserCount = new Set(
    myComments
      .map(comment => comment.userId)
      .filter(userId => userId !== currentUserId)
  ).size;

  const estimatedSavings = Math.round(
    myPosts.reduce((total, post) => {
      if (post.insightType === 'below') {
        const match = post.marketInsight.match(/₱(\d+(?:\.\d+)?)/);
        const diff = match ? Number(match[1]) : 0;
        return total + diff * Math.max(post.vouchCount, 1);
      }
      if (post.insightType === 'lowest') {
        return total + Math.max(post.price * 0.06 * Math.max(post.vouchCount, 1), post.price * 0.03);
      }
      return total;
    }, 0)
  );

  const postDayKeys = Array.from(
    new Set(
      myPosts.map(post => {
        const d = new Date(post.timestamp);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    )
  ).sort((a, b) => b - a);

  let postingStreak = 0;
  if (postDayKeys.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let cursor = today.getTime();

    for (const day of postDayKeys) {
      if (day === cursor) {
        postingStreak += 1;
        cursor -= 24 * 60 * 60 * 1000;
      } else if (day < cursor) {
        break;
      }
    }
  }

  const impactScore =
    myPosts.length * 10 +
    myTotalVouches * 2 +
    myTotalComments * 3 +
    myLowestReports * 12 +
    myStoreIds.size * 4;

  const impactLevels = [
    { name: 'Neighbor', threshold: 0 },
    { name: 'Contributor', threshold: 80 },
    { name: 'Price Scout', threshold: 180 },
    { name: 'Community Guide', threshold: 320 },
    { name: 'Lokal Champion', threshold: 520 },
  ];

  const currentImpactLevel =
    impactLevels
      .slice()
      .reverse()
      .find(level => impactScore >= level.threshold) ?? impactLevels[0];

  const nextImpactLevel = impactLevels.find(level => level.threshold > impactScore);
  const scoreToNextLevel = nextImpactLevel ? Math.max(nextImpactLevel.threshold - impactScore, 0) : 0;
  const progressWithinLevel = nextImpactLevel
    ? ((impactScore - currentImpactLevel.threshold) /
        Math.max(nextImpactLevel.threshold - currentImpactLevel.threshold, 1)) *
      100
    : 100;

  // Guest view
  if (!isLoggedIn) {
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 pt-20 pb-12 px-6 rounded-b-3xl">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white text-2xl font-black">Join HanapLokal</h2>
            <p className="text-orange-100 mt-2 text-sm">
              Contribute prices, collect vouches, and help your community find the best deals.
            </p>
            <button
              onClick={openAuthModal}
              className="mt-6 px-8 py-3.5 bg-white text-orange-600 font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              Sign Up / Log In
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">Why join?</h3>
            <div className="space-y-3">
              {[
                { icon: Camera, title: 'Share Prices', desc: 'Upload real-time prices from your local market' },
                { icon: CheckCircle, title: 'Get Vouches', desc: 'Receive community vouches for helpful price reports' },
                { icon: Bell, title: 'Get Alerts', desc: 'Know instantly when prices drop near you' },
                { icon: Star, title: 'Help Community', desc: 'Help neighbors find the best deals' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4.5 h-4.5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // My Posts sub-view
  if (subView === 'myPosts') {
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 pt-14 pb-5 px-4 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('main')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-xl font-bold flex-1">My Posts</h2>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-white text-sm font-bold">{myPosts.length}</span>
                <span className="text-orange-100 text-xs ml-1">posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="max-w-lg mx-auto px-4 -mt-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-black text-gray-900">{myPosts.length}</p>
                <p className="text-[10px] text-gray-500 font-medium">Total Posts</p>
              </div>
              <div>
                <p className="text-lg font-black text-orange-500">{myTotalVouches}</p>
                <p className="text-[10px] text-gray-500 font-medium">Total Vouches</p>
              </div>
              <div>
                <p className="text-lg font-black text-blue-500">{myTotalComments}</p>
                <p className="text-[10px] text-gray-500 font-medium">Total Comments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts list */}
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
          {myPosts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">No posts yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start sharing prices from your local market to help the community!
              </p>
              <button
                onClick={() => setSubView('main')}
                className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm active:scale-95 transition-transform"
              >
                Go Back
              </button>
            </div>
          ) : (
            myPosts.map(post => {
              const isExpiring = Date.now() - post.timestamp > 12 * 60 * 60 * 1000;
              const isExpired = Date.now() - post.timestamp > 24 * 60 * 60 * 1000;
              const isVouched = vouchedPosts.has(post.id);
              const emoji = getMediaEmoji(post.mediaUrl || post.category.toLowerCase());

              return (
                <div
                  key={post.id}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-opacity ${
                    isExpired ? 'opacity-50' : ''
                  }`}
                >
                  {/* Post header */}
                  <div className="p-4 pb-0">
                    <div className="flex items-start gap-3">
                      {/* Product emoji/image */}
                      <button
                        onClick={() => openPriceHistory(post.id)}
                        className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-2xl flex-shrink-0 active:scale-95 transition-transform"
                      >
                        {emoji}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => openPriceHistory(post.id)}
                          className="text-left w-full"
                        >
                          <h3 className="font-bold text-gray-900 text-sm truncate">
                            {post.productName}
                          </h3>
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-orange-500 font-black text-lg">
                            ₱{post.price}
                          </span>
                          <span className="text-gray-400 text-xs">/{post.unit}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {post.storeName && post.storeId && (
                            <button
                              onClick={() => openStoreProfile(post.storeId)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              <Store className="w-3 h-3" />
                              <span className="truncate max-w-[140px]">{post.storeName}</span>
                            </button>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{getTimeAgo(post.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col items-end gap-1.5">
                        {isExpiring && !isExpired && (
                          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Expiring
                          </span>
                        )}
                        {isExpired && (
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Expired
                          </span>
                        )}
                        <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {post.location && (
                    <div className="px-4 pt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{post.location}</span>
                      </div>
                    </div>
                  )}

                  {/* Market insight */}
                  {post.marketInsight && (
                    <div className="px-4 pt-2">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          post.insightType === 'below'
                            ? 'bg-emerald-50 text-emerald-600'
                            : post.insightType === 'lowest'
                            ? 'bg-blue-50 text-blue-600'
                            : post.insightType === 'above'
                            ? 'bg-red-50 text-red-500'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {post.marketInsight}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 px-4 py-3 mt-1 border-t border-gray-50">
                    <button
                      onClick={() => toggleVouch(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        isVouched
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{post.vouchCount}</span>
                    </button>

                    <button
                      onClick={() => openCommentSheet(post.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 active:bg-gray-200"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.commentCount}</span>
                    </button>

                    <div className="flex-1" />

                    {/* Delete button */}
                    {confirmDeleteId === post.id ? (
                      <div className="flex items-center gap-2 animate-in slide-in-from-right">
                        <button
                          onClick={() => {
                            deletePost(post.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500 text-white active:scale-95 transition-transform"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 active:scale-95 transition-transform"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(post.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div className="h-4" />
        </div>
      </div>
    );
  }

  // Saved Products sub-view
  if (subView === 'savedProducts') {
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 pt-14 pb-5 px-4 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('main')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-xl font-bold flex-1">Saved Products</h2>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-white text-sm font-bold">{savedProducts.length}</span>
                <span className="text-orange-100 text-xs ml-1">saved</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-3">
          {savedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <Bookmark className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">No saved products yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Tap the bookmark icon on posts to save products you want to monitor.
              </p>
              <button
                onClick={() => setSubView('main')}
                className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm active:scale-95 transition-transform"
              >
                Back to Profile
              </button>
            </div>
          ) : (
            savedProducts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => openPriceHistory(post.id)}
                    className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-xl"
                  >
                    {getMediaEmoji(post.mediaUrl || post.category.toLowerCase())}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => openPriceHistory(post.id)} className="text-left w-full">
                      <p className="font-bold text-gray-900 text-sm truncate">{post.productName}</p>
                    </button>
                    <p className="text-orange-500 font-black text-lg">₱{post.price}<span className="text-xs text-gray-400 font-medium">/{post.unit}</span></p>
                    <div className="flex items-center gap-2 mt-1">
                      {post.storeId ? (
                        <button
                          onClick={() => openStoreProfile(post.storeId)}
                          className="text-xs text-blue-600 truncate"
                        >
                          {post.storeName}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">{post.storeName}</span>
                      )}
                      <span className="text-xs text-gray-400">• {getTimeAgo(post.timestamp)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSavePost(post.id)}
                    className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"
                    aria-label="Remove from saved products"
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Price Alerts sub-view
  if (subView === 'priceAlerts') {
    const sortedAlerts = [...alerts].sort((a, b) => Number(b.active) - Number(a.active));
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 pt-14 pb-5 px-4 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('main')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-xl font-bold flex-1">Price Alerts</h2>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Manage Your Price Alerts</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Create alerts and get notified when prices drop near you.
                </p>
              </div>
            </div>

            <button
              onClick={openPriceAlert}
              className="mt-4 w-full py-3.5 bg-orange-500 text-white font-semibold rounded-2xl active:scale-[0.98] transition-transform"
            >
              Create New Alert
            </button>
          </div>

          {sortedAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900">No saved alerts yet</h4>
              <p className="text-sm text-gray-500 mt-1">
                Tap "Create New Alert" to start tracking prices.
              </p>
            </div>
          ) : (
            sortedAlerts.map(alert => {
              const matchingPosts = posts
                .filter(post =>
                  post.productName.toLowerCase() === alert.productName.toLowerCase() &&
                  post.price <= alert.targetPrice
                )
                .slice(0, 3);

              return (
                <div key={alert.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">{alert.active ? 'Active Alert' : 'Paused Alert'}</p>
                      <h4 className="font-bold text-gray-900 mt-0.5">{alert.productName}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Notify below <span className="font-bold text-orange-600">₱{alert.targetPrice}</span> within {alert.radius}km
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAlertActive(alert.id)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg ${
                          alert.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {alert.active ? 'Active' : 'Paused'}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Matches</p>
                    {matchingPosts.length === 0 ? (
                      <p className="text-sm text-gray-500">No matching posts yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {matchingPosts.map(post => (
                          <button
                            key={post.id}
                            onClick={() => openPriceHistory(post.id)}
                            className="w-full text-left flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                          >
                            <span className="text-sm text-gray-700">{post.storeName}</span>
                            <span className="text-sm font-bold text-orange-600">₱{post.price}/{post.unit}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (subView === 'myImpact') {
    const achievements = [
      {
        label: 'First Report',
        description: 'Submit your first post',
        unlocked: myPosts.length >= 1,
      },
      {
        label: 'Market Regular',
        description: 'Post at least 5 reports',
        unlocked: myPosts.length >= 5,
      },
      {
        label: 'Trusted Spotter',
        description: 'Receive 25 total vouches',
        unlocked: myTotalVouches >= 25,
      },
      {
        label: 'Deal Hunter',
        description: 'Report 3 lowest-price posts',
        unlocked: myLowestReports >= 3,
      },
      {
        label: 'Neighborhood Streak',
        description: 'Post 3 days in a row',
        unlocked: postingStreak >= 3,
      },
      {
        label: 'Local Champion',
        description: 'Reach 500 impact score',
        unlocked: impactScore >= 500,
      },
    ];

    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 pt-14 pb-5 px-4 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('main')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-xl font-bold flex-1">My Impact</h2>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-white text-sm font-bold">{impactScore}</span>
                <span className="text-orange-100 text-xs ml-1">score</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">{currentImpactLevel.name}</h3>
            </div>
            <p className="text-sm text-gray-500">
              {nextImpactLevel
                ? `${scoreToNextLevel} pts to reach ${nextImpactLevel.name}`
                : 'You reached the highest contribution level.'}
            </p>
            <div className="mt-3 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                style={{ width: `${Math.max(0, Math.min(progressWithinLevel, 100))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Posts Submitted</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{myPosts.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Stores Added</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{storesAdded}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Vouches Received</p>
              <p className="text-2xl font-black text-orange-500 mt-1">{myTotalVouches}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Comments Received</p>
              <p className="text-2xl font-black text-blue-500 mt-1">{myTotalComments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Lowest Nearby Reports</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">{myLowestReports}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Posting Streak</p>
              <p className="text-2xl font-black text-amber-500 mt-1">{postingStreak}d</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Community Outcomes</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">You helped {helpedUserCount} neighbors compare prices</p>
                  <p className="text-xs text-gray-500">Based on comments from people on your reports</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Estimated savings unlocked: ₱{estimatedSavings.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Calculated from below-average and lowest nearby reports</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Achievements</h3>
            </div>
            <div className="space-y-2">
              {achievements.map(item => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    item.unlocked
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.unlocked ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {item.unlocked ? <CheckCircle className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'adminReports') {
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 pt-14 pb-5 px-4 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('main')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-xl font-bold flex-1">Admin Reports</h2>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-white text-sm font-bold">{openReports.length}</span>
                <span className="text-orange-100 text-xs ml-1">open</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-3">
          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <ShieldCheck className="w-7 h-7 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900">No reports yet</h4>
              <p className="text-sm text-gray-500 mt-1">User reports will show here for moderation.</p>
            </div>
          ) : (
            reports.map(report => {
              const statusClasses = {
                open: 'bg-amber-50 text-amber-600',
                resolved: 'bg-emerald-50 text-emerald-600',
                rejected: 'bg-gray-100 text-gray-600',
              };

              return (
                <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      {report.entityType === 'store' ? (
                        <Store className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Package className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900 truncate">{report.entityLabel}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusClasses[report.status]}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Reason: {report.reason}</p>
                      {report.details && (
                        <p className="text-xs text-gray-400 mt-1">"{report.details}"</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        By {report.reporterName} • {getTimeAgo(report.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {report.entityType === 'post' ? (
                      <button
                        onClick={() => openPriceHistory(report.entityId)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700"
                      >
                        Open Post
                      </button>
                    ) : (
                      <button
                        onClick={() => openStoreProfile(report.entityId)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700"
                      >
                        Open Store
                      </button>
                    )}
                    <button
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, 'rejected')}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gray-200 text-gray-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (subView === 'adminDeletedPosts') {
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-red-500 to-red-600 pt-14 pb-5 px-4 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('adminReports')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-xl font-bold flex-1">Deleted Posts</h2>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-white text-sm font-bold">{deletedPosts.length}</span>
                <span className="text-red-100 text-xs ml-1">deleted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-3">
          {deletedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Trash2 className="w-7 h-7 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900">No deleted posts</h4>
              <p className="text-sm text-gray-500 mt-1">Posts removed by admins will appear here.</p>
            </div>
          ) : (
            deletedPosts.map(post => {
              const emoji = getMediaEmoji(post.mediaUrl || post.category.toLowerCase());
              return (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-xl flex-shrink-0">
                        {emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{post.productName}</p>
                        <p className="text-orange-500 font-black text-base">₱{post.price}<span className="text-xs text-gray-400 font-medium">/{post.unit}</span></p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 truncate">{post.storeName}</span>
                          <span className="text-[10px] text-gray-400">• by {post.userName}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>Posted {getTimeAgo(post.timestamp)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">
                        Deleted
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => restorePost(post)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore Post
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <div className="h-4" />
        </div>
      </div>
    );
  }

  if (subView === 'adminBannedUsers') {
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-red-500 to-red-600 pt-14 pb-5 px-4 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('main')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-xl font-bold flex-1">Banned Users</h2>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-white text-sm font-bold">{bannedUsers.length}</span>
                <span className="text-red-100 text-xs ml-1">banned</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-3">
          {bannedUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="text-5xl mb-3">🛡️</div>
              <h3 className="font-bold text-gray-900 mb-1">No banned users</h3>
              <p className="text-sm text-gray-500">Banned users will appear here.</p>
            </div>
          ) : (
            bannedUsers.map(user => (
              <div key={user.userId} className="bg-white rounded-2xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-300 to-red-500 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                    {user.userAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{user.userName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Banned {getTimeAgo(user.bannedAt)} · by {user.bannedBy}
                    </p>
                  </div>
                  <button
                    onClick={() => unbanUser(user.userId)}
                    className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold active:scale-95 transition-transform flex-shrink-0"
                  >
                    Unban
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (subView === 'adminDeletedStores') {
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-red-500 to-red-600 pt-14 pb-5 px-4 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('adminReports')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-xl font-bold flex-1">Deleted Stores</h2>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-white text-sm font-bold">{deletedStores.length}</span>
                <span className="text-red-100 text-xs ml-1">deleted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-3">
          {deletedStores.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Trash2 className="w-7 h-7 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900">No deleted stores</h4>
              <p className="text-sm text-gray-500 mt-1">Stores removed by admins will appear here.</p>
            </div>
          ) : (
            deletedStores.map(store => {
              return (
                <div key={store.id} className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-xl flex-shrink-0">
                        {getStoreEmoji(store.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{store.name}</p>
                        <p className="text-sm text-gray-500">{store.address}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {store.type}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">
                        Deleted
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => restoreStore(store)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore Store
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <div className="h-4" />
        </div>
      </div>
    );
  }


  // Settings sub-view
  if (subView === 'settings') {
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 pt-14 pb-5 px-4 rounded-b-3xl">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('main')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white text-xl font-bold flex-1">Settings</h2>
              <button
                onClick={() => setSubView('main')}
                className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
          {/* Profile Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Profile</h3>
            </div>

            <div className="space-y-4">
              {/* Avatar preview */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-lg font-bold border-2 border-orange-200">
                  {displayName
                    .split(' ')
                    .map(p => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Display Name</p>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                    placeholder="Your display name"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500">
                  {currentUser?.email ?? 'Not set'}
                </div>
              </div>
            </div>
          </div>

          {/* Location & Radius */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Location & Radius</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Default Search Radius (km)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={settingsRadius}
                    onChange={e => setSettingsRadius(e.target.value)}
                    min="0.5"
                    max="100"
                    step="0.5"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                  />
                  <span className="text-sm text-gray-400 font-medium">km</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Posts and stores outside this radius won't appear in your feed</p>
              </div>

              {/* Quick radius buttons */}
              <div className="flex gap-2">
                {[1, 5, 10, 25].map(r => (
                  <button
                    key={r}
                    onClick={() => setSettingsRadius(String(r))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                      settingsRadius === String(r)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Notifications</h3>
            </div>

            <div className="space-y-1">
              {[
                {
                  label: 'Price Alerts',
                  desc: 'When a product drops below your target price',
                  value: notifPriceAlerts,
                  setter: setNotifPriceAlerts,
                },
                {
                  label: 'Vouches',
                  desc: 'When someone vouches for your post',
                  value: notifVouches,
                  setter: setNotifVouches,
                },
                {
                  label: 'Comments',
                  desc: 'When someone comments on your post',
                  value: notifComments,
                  setter: setNotifComments,
                },
                {
                  label: 'Trending Products',
                  desc: 'Price spikes and trending items near you',
                  value: notifTrending,
                  setter: setNotifTrending,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex-1 mr-3">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => item.setter(!item.value)}
                    className={`w-12 h-7 rounded-full relative transition-colors ${
                      item.value ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform ${
                        item.value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Appearance</h3>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex-1 mr-3">
                <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                <p className="text-[11px] text-gray-400">Use a darker theme across the app</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`w-12 h-7 rounded-full relative transition-colors ${
                  darkMode ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">About</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-medium text-gray-900">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Build</span>
                <span className="text-sm font-medium text-gray-900">2024.01</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              {[
                { icon: Globe, label: 'Terms of Service' },
                { icon: ShieldCheck, label: 'Privacy Policy' },
              ].map((item, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <item.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveSettings}
            className={`w-full flex items-center justify-center gap-2 py-3.5 font-semibold rounded-2xl active:scale-[0.98] transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-orange-500 text-white'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Settings Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              void logout();
              setSubView('main');
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 font-semibold rounded-2xl active:scale-[0.98] transition-transform"
          >
            <LogOut className="w-4.5 h-4.5" />
            Log Out
          </button>

          {/* Danger Zone: Deactivate or Delete Account */}
          <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold text-red-600 mb-1 uppercase tracking-wide">Danger Zone</p>
            
            {showDeleteConfirm ? (
              <div className="mt-4 border-t border-red-200 pt-3">
                <p className="text-sm text-red-700 font-semibold mb-2">Permanently delete your account?</p>
                <p className="text-xs text-red-500 mb-3">This action cannot be undone. All your data will be permanently removed. Type <span className="font-bold text-red-700">delete my account</span> to confirm.</p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type 'delete my account'"
                  className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm text-red-900 placeholder-red-300 mb-3 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (deleteConfirmText.toLowerCase() === 'delete my account') {
                        setIsDeleting(true);
                        try {
                          await deleteAccount();
                        } catch (e) {
                          // Error handled in context
                        } finally {
                          setIsDeleting(false);
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }
                      }
                    }}
                    disabled={deleteConfirmText.toLowerCase() !== 'delete my account' || isDeleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-red-200 text-red-700 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : confirmDeactivate ? (
              <div className="mt-4 border-t border-red-200 pt-3">
                <p className="text-sm text-red-700 font-semibold mb-1">Deactivate your account?</p>
                <p className="text-xs text-red-500 mb-3">All your posts will be removed. You can reactivate by logging back in.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeactivate}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold active:scale-95 transition-transform"
                  >
                    Yes, Deactivate
                  </button>
                  <button
                    onClick={() => setConfirmDeactivate(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold active:scale-95 transition-transform hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-3">
                <button
                  onClick={() => setConfirmDeactivate(true)}
                  className="w-full py-2.5 rounded-xl bg-white border border-red-200 text-red-600 text-sm font-bold active:scale-95 transition-transform hover:bg-red-50"
                >
                  Deactivate Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 rounded-xl bg-red-100 border border-red-200 text-red-700 text-sm font-bold active:scale-95 transition-transform hover:bg-red-200"
                >
                  Delete Account
                </button>
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      </div>
    );
  }

  // Main profile view (logged in)
  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 pt-14 pb-8 px-6 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold border-2 border-white/40">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-white text-xl font-bold">{currentUser?.displayName ?? displayName}</h2>
                <CheckCircle className="w-5 h-5 text-emerald-300" />
              </div>
              <p className="text-orange-100 text-sm">{currentUser?.email ?? 'Verified Contributor'}</p>
            </div>
            <button
              onClick={() => setSubView('settings')}
              className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
              <p className="text-white text-xl font-black">{myPosts.length}</p>
              <p className="text-orange-100 text-[10px] font-medium">Posts</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
              <p className="text-white text-xl font-black">{myTotalVouches}</p>
              <p className="text-orange-100 text-[10px] font-medium">Vouches</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
              <p className="text-white text-xl font-black">{myTotalComments}</p>
              <p className="text-orange-100 text-[10px] font-medium">Comments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        {/* Menu items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {[
            { icon: Camera, label: 'My Posts', value: `${myPosts.length}`, action: () => setSubView('myPosts') },
            { icon: MessageCircle, label: 'Messages', value: unreadMessages > 0 ? `${unreadMessages} new` : 'Inbox', action: () => openMessages() },
            { icon: Bell, label: 'Price Alerts', value: 'Manage', action: () => setSubView('priceAlerts') },
            { icon: TrendingUp, label: 'My Impact', value: `₱${estimatedSavings.toLocaleString()} saved`, action: () => setSubView('myImpact') },
            { icon: Star, label: 'Saved Products', value: `${savedProducts.length}`, action: () => setSubView('savedProducts') },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4.5 h-4.5 text-orange-500" />
              </div>
              <span className="flex-1 font-medium text-gray-900 text-sm">{item.label}</span>
              <span className="text-xs text-gray-400 font-medium">{item.value}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="space-y-2">
            <button
              onClick={() => setSubView('adminReports')}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4.5 h-4.5 text-red-500" />
              </div>
              <span className="flex-1 font-medium text-gray-900 text-sm">Admin Reports</span>
              <span className="text-xs text-red-500 font-bold">{openReports.length} open</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <button
              onClick={() => setSubView('adminDeletedPosts')}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4.5 h-4.5 text-red-500" />
              </div>
              <span className="flex-1 font-medium text-gray-900 text-sm">Deleted Posts</span>
              <span className="text-xs text-red-500 font-bold">{deletedPosts.length}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <button
              onClick={() => setSubView('adminDeletedStores')}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Store className="w-4.5 h-4.5 text-red-500" />
              </div>
              <span className="flex-1 font-medium text-gray-900 text-sm">Deleted Stores</span>
              <span className="text-xs text-red-500 font-bold">{deletedStores.length}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <button
              onClick={() => setSubView('adminBannedUsers')}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4.5 h-4.5 text-red-500" />
              </div>
              <span className="flex-1 font-medium text-gray-900 text-sm">Banned Users</span>
              <span className="text-xs text-red-500 font-bold">{bannedUsers.length}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={() => setSubView('settings')}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Settings className="w-4.5 h-4.5 text-orange-500" />
          </div>
          <span className="flex-1 font-medium text-gray-900 text-sm">Settings</span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {/* Logout */}
        <button
          onClick={() => {
            void logout();
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 font-semibold rounded-2xl active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-4.5 h-4.5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
