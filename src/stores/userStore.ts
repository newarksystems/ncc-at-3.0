import { create } from 'zustand';
import { User } from '@/types';
import { apiService } from '@/services/api';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setIsAuthenticated: (isAuth: boolean) => void;
  setLoading: (loading: boolean) => void;
  initializeFromStorage: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: (userData) => set({ user: userData, isAuthenticated: true, loading: false }),
  logout: () => {
    set({ user: null, isAuthenticated: false, loading: false });
    // Clear auth data from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  updateUser: (userData) => set((state) => ({ 
    user: state.user ? { ...state.user, ...userData } : null 
  })),
  setIsAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
  setLoading: (loading) => set({ loading }),
  initializeFromStorage: () => {
    try {
      const token = localStorage.getItem('access_token');
      const userString = localStorage.getItem('user');
      
      if (token && userString) {
        const user = JSON.parse(userString) as User;
        set({ user, isAuthenticated: true, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error initializing user store from storage:', error);
      set({ loading: false });
    }
  },
}));