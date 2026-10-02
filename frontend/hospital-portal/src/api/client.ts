import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types';
import { handleMockRequest } from '../mocks/mockHandlers';

// Token storage keys
const TOKEN_KEY = 'bloodbank_hospital_token';
const USER_KEY = 'bloodbank_hospital_user';

let inMemoryToken: string | null = null;

// Initialize inMemoryToken from sessionStorage on startup
try {
  inMemoryToken = sessionStorage.getItem(TOKEN_KEY);
} catch {
  inMemoryToken = null;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
  } catch {
    // Ignore sessionStorage failures
  }
}

// Event listeners for auth failure navigation
type AuthEventCallback = (type: 'UNAUTHORIZED' | 'FORBIDDEN') => void;
const authListeners = new Set<AuthEventCallback>();

export function subscribeAuthEvents(cb: AuthEventCallback): () => void {
  authListeners.add(cb);
  return () => {
    authListeners.delete(cb);
  };
}

function notifyAuthEvent(type: 'UNAUTHORIZED' | 'FORBIDDEN') {
  authListeners.forEach((cb) => {
    try {
      cb(type);
    } catch {
      // Ignore listener error
    }
  });
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Mock adapter when USE_MOCK is active
if (USE_MOCK) {
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    try {
      const mockResult = await handleMockRequest({
        method: config.method || 'get',
        url: config.url || '',
        headers: config.headers as Record<string, string>,
        data: config.data,
        params: config.params,
      });

      const response: AxiosResponse = {
        data: mockResult.data,
        status: mockResult.status,
        statusText: 'OK',
        headers: {},
        config,
      };
      return response;
    } catch (err: any) {
      if (err.response) {
        return Promise.reject(err);
      }
      const genericErr = new AxiosError(
        err.message || 'Mock Request Error',
        'ERR_BAD_REQUEST',
        config,
        undefined,
        {
          data: {
            timestamp: new Date().toISOString(),
            status: 500,
            code: 'INTERNAL_ERROR',
            message: err.message || 'Internal mock error',
          },
          status: 500,
          statusText: 'Internal Error',
          headers: {},
          config,
        }
      );
      return Promise.reject(genericErr);
    }
  };
}

// Attach Authorization header to every request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and 403
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    if (status === 401) {
      setAuthToken(null);
      notifyAuthEvent('UNAUTHORIZED');
    } else if (status === 403) {
      notifyAuthEvent('FORBIDDEN');
    }
    return Promise.reject(error);
  }
);

// Error parser helper to extract contract ApiError
export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Partial<ApiError>;
    if (data.code && data.message) {
      return {
        timestamp: data.timestamp || new Date().toISOString(),
        status: error.response.status,
        code: data.code,
        message: data.message,
        details: data.details || [],
        path: data.path,
      };
    }
  }

  if (error instanceof Error) {
    return {
      timestamp: new Date().toISOString(),
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error.message,
      details: [],
    };
  }

  return {
    timestamp: new Date().toISOString(),
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected clinical error occurred. Please try again.',
    details: [],
  };
}
