import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, facebookProvider, googleProvider, isFirebaseConfigured } from '../lib/firebase';

interface AppState {
  isLoggedIn: boolean;
  authLoading: boolean;
  currentUser: User | null;
  showAuthModal: boolean;
  authError: string | null;
  authBusy: boolean;
  showUploadModal: boolean;
  showPriceHistory: string | null; // post id
  showPriceAlert: boolean;
  showStoreProfile: string | null; // store id
  showUserProfile: string | null; // user id
  showCreateStore: boolean;
  showMessages: string | null; // 'inbox' or user id
  showReportModal: { type: 'post' | 'store'; id: string; label: string } | null;
  darkMode: boolean;
  isAdmin: boolean;
  activeTab: 'feed' | 'map' | 'search' | 'profile';
  mapFocusId: string | null;
  mapFocusMode: 'prices' | 'stores';
}

interface AppContextType extends AppState {
  login: (provider?: 'google' | 'facebook') => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requireAuth: () => boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearAuthError: () => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openPriceHistory: (postId: string) => void;
  closePriceHistory: () => void;
  openPriceAlert: () => void;
  closePriceAlert: () => void;
  openStoreProfile: (storeId: string) => void;
  closeStoreProfile: () => void;
  openUserProfile: (userId: string) => void;
  closeUserProfile: () => void;
  openCreateStore: () => void;
  closeCreateStore: () => void;
  openMessages: (userId?: string) => void;
  closeMessages: () => void;
  toggleDarkMode: () => void;
  openReportModal: (payload: { type: 'post' | 'store'; id: string; label: string }) => void;
  closeReportModal: () => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  focusOnMap: (id: string, mode?: 'prices' | 'stores') => void;
  clearMapFocus: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const adminEmails = String(import.meta.env.VITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  const getInitialDarkMode = () => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('hanaplokal_dark_mode');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [state, setState] = useState<AppState>({
    isLoggedIn: false,
    authLoading: isFirebaseConfigured,
    currentUser: null,
    showAuthModal: false,
    authError: null,
    authBusy: false,
    showUploadModal: false,
    showPriceHistory: null,
    showPriceAlert: false,
    showStoreProfile: null,
    showUserProfile: null,
    showCreateStore: false,
    showMessages: null,
    showReportModal: null,
    darkMode: getInitialDarkMode(),
    isAdmin: false,
    activeTab: 'feed',
    mapFocusId: null,
    mapFocusMode: 'prices',
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', state.darkMode);
    root.style.colorScheme = state.darkMode ? 'dark' : 'light';
    window.localStorage.setItem('hanaplokal_dark_mode', String(state.darkMode));
  }, [state.darkMode]);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setState(s => ({ ...s, authLoading: false }));
      return;
    }

    void getRedirectResult(auth).catch(() => {
      setState(s => ({ ...s, authError: 'Login failed. Please try again.' }));
    });

    const unsub = onAuthStateChanged(auth, user => {
      const email = user?.email?.toLowerCase() ?? '';
      setState(s => ({
        ...s,
        authLoading: false,
        authBusy: false,
        currentUser: user,
        isLoggedIn: Boolean(user),
        isAdmin: Boolean(email && adminEmails.includes(email)),
        authError: user ? null : s.authError,
        showAuthModal: user ? false : s.showAuthModal,
      }));
    });

