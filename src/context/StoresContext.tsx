import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { type Store, mockStores } from '../data/mockData';
import {
  createStore,
  loadUserStoreVouches,
  subscribeToStores,
  subscribeToDeletedStores,
  subscribeToPendingStores,
  softDeleteStore,
  restoreStore as restoreStoreRemote,
  toggleStoreVouch as toggleStoreVouchRemote,
  approveStore as approveStoreRemote,
  rejectStore as rejectStoreRemote,
} from '../services/firestore';
import { isFirebaseConfigured } from '../lib/firebase';
import { useNotifications } from './NotificationsContext';

interface StoresContextType {
  stores: Store[];
  addStore: (store: Omit<Store, 'id' | 'totalPosts' | 'verified' | 'rating' | 'vouchCount' | 'trustRating'>) => Store;
  getStore: (id: string) => Store | undefined;
  vouchedStores: Set<string>;
  toggleStoreVouch: (storeId: string) => boolean;
  adminDeleteStore: (store: Store) => void;
  restoreStore: (store: Store) => void;
  deletedStores: Store[];
  // Pending review
  pendingStores: Store[];
  approveStore: (store: Store) => void;
  rejectStore: (storeId: string) => void;
}

const StoresContext = createContext<StoresContextType | null>(null);

interface StoresProviderProps {
  children: ReactNode;
  isLoggedIn: boolean;
  isAdmin: boolean;
  currentUser: User | null;
  onAuthRequired: () => void;
}

function calculateTrustRating(store: Pick<Store, 'verified' | 'vouchCount'>): number {
  const verifiedBoost = store.verified ? 10 : 0;
  return Math.min(100, Math.max(45, Math.round(50 + store.vouchCount * 1.1 + verifiedBoost)));
}

