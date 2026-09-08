'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGetMe, apiAuthLogin, apiAuthSignup } from '@/lib/api';

interface MockUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
  role: 'guest' | 'host';
}

interface AuthContextType {
  currentUser: MockUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isHost: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; user?: MockUser; message?: string; error?: string }>;
  signup: (email: string, password?: string, name?: string, role?: string) => Promise<{ success: boolean; user?: MockUser; message?: string; error?: string }>;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  requireAuth: (callback?: () => void) => boolean;
  refreshUser: () => Promise<MockUser | undefined>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoggedIn: false,
  isLoading: false,
  isHost: false,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  showLoginModal: false,
  setShowLoginModal: () => {},
  requireAuth: () => false,
  refreshUser: async () => undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const refreshUser = useCallback(async () => {
    const savedUserId = typeof window !== 'undefined' 
      ? (localStorage.getItem('user_id') || localStorage.getItem('demo_user_id')) 
      : null;
    if (!savedUserId) {
      setCurrentUser(null);
      localStorage.removeItem('mock_user');
      localStorage.removeItem('user_id');
      localStorage.removeItem('demo_user_id');
      return undefined;
    }
    try {
      const dbUser = await apiGetMe();
      if (dbUser) {
        const updatedUser: MockUser = {
          id: dbUser.id,
          name: dbUser.name || 'User',
          email: dbUser.email,
          avatar_url: dbUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          role: String(dbUser.role).toLowerCase() === 'host' ? 'host' : 'guest',
        };
        console.log('👤 [AUTH SYNC] Active User Loaded ->', {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        });
        setCurrentUser(updatedUser);
        localStorage.setItem('mock_user', JSON.stringify(updatedUser));
        localStorage.setItem('user_id', updatedUser.id.toString());
        return updatedUser;
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
      setCurrentUser(null);
      localStorage.removeItem('mock_user');
      localStorage.removeItem('user_id');
      localStorage.removeItem('demo_user_id');
    }
  }, []);

  // Restore session from localStorage on mount and sync with DB
  useEffect(() => {
    const savedUserId = typeof window !== 'undefined' 
      ? (localStorage.getItem('user_id') || localStorage.getItem('demo_user_id')) 
      : null;
    if (!savedUserId) {
      setCurrentUser(null);
      localStorage.removeItem('mock_user');
      localStorage.removeItem('user_id');
      localStorage.removeItem('demo_user_id');
      setIsLoading(false);
      return;
    }
    try {
      const saved = localStorage.getItem('mock_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {}
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password?: string) => {
    try {
      const res = await apiAuthLogin(email, password);
      if (res && res.user) {
        const userObj = res.user;
        const loggedUser: MockUser = {
          id: userObj.id,
          name: userObj.name || email.split('@')[0],
          email: userObj.email,
          avatar_url: userObj.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          role: String(userObj.role).toLowerCase() === 'host' ? 'host' : 'guest',
        };
        localStorage.setItem('user_id', userObj.id.toString());
        localStorage.setItem('mock_user', JSON.stringify(loggedUser));
        // Store JWT token for authenticated API requests
        if ((res as any).access_token) {
          localStorage.setItem('access_token', (res as any).access_token);
        }
        setCurrentUser(loggedUser);
        console.log('✅ [AUTH SUCCESS] Logged in as DB user:', loggedUser);
        return {
          success: true,
          user: loggedUser,
          message: res.message || `Successfully logged in as ${loggedUser.name}`
        };
      }
      return { success: false, error: 'User data was not returned by server' };
    } catch (err: any) {
      console.error('Failed to log in with backend:', err);
      return {
        success: false,
        error: err.message || 'Failed to connect to backend server. Please try again.'
      };
    }
  }, []);

  const signup = useCallback(async (email: string, password?: string, name?: string, role?: string) => {
    try {
      const res = await apiAuthSignup(email, password, name, role);
      if (res && res.user) {
        const userObj = res.user;
        const newUser: MockUser = {
          id: userObj.id,
          name: userObj.name || name || email.split('@')[0],
          email: userObj.email,
          avatar_url: userObj.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          role: String(userObj.role).toLowerCase() === 'host' ? 'host' : 'guest',
        };
        localStorage.setItem('user_id', userObj.id.toString());
        localStorage.setItem('mock_user', JSON.stringify(newUser));
        // Store JWT token for authenticated API requests
        if ((res as any).access_token) {
          localStorage.setItem('access_token', (res as any).access_token);
        }
        setCurrentUser(newUser);
        console.log('✨ [AUTH SUCCESS] Registered new DB user:', newUser);
        return {
          success: true,
          user: newUser,
          message: res.message || `Welcome to Airbnb, ${newUser.name}!`
        };
      }
      return { success: false, error: 'User creation failed on server' };
    } catch (err: any) {
      console.error('Failed to sign up with backend:', err);
      return {
        success: false,
        error: err.message || 'Failed to register account with backend server.'
      };
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('mock_user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('demo_user_id');
    localStorage.removeItem('access_token');
  }, []);

  // Helper: if not logged in, show modal and return false. If logged in, run callback and return true.
  const requireAuth = useCallback((callback?: () => void): boolean => {
    if (!currentUser) {
      setShowLoginModal(true);
      return false;
    }
    if (callback) callback();
    return true;
  }, [currentUser]);

  const isLoggedIn = !!currentUser;
  const isHost = currentUser?.role === 'host';

  return (
    <AuthContext.Provider value={{
      currentUser, isLoggedIn, isLoading, isHost,
      login, signup, logout,
      showLoginModal, setShowLoginModal,
      requireAuth,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
