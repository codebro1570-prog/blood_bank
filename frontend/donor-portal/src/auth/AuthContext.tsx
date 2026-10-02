/**
 * AuthContext for Donor Portal
 * Keeps token in memory and sessionStorage.
 * On 401 clear it and redirect to /login.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, ChangePasswordRequest, LoginRequest, LoginResponse } from '../types';
import { authApi } from '../api/auth';
import { getAuthToken, setAuthToken } from '../api/client';

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const authUser = await authApi.getMe();
      setUser(authUser);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // Initial verification on mount
    const initialToken = getAuthToken();
    if (initialToken) {
      refreshUser();
    } else {
      setIsLoading(false);
    }

    // Listen for unauthorized events from axios interceptor
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [refreshUser, logout]);

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      // Explicitly store token in memory and sessionStorage
      setAuthToken(response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    await authApi.changePassword(data);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout,
    refreshUser,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