export function StoresProvider({ children, isLoggedIn, isAdmin, currentUser, onAuthRequired }: StoresProviderProps) {
  const [stores, setStores] = useState<Store[]>(isFirebaseConfigured ? [] : mockStores);
  const [deletedStores, setDeletedStores] = useState<Store[]>([]);
  const [pendingStores, setPendingStores] = useState<Store[]>([]);
  const [vouchedStores, setVouchedStores] = useState<Set<string>>(new Set());
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = subscribeToStores(setStores);
    const unsubDeleted = isAdmin ? subscribeToDeletedStores(setDeletedStores) : null;
    // Subscribe to pending stores (admins see all; regular users see none from Firestore)
    const unsubPending = isAdmin ? subscribeToPendingStores(setPendingStores) : null;
    return () => {
      if (unsub) unsub();
      if (unsubDeleted) unsubDeleted();
      if (unsubPending) unsubPending();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) {
      setVouchedStores(new Set());
      return;
    }

    void loadUserStoreVouches(currentUser.uid).then(setVouchedStores);
  }, [currentUser]);

  const addStore = useCallback((storeData: Omit<Store, 'id' | 'totalPosts' | 'verified' | 'rating' | 'vouchCount' | 'trustRating'>): Store => {
    const newStore: Store = {
      ...storeData,
      id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      totalPosts: 0,
      verified: false,
      rating: 0,
      vouchCount: 0,
      trustRating: 45,
      status: 'pending',
      submittedBy: currentUser?.uid ?? 'current_user',
      submittedByName: currentUser?.displayName ?? 'You',
    };

    // Add to local pending list (not to the live store list)
    setPendingStores(prev => [newStore, ...prev]);

    if (isFirebaseConfigured) {
      createStore(newStore).catch(err => {
        console.error('[HanapLokal] ❌ Failed to save store to Firestore:', err);
      });
    } else {
      console.warn('[HanapLokal] ⚠️ Firebase not configured — store saved locally as pending.');
    }

    // Trigger notification to admin
    const submitterName = currentUser?.displayName ?? 'Someone';
    void addNotification('admin', {
      type: 'admin_pending_store',
      title: 'New Pending Store',
      body: `🏪 ${submitterName} submitted a new store: "${newStore.name}"`,
      linkEntityId: newStore.id,
      linkEntityType: 'store',
    });

    return newStore;
  }, [currentUser, addNotification]);

  const toggleStoreVouch = useCallback((storeId: string): boolean => {
    if (!isLoggedIn) {
      onAuthRequired();
      return false;
    }

    const alreadyVouched = vouchedStores.has(storeId);

    setVouchedStores(prev => {
      const next = new Set(prev);
      if (alreadyVouched) next.delete(storeId);
      else next.add(storeId);
      return next;
    });

    setStores(prev =>
      prev.map(store => {
        if (store.id !== storeId) return store;
        const nextVouchCount = alreadyVouched ? Math.max(store.vouchCount - 1, 0) : store.vouchCount + 1;
        return {
          ...store,
          vouchCount: nextVouchCount,
          trustRating: calculateTrustRating({ verified: store.verified, vouchCount: nextVouchCount }),
        };
      })
    );

    if (isFirebaseConfigured && currentUser) {
      void toggleStoreVouchRemote(storeId, currentUser.uid, alreadyVouched).catch(() => {
        setVouchedStores(prev => {
          const next = new Set(prev);
          if (alreadyVouched) next.add(storeId);
          else next.delete(storeId);
          return next;
        });
        setStores(prev =>
          prev.map(store => {
            if (store.id !== storeId) return store;
            const rollbackCount = alreadyVouched ? store.vouchCount + 1 : Math.max(store.vouchCount - 1, 0);
            return {
              ...store,
              vouchCount: rollbackCount,
              trustRating: calculateTrustRating({ verified: store.verified, vouchCount: rollbackCount }),
            };
          })
        );
      });
    }

    return true;
  }, [currentUser, isLoggedIn, onAuthRequired, vouchedStores]);

  const adminDeleteStore = useCallback((store: Store) => {
    setStores(prev => prev.filter(s => s.id !== store.id));
    setDeletedStores(prev => [store, ...prev]);

    if (isFirebaseConfigured && currentUser) {
      softDeleteStore(store, currentUser.uid, currentUser.displayName ?? 'Admin').catch(err => {
        console.error('[HanapLokal] ❌ Failed to admin-delete store:', err);
        setStores(prev => [store, ...prev]);
        setDeletedStores(prev => prev.filter(s => s.id !== store.id));
      });
    }
  }, [currentUser]);

  const restoreStore = useCallback((store: Store) => {
    setDeletedStores(prev => prev.filter(s => s.id !== store.id));
    setStores(prev => [store, ...prev]);

    if (isFirebaseConfigured) {
      restoreStoreRemote(store).catch(err => {
        console.error('[HanapLokal] ❌ Failed to restore store:', err);
        setDeletedStores(prev => [store, ...prev]);
        setStores(prev => prev.filter(s => s.id !== store.id));
      });
    }
  }, []);

  const approveStore = useCallback((store: Store) => {
    // Optimistic: move from pending to live list
    setPendingStores(prev => prev.filter(s => s.id !== store.id));
    setStores(prev => [{ ...store, status: 'approved' }, ...prev]);

    if (isFirebaseConfigured) {
      approveStoreRemote(store).catch(err => {
        console.error('[HanapLokal] ❌ Failed to approve store:', err);
        // Rollback
        setPendingStores(prev => [store, ...prev]);
        setStores(prev => prev.filter(s => s.id !== store.id));
      });
    }

    if (store.submittedBy) {
      void addNotification(store.submittedBy, {
        type: 'post_approved',
        title: 'Store Approved',
        body: `🏪 Your store "${store.name}" has been approved by an admin!`,
        linkEntityId: store.id,
        linkEntityType: 'store',
      });
    }
  }, [addNotification]);

  const rejectStore = useCallback((storeId: string) => {
    const store = pendingStores.find(s => s.id === storeId);
    setPendingStores(prev => prev.filter(s => s.id !== storeId));

    if (isFirebaseConfigured) {
      rejectStoreRemote(storeId).catch(err => {
        console.error('[HanapLokal] ❌ Failed to reject store:', err);
      });
    }

    if (store && store.submittedBy) {
      void addNotification(store.submittedBy, {
        type: 'post_rejected',
        title: 'Store Rejected',
        body: `❌ Your store "${store.name}" was not approved by an admin.`,
        linkEntityId: store.id,
        linkEntityType: 'store',
      });
    }
  }, [pendingStores, addNotification]);

  const getStore = useCallback((id: string): Store | undefined => {
    return stores.find(s => s.id === id);
  }, [stores]);

  return (
    <StoresContext.Provider value={{
      stores,
      addStore,
      getStore,
      vouchedStores,
      toggleStoreVouch,
      adminDeleteStore,
      restoreStore,
      deletedStores,
      pendingStores,
      approveStore,
      rejectStore,
    }}>
      {children}
    </StoresContext.Provider>
  );
}

export function useStores() {
  const ctx = useContext(StoresContext);
  if (!ctx) throw new Error('useStores must be used within StoresProvider');
  return ctx;
}
