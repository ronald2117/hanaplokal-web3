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
import PriceAlertModal from './components/PriceAlertModal';
import CommentSheet from './components/CommentSheet';
import StoreProfile from './components/StoreProfile';
import CreateStoreModal from './components/CreateStoreModal';
import UserProfile from './components/UserProfile';
import ReportModal from './components/ReportModal';
import MessagingSheet from './components/MessagingSheet';
import NotificationEngine from './components/NotificationEngine';

function AppContent() {
  const { activeTab, isLoggedIn, isAdmin, currentUser, openAuthModal } = useApp();

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
