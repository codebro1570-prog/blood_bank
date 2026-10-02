import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '../types';
import { authApi } from '../api/auth.api';
import { authEvents, getStoredUser, setAuthToken } from '../api/client';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: 'ADMIN' | 'STAFF') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('bb_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // If we have token, verify or refresh me
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem('bb_access_token');
      if (storedToken) {
        try {
          const me = await authApi.getMe();
          setUser(me);
        } catch {
          setUser(null);
          setToken(null);
          setAuthToken(null, null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setAuthToken(null, null);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };

    authEvents.addEventListener('unauthorized', handleUnauthorized);
    return () => {
      authEvents.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password = 'anypassword') => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setUser(res.user);
      setToken(res.accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
  };

  const switchDemoRole = async (targetRole: 'ADMIN' | 'STAFF') => {
    const targetEmail = targetRole === 'ADMIN' ? 'admin@bloodbank.org' : 'staff1@bb.org';
    await login(targetEmail, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
