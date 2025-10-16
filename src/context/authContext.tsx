'use client';

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginRequest } from '@/types';
import { apiService } from '@/services/api';
import { useUserStore } from '@/stores/userStore';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading, login: storeLogin, logout: storeLogout, setLoading } = useUserStore();
  const router = useRouter();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Initialize auth service only once
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      authService.initialize();
    }
    
    // Listen for auth events
    const handleAuthLogout = () => {
      storeLogout();
      router.push('/signin');
    };
    
    const handleSessionExtended = () => {
      // Session was successfully extended, nothing to do here
      console.log('Session extended successfully');
    };
    
    window.addEventListener('auth-logout', handleAuthLogout);
    window.addEventListener('auth-session-extended', handleSessionExtended);
    
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
      window.removeEventListener('auth-session-extended', handleSessionExtended);
    };
  }, [storeLogout, router]);

  const login = async (email: string, password: string) => {
    try {
      const loginData: LoginRequest = { email, password };
      const response = await apiService.login(loginData);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      storeLogin(response.user); // Update Zustand store
      
      // Initialize auth service with new tokens
      authService.scheduleTokenRefresh(response.access_token, response.refresh_token);
      
      router.push('/dashboard');
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message.includes('401') ? 'Incorrect email or password' : (error.message || 'Login failed');
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storeLogout(); // Update Zustand store
      authService.logout(); // Clear auth service timers
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Dispatch logout event for toast notification
      window.dispatchEvent(new CustomEvent('auth-logout-success'));
      router.push('/signin');
    }
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};