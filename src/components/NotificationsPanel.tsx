import { X, Check, Bell, MessageSquare, ThumbsUp, MapPin, Store, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationsContext';
import { getTimeAgo } from '../data/mockData';

export default function NotificationsPanel() {
  const {
    openPriceHistory,
    openStoreProfile,
    openMessages,
    setActiveTab,
  } = useApp();

  const {
    notifications,
    isPanelOpen,
    setIsPanelOpen,
    markRead,
    markAllRead,
  } = useNotifications();

  if (!isPanelOpen) return null;

  const handleNotificationClick = async (notif: any) => {
    await markRead(notif.id);
    setIsPanelOpen(false);

    if (notif.linkEntityType === 'message' && notif.linkEntityId) {
      setTimeout(() => openMessages(notif.linkEntityId), 100);
    } else if (notif.linkEntityType === 'post' && notif.linkEntityId) {
      setTimeout(() => openPriceHistory(notif.linkEntityId), 100);
    } else if (notif.linkEntityType === 'store' && notif.linkEntityId) {
      setTimeout(() => openStoreProfile(notif.linkEntityId), 100);
    } else if (notif.type === 'admin_pending_post' || notif.type === 'admin_pending_store') {
      setActiveTab('profile');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'post_approved':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5" />
          </div>
        );
      case 'post_rejected':
        return (
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
            <X className="w-5 h-5" />
          </div>
        );
      case 'post_vouched':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
            <ThumbsUp className="w-5 h-5" />
          </div>
        );
      case 'new_comment':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        );
      case 'new_message':
        return (
          <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        );
      case 'price_alert':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
      case 'new_post_nearby':
        return (
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
        );
      case 'admin_pending_post':
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        );
      case 'admin_pending_store':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  const isToday = (timestamp: number) => {
    const today = new Date();
    const date = new Date(timestamp);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const todayNotifs = notifications.filter(n => isToday(n.createdAt));
  const earlierNotifs = notifications.filter(n => !isToday(n.createdAt));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-[96] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPanelOpen(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden flex flex-col" style={{ height: '85vh', maxHeight: '85vh' }}>
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsPanelOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-4 animate-pulse">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">You're all caught up!</h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                When you get notifications about updates, comments, and price approvals, they'll show up here.
              </p>
            </div>
          ) : (
            <>
              {todayNotifs.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Today</h3>
                  <div className="space-y-2.5">
                    {todayNotifs.map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => void handleNotificationClick(notif)}
                        className={`w-full text-left p-3.5 rounded-2xl flex gap-3 transition-all hover:bg-gray-50 border border-transparent active:scale-[0.99] relative ${
                          !notif.read ? 'bg-orange-50/40 border-orange-100/30' : 'bg-white'
                        }`}
                      >
                        {getNotifIcon(notif.type)}
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.body}</p>
                          <span className="text-[10px] text-gray-400 mt-1.5 block">
                            {getTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        {!notif.read && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {earlierNotifs.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Earlier</h3>
                  <div className="space-y-2.5">
                    {earlierNotifs.map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => void handleNotificationClick(notif)}
                        className={`w-full text-left p-3.5 rounded-2xl flex gap-3 transition-all hover:bg-gray-50 border border-transparent active:scale-[0.99] relative ${
                          !notif.read ? 'bg-orange-50/40 border-orange-100/30' : 'bg-white'
                        }`}
                      >
                        {getNotifIcon(notif.type)}
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.body}</p>
                          <span className="text-[10px] text-gray-400 mt-1.5 block">
                            {getTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        {!notif.read && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
