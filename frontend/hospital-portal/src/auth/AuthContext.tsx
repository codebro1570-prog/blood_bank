import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser, Hospital, ApprovalStatus } from '../types';
import { authApi } from '../api/auth';
import { hospitalApi } from '../api/hospital';
import {
  getAuthToken,
  setAuthToken,
  subscribeAuthEvents,
  parseApiError,
} from '../api/client';

export interface AuthContextType {
  user: AuthUser | null;
  hospital: Hospital | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  approvalStatus: ApprovalStatus | null;
  login: (credentials: { email: string; password?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchAccount: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'bloodbank_hospital_user';
const HOSPITAL_STORAGE_KEY = 'bloodbank_hospital_profile';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = sessionStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [hospital, setHospital] = useState<Hospital | null>(() => {
    try {
      const saved = sessionStorage.getItem(HOSPITAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    setHospital(null);
    try {
      sessionStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(HOSPITAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      setHospital(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));

      if (currentUser.role === 'HOSPITAL') {
        try {
          const currentHospital = await hospitalApi.getMyHospital();
          setHospital(currentHospital);
          sessionStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(currentHospital));
        } catch {
          // Keep prior profile if hospital endpoint fails
        }
      }
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.status === 401) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();

    const unsubscribe = subscribeAuthEvents((event) => {
      if (event === 'UNAUTHORIZED') {
        logout();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshUser, logout]);

  const login = async (credentials: { email: string; password?: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({
        email: credentials.email,
        password: credentials.password || 'password123',
      });
      setAuthToken(res.accessToken);
      setTokenState(res.accessToken);
      setUser(res.user);
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));

      if (res.user.role === 'HOSPITAL') {
        try {
          const hosp = await hospitalApi.getMyHospital();
          setHospital(hosp);
          sessionStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(hosp));
        } catch {
          // Ignore
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = async (email: string) => {
    await login({ email });
  };

  const approvalStatus: ApprovalStatus | null =
    hospital?.approvalStatus || user?.hospitalApprovalStatus || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        hospital,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        approvalStatus,
        login,
        logout,
        refreshUser,
        switchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
