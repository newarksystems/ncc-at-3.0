// src/utils/authSync.ts
import { useUserStore } from '@/stores/userStore';
import { apiService } from '@/services/api';
import { User } from '@/types';

let syncInProgress = false;

/**
 * Synchronize auth state between localStorage and Zustand store
 */
export const syncAuthState = async (): Promise<User | null> => {
  const token = localStorage.getItem('access_token');
  const store = useUserStore.getState();
  
  if (token && !store.user && !store.loading && !syncInProgress) {
    syncInProgress = true;
    
    try {
      // Double-check the store state after potential async operations
      const currentStore = useUserStore.getState();
      if (currentStore.user || currentStore.loading) {
        syncInProgress = false;
        return currentStore.user;
      }
      
      const user = await apiService.getMe();
      useUserStore.getState().login(user);
      syncInProgress = false;
      return user;
    } catch (error) {
      console.error('Error during auth sync:', error);
      // Token is invalid/expired, clear it
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      useUserStore.getState().logout();
      syncInProgress = false;
      return null;
    }
  } else if (!token) {
    // No token, make sure store reflects this
    if (store.user || store.isAuthenticated) {
      useUserStore.getState().logout();
    }
    return null;
  }
  
  return store.user;
};

/**
 * Initialize auth state from localStorage
 */
export const initializeAuth = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    useUserStore.getState().setLoading(false);
    return;
  }
  
  // Token exists, fetch user info but don't block loading
  syncAuthState().finally(() => {
    useUserStore.getState().setLoading(false);
  });
};