import { AppProvider, useApp } from './context/AppContext';
import { LocationProvider } from './context/LocationContext';
import { PostsProvider } from './context/PostsContext';
import { StoresProvider } from './context/StoresContext';
import { ReportsProvider } from './context/ReportsContext';
import { MessagesProvider } from './context/MessagesContext';
import { BanProvider } from './context/BanContext';
import BottomNav from './components/BottomNav';
import Feed from './components/Feed';
import MapView from './components/MapView';
import SearchPage from './components/SearchPage';
import ProfilePage from './components/ProfilePage';
import AuthModal from './components/AuthModal';
import PriceHistorySheet from './components/PriceHistorySheet';
import UploadModal from './components/UploadModal';
import EditPostModal from './components/EditPostModal';
import PriceAlertModal from './components/PriceAlertModal';
import CommentSheet from './components/CommentSheet';
import StoreProfile from './components/StoreProfile';
import CreateStoreModal from './components/CreateStoreModal';
import UserProfile from './components/UserProfile';
import ReportModal from './components/ReportModal';
import MessagingSheet from './components/MessagingSheet';
import NotificationEngine from './components/NotificationEngine';
import { ShieldOff } from 'lucide-react';

function AppContent() {
  const { activeTab, isLoggedIn, isAdmin, currentUser, openAuthModal, isDeactivated, reactivateAccount, logout } = useApp();

  // Deactivated account gate
  if (isLoggedIn && isDeactivated) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-lg mx-auto flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mb-6">
          <ShieldOff className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2 text-center">Account Deactivated</h1>
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
          Your account has been deactivated. Reactivate to continue posting prices and helping your community.
        </p>
        <button
          onClick={reactivateAccount}
          className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold text-base mb-3 active:scale-[0.98] transition-transform"
        >
          Reactivate Account
        </button>
        <button
          onClick={() => void logout()}
          className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <StoresProvider isLoggedIn={isLoggedIn} isAdmin={isAdmin} currentUser={currentUser} onAuthRequired={openAuthModal}>
      <PostsProvider isLoggedIn={isLoggedIn} isAdmin={isAdmin} currentUser={currentUser} onAuthRequired={openAuthModal}>
        <ReportsProvider isLoggedIn={isLoggedIn} isAdmin={isAdmin} currentUser={currentUser} onAuthRequired={openAuthModal}>
          <MessagesProvider isLoggedIn={isLoggedIn} currentUser={currentUser} onAuthRequired={openAuthModal}>
            <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
              <NotificationEngine />
              {/* Page content */}
              <main>
                {activeTab === 'feed' && <Feed />}
                {activeTab === 'map' && <MapView />}
                {activeTab === 'search' && <SearchPage />}
                {activeTab === 'profile' && <ProfilePage />}
              </main>

              {/* Bottom navigation */}
              <BottomNav />

              {/* Modals & Sheets */}
              <AuthModal />
              <PriceHistorySheet />
              <UploadModal />
              <EditPostModal />
              <PriceAlertModal />
              <CommentSheet />
              <StoreProfile />
              <UserProfile />
              <CreateStoreModal />
              <ReportModal />
              <MessagingSheet />
            </div>
          </MessagesProvider>
        </ReportsProvider>
      </PostsProvider>
    </StoresProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <LocationProvider>
        <BanProvider>
          <AppContent />
        </BanProvider>
      </LocationProvider>
    </AppProvider>
  );
}
