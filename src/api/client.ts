import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiError, AuthUser } from '../types';
import { handleMockRequest } from '../mocks/handler';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Token memory & sessionStorage persistence
let memoryToken: string | null = sessionStorage.getItem('bb_access_token');
let memoryUser: AuthUser | null = null;

try {
  const cachedUser = sessionStorage.getItem('bb_auth_user');
  if (cachedUser) {
    memoryUser = JSON.parse(cachedUser);
  }
} catch {
  memoryUser = null;
}

export function setAuthToken(token: string | null, user?: AuthUser | null) {
  memoryToken = token;
  if (token) {
    sessionStorage.setItem('bb_access_token', token);
  } else {
    sessionStorage.removeItem('bb_access_token');
  }

  if (user !== undefined) {
    memoryUser = user;
    if (user) {
      sessionStorage.setItem('bb_auth_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('bb_auth_user');
    }
  }
}

export function getAuthToken(): string | null {
  if (!memoryToken) {
    memoryToken = sessionStorage.getItem('bb_access_token');
  }
  return memoryToken;
}

export function getStoredUser(): AuthUser | null {
  if (!memoryUser) {
    try {
      const cached = sessionStorage.getItem('bb_auth_user');
      if (cached) memoryUser = JSON.parse(cached);
    } catch {
      memoryUser = null;
    }
  }
  return memoryUser;
}

// Global event targets for 401 and 403 handling
export const authEvents = new EventTarget();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// If mock mode is active, handle calls with mock router
if (USE_MOCK) {
  apiClient.defaults.adapter = async (config) => {
    try {
      // Calculate relative path inside /api/v1
      let url = config.url || '';
      if (url.startsWith(BASE_URL)) {
        url = url.slice(BASE_URL.length);
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        const parsed = new URL(url);
        url = parsed.pathname.replace('/api/v1', '') + parsed.search;
      }

      if (!url.startsWith('/')) {
        url = '/' + url;
      }

      let parsedData: any = config.data;
      if (typeof config.data === 'string') {
        try {
          parsedData = JSON.parse(config.data);
        } catch {
          parsedData = config.data;
        }
      }

      const currentUser = getStoredUser();
      const mockResult = await handleMockRequest(
        config.method || 'GET',
        url,
        parsedData,
        config.params,
        currentUser
      );

      const response: AxiosResponse = {
        data: mockResult,
        status: config.method?.toUpperCase() === 'POST' && url.includes('/staff') ? 201 : 200,
        statusText: 'OK',
        headers: {},
        config,
      };
      return response;
    } catch (err: any) {
      // Structure as AxiosError with ApiError contract
      const apiError: ApiError = err?.status
        ? err
        : {
            timestamp: new Date().toISOString(),
            status: 500,
            code: 'INTERNAL_ERROR',
            message: err?.message || 'An unexpected error occurred.',
            path: config.url,
          };

      const axiosError = new AxiosError(
        apiError.message,
        String(apiError.status),
        config,
        undefined,
        {
          data: apiError,
          status: apiError.status,
          statusText: apiError.code,
          headers: {},
          config,
        }
      );
      return Promise.reject(axiosError);
    }
  };
}

// Response interceptor: handle 401, 403, and extract ApiError
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const apiErrorData = error.response?.data;

    if (status === 401) {
      setAuthToken(null, null);
      authEvents.dispatchEvent(new CustomEvent('unauthorized'));
    } else if (status === 403) {
      authEvents.dispatchEvent(new CustomEvent('forbidden', { detail: apiErrorData }));
    }

    return Promise.reject(error);
  }
);

// Helper to extract typed ApiError
export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
      return data;
    }
    return {
      timestamp: new Date().toISOString(),
      status: error.response?.status || 500,
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred.',
      details: [],
    };
  }
  return {
    timestamp: new Date().toISOString(),
    status: 500,
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unknown error occurred.',
    details: [],
  };
}