    return () => unsub();
  }, []);

  const login = useCallback(async (provider: 'google' | 'facebook' = 'google') => {
    if (!auth || !isFirebaseConfigured) {
      setState(s => ({
        ...s,
        isLoggedIn: true,
        isAdmin: false,
        authError: null,
        showAuthModal: false,
      }));
      return;
    }

    const selectedProvider = provider === 'facebook' ? facebookProvider : googleProvider;
    setState(s => ({ ...s, authBusy: true, authError: null }));

    try {
      await signInWithPopup(auth, selectedProvider);
      setState(s => ({ ...s, authBusy: false, authError: null, showAuthModal: false }));
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code)
        : '';

      if (code.includes('popup-blocked') || code.includes('popup-closed-by-user')) {
        await signInWithRedirect(auth, selectedProvider);
        return;
      }

      setState(s => ({
        ...s,
        authBusy: false,
        authError: 'Could not complete sign in. Check provider setup in Firebase console.',
        showAuthModal: true,
      }));
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      setState(s => ({ ...s, authError: 'Email and password are required.', showAuthModal: true }));
      return;
    }

    if (!auth || !isFirebaseConfigured) {
      setState(s => ({
        ...s,
        isLoggedIn: true,
        isAdmin: false,
        authBusy: false,
        authError: null,
        showAuthModal: false,
      }));
      return;
    }

    setState(s => ({ ...s, authBusy: true, authError: null }));
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setState(s => ({ ...s, authBusy: false, authError: null, showAuthModal: false }));
    } catch {
      setState(s => ({
        ...s,
        authBusy: false,
        authError: 'Could not log in with email/password. Please check your credentials.',
        showAuthModal: true,
      }));
    }
  }, []);

  const signupWithEmail = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      setState(s => ({ ...s, authError: 'Email and password are required.', showAuthModal: true }));
      return;
    }

    if (password.length < 6) {
      setState(s => ({ ...s, authError: 'Password must be at least 6 characters.', showAuthModal: true }));
      return;
    }

    if (!auth || !isFirebaseConfigured) {
      setState(s => ({
        ...s,
        isLoggedIn: true,
        isAdmin: false,
        authBusy: false,
        authError: null,
        showAuthModal: false,
      }));
      return;
    }

    setState(s => ({ ...s, authBusy: true, authError: null }));
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      setState(s => ({ ...s, authBusy: false, authError: null, showAuthModal: false }));
    } catch {
      setState(s => ({
        ...s,
        authBusy: false,
        authError: 'Could not create account. Email may already be in use.',
        showAuthModal: true,
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      setState(s => ({ ...s, isLoggedIn: false, isAdmin: false, activeTab: 'feed', currentUser: null }));
      return;
    }
    await signOut(auth);
    setState(s => ({ ...s, activeTab: 'feed' }));
  }, []);

  const requireAuth = useCallback((): boolean => {
    if (!state.isLoggedIn) {
      setState(s => ({ ...s, showAuthModal: true }));
      return false;
    }
    return true;
  }, [state.isLoggedIn]);

  const openAuthModal = useCallback(() => setState(s => ({ ...s, authError: null, showAuthModal: true })), []);
  const closeAuthModal = useCallback(() => setState(s => ({ ...s, authError: null, showAuthModal: false })), []);
  const clearAuthError = useCallback(() => setState(s => ({ ...s, authError: null })), []);
  const openUploadModal = useCallback(() => setState(s => ({ ...s, showUploadModal: true })), []);
  const closeUploadModal = useCallback(() => setState(s => ({ ...s, showUploadModal: false })), []);
  const openPriceHistory = useCallback((postId: string) => setState(s => ({ ...s, showPriceHistory: postId })), []);
  const closePriceHistory = useCallback(() => setState(s => ({ ...s, showPriceHistory: null })), []);
  const openPriceAlert = useCallback(() => setState(s => ({ ...s, showPriceAlert: true })), []);
  const closePriceAlert = useCallback(() => setState(s => ({ ...s, showPriceAlert: false })), []);
  const openStoreProfile = useCallback((storeId: string) => setState(s => ({ ...s, showStoreProfile: storeId })), []);
  const closeStoreProfile = useCallback(() => setState(s => ({ ...s, showStoreProfile: null })), []);
  const openUserProfile = useCallback((userId: string) => setState(s => ({ ...s, showUserProfile: userId })), []);
  const closeUserProfile = useCallback(() => setState(s => ({ ...s, showUserProfile: null })), []);
  const openCreateStore = useCallback(() => setState(s => ({ ...s, showCreateStore: true })), []);
  const closeCreateStore = useCallback(() => setState(s => ({ ...s, showCreateStore: false })), []);
  const openMessages = useCallback((userId?: string) => {
    setState(s => ({ ...s, showMessages: userId ?? 'inbox' }));
  }, []);
  const closeMessages = useCallback(() => setState(s => ({ ...s, showMessages: null })), []);
  const toggleDarkMode = useCallback(() => {
    setState(s => ({ ...s, darkMode: !s.darkMode }));
  }, []);
  const openReportModal = useCallback((payload: { type: 'post' | 'store'; id: string; label: string }) => {
    setState(s => ({ ...s, showReportModal: payload }));
  }, []);
  const closeReportModal = useCallback(() => setState(s => ({ ...s, showReportModal: null })), []);
  const setActiveTab = useCallback((tab: AppState['activeTab']) => setState(s => ({ ...s, activeTab: tab })), []);
  const focusOnMap = useCallback((id: string, mode: 'prices' | 'stores' = 'prices') => {
    setState(s => ({ ...s, activeTab: 'map', mapFocusId: id, mapFocusMode: mode }));
  }, []);
  const clearMapFocus = useCallback(() => {
    setState(s => ({ ...s, mapFocusId: null }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        loginWithEmail,
        signupWithEmail,
        logout,
        requireAuth,
        openAuthModal,
        closeAuthModal,
        clearAuthError,
        openUploadModal,
        closeUploadModal,
        openPriceHistory,
        closePriceHistory,
        openPriceAlert,
        closePriceAlert,
        openStoreProfile,
        closeStoreProfile,
        openUserProfile,
        closeUserProfile,
        openCreateStore,
        closeCreateStore,
        openMessages,
        closeMessages,
        toggleDarkMode,
        openReportModal,
        closeReportModal,
        setActiveTab,
        focusOnMap,
        clearMapFocus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
