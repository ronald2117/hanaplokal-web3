import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { type Store, mockStores } from '../data/mockData';
import {
  createStore,
  loadUserStoreVouches,
  subscribeToStores,
  subscribeToDeletedStores,
  softDeleteStore,
  restoreStore as restoreStoreRemote,
  toggleStoreVouch as toggleStoreVouchRemote,
} from '../services/firestore';
import { isFirebaseConfigured } from '../lib/firebase';

interface StoresContextType {
  stores: Store[];
  addStore: (store: Omit<Store, 'id' | 'totalPosts' | 'verified' | 'rating' | 'vouchCount' | 'trustRating'>) => Store;
  getStore: (id: string) => Store | undefined;
  vouchedStores: Set<string>;
  toggleStoreVouch: (storeId: string) => boolean;
  adminDeleteStore: (store: Store) => void;
  restoreStore: (store: Store) => void;
  deletedStores: Store[];
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
  const [vouchedStores, setVouchedStores] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = subscribeToStores(setStores);
    const unsubDeleted = isAdmin ? subscribeToDeletedStores(setDeletedStores) : null;
    return () => {
      if (unsub) unsub();
      if (unsubDeleted) unsubDeleted();
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
    };
    setStores(prev => [newStore, ...prev]);

    if (isFirebaseConfigured) {
      createStore(newStore).catch(err => {
        console.error('[HanapLokal] ❌ Failed to save store to Firestore:', err);
      });
    } else {
      console.warn('[HanapLokal] ⚠️ Firebase not configured — store saved locally only.');
    }

    return newStore;
  }, []);

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

  const getStore = useCallback((id: string): Store | undefined => {
    return stores.find(s => s.id === id);
  }, [stores]);

  return (
    <StoresContext.Provider value={{ stores, addStore, getStore, vouchedStores, toggleStoreVouch, adminDeleteStore, restoreStore, deletedStores }}>
      {children}
    </StoresContext.Provider>
  );
}

export function useStores() {
  const ctx = useContext(StoresContext);
  if (!ctx) throw new Error('useStores must be used within StoresProvider');
  return ctx;
}
