import { Home, Map, Search, User, Plus, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationsContext';

export default function BottomNav() {
  const { activeTab, setActiveTab, requireAuth, openUploadModal } = useApp();
  const { unreadCount, setIsPanelOpen } = useNotifications();

  const handleUpload = () => {
    if (requireAuth()) {
      openUploadModal();
    }
  };

  const handleNotifications = () => {
    if (requireAuth()) {
      setIsPanelOpen(true);
    }
  };

  const tabs = [
    { id: 'feed' as const, icon: Home, label: 'Feed' },
    { id: 'map' as const, icon: Map, label: 'Map' },
    { id: 'upload' as const, icon: Plus, label: 'Post' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'notifications' as const, icon: Bell, label: 'Alerts' },
    { id: 'profile' as const, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isUpload = tab.id === 'upload';
          const isNotifications = tab.id === 'notifications';
          const isActive = !isUpload && !isNotifications && activeTab === tab.id;

          if (isUpload) {
            return (
              <button
                key={tab.id}
                onClick={handleUpload}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center active:scale-95 transition-transform">
                  <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          if (isNotifications) {
            return (
              <button
                key={tab.id}
                onClick={handleNotifications}
                className="flex flex-col items-center justify-center py-2 px-1 min-w-[50px] transition-colors text-gray-400 relative active:scale-95"
              >
                <Bell className="w-6 h-6" />
                <span className="text-[10px] mt-0.5 font-medium">
                  Alerts
                </span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-2 bg-orange-500 text-white text-[9px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center border border-white px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-2 px-1 min-w-[50px] transition-colors ${
                isActive ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <tab.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-orange-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
