/**
 * Axios API Client with Mock Mode Interceptor
 * Base URL from VITE_API_BASE_URL (default http://localhost:8080/api/v1)
 * Mock mode enabled by default (or when VITE_USE_MOCK !== 'false')
 */

import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { ApiError } from '../types';
import { mockHandlers, MockApiError } from '../mocks/mockHandlers';

const TOKEN_STORAGE_KEY = 'donor_access_token';

// In-memory token storage + sessionStorage persistence
let inMemoryToken: string | null = (() => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
  } catch {
    return null;
  }
})();

export const getAuthToken = (): string | null => inMemoryToken;

export const setAuthToken = (token: string | null): void => {
  inMemoryToken = token;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (token) {
        window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  } catch (err) {
    console.error('Failed to update sessionStorage', err);
  }
};

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:8080/api/v1';

// Toast notification trigger event
export const triggerApiErrorToast = (error: ApiError) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:api-error', { detail: error }));
  }
};

/**
 * In-memory Mock Adapter implementing the Axios adapter interface
 */
export const mockAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const method = (config.method || 'get').toUpperCase();
  const url = config.url || '';
  // Normalize URL path relative to /api/v1 or absolute
  let path = url.startsWith('http') ? new URL(url).pathname : url;
  if (!path.startsWith('/api/v1')) {
    path = `/api/v1${path.startsWith('/') ? path : '/' + path}`;
  }

  // Extract authorization header safely from AxiosHeaders or plain object
  let authHeader: string | undefined = undefined;
  if (config.headers) {
    if (typeof (config.headers as unknown as { get: (k: string) => string | null }).get === 'function') {
      authHeader =
        (config.headers as unknown as { get: (k: string) => string | null }).get('Authorization') ||
        (config.headers as unknown as { get: (k: string) => string | null }).get('authorization') ||
        undefined;
    }
    if (!authHeader) {
      authHeader =
        ((config.headers as Record<string, unknown>)['Authorization'] as string) ||
        ((config.headers as Record<string, unknown>)['authorization'] as string);
    }
  }
  if (!authHeader && getAuthToken()) {
    authHeader = `Bearer ${getAuthToken()}`;
  }

  // Extract body safely
  let body = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // Keep as is
    }
  }
  const params = config.params || {};

  try {
    let data: unknown = null;
    let status = 200;

    // Match endpoints
    // 1. POST /auth/login
    if (method === 'POST' && path.endsWith('/auth/login')) {
      data = await mockHandlers.login(body, path);
      status = 200;
    }
    // 2. POST /auth/register/donor
    else if (method === 'POST' && path.endsWith('/auth/register/donor')) {
      data = await mockHandlers.registerDonor(body, path);
      status = 201;
    }
    // 3. GET /auth/me
    else if (method === 'GET' && path.endsWith('/auth/me')) {
      data = await mockHandlers.getMe(authHeader, path);
      status = 200;
    }
    // 4. POST /auth/change-password
    else if (method === 'POST' && path.endsWith('/auth/change-password')) {
      await mockHandlers.changePassword(body, authHeader, path);
      status = 204;
    }
    // 5. GET /donors/me/eligibility (Must be before /donors/me)
    else if (method === 'GET' && path.endsWith('/donors/me/eligibility')) {
      data = await mockHandlers.getEligibility(authHeader, path);
      status = 200;
    }
    // 6. GET /donors/me/donations
    else if (method === 'GET' && path.endsWith('/donors/me/donations')) {
      data = await mockHandlers.getMyDonations(params, authHeader, path);
      status = 200;
    }
    // 7. GET /donors/me
    else if (method === 'GET' && path.endsWith('/donors/me')) {
      data = await mockHandlers.getDonorProfile(authHeader, path);
      status = 200;
    }
    // 8. PUT /donors/me
    else if (method === 'PUT' && path.endsWith('/donors/me')) {
      data = await mockHandlers.updateDonorProfile(body, authHeader, path);
      status = 200;
    }
    // 9. GET /notifications/unread-count
    else if (method === 'GET' && path.endsWith('/notifications/unread-count')) {
      data = await mockHandlers.getUnreadCount(authHeader, path);
      status = 200;
    }
    // 10. PATCH /notifications/read-all
    else if (method === 'PATCH' && path.endsWith('/notifications/read-all')) {
      await mockHandlers.markAllAsRead(authHeader, path);
      status = 204;
    }
    // 11. PATCH /notifications/:id/read
    else if (method === 'PATCH' && /\/notifications\/\d+\/read$/.test(path)) {
      const idMatch = path.match(/\/notifications\/(\d+)\/read$/);
      const id = idMatch ? parseInt(idMatch[1], 10) : 0;
      await mockHandlers.markAsRead(id, authHeader, path);
      status = 204;
    }
    // 12. GET /notifications
    else if (method === 'GET' && path.endsWith('/notifications')) {
      data = await mockHandlers.getNotifications(params, authHeader, path);
      status = 200;
    }
    // 13. GET /blood-groups/:code/compatible-donors
    else if (method === 'GET' && /\/blood-groups\/[^/]+\/compatible-donors$/.test(path)) {
      const match = path.match(/\/blood-groups\/([^/]+)\/compatible-donors$/);
      const code = match ? match[1] : '';
      data = await mockHandlers.getCompatibleDonors(code);
      status = 200;
    }
    // 14. GET /blood-groups
    else if (method === 'GET' && path.endsWith('/blood-groups')) {
      data = await mockHandlers.getBloodGroups();
      status = 200;
    } else {
      throw new MockApiError(404, 'NOT_FOUND', `Mock endpoint ${method} ${path} not implemented`, path);
    }

    return {
      data,
      status,
      statusText: status === 204 ? 'No Content' : status === 201 ? 'Created' : 'OK',
      headers: { 'content-type': 'application/json' },
      config,
    };
  } catch (err: unknown) {
    if (err instanceof MockApiError) {
      const axiosError = new AxiosError(
        err.apiError.message,
        err.apiError.code,
        config,
        undefined,
        {
          data: err.apiError,
          status: err.apiError.status,
          statusText: err.apiError.code,
          headers: { 'content-type': 'application/json' },
          config,
        }
      );
      return Promise.reject(axiosError);
    }
    return Promise.reject(err);
  }
};

const USE_MOCK =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_USE_MOCK === 'true';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(USE_MOCK ? { adapter: (c) => mockAdapter(c as InternalAxiosRequestConfig) } : {}),
});

// Attach Authorization header to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token && config.headers) {
    if (typeof (config.headers as unknown as { set: (k: string, v: string) => void }).set === 'function') {
      (config.headers as unknown as { set: (k: string, v: string) => void }).set('Authorization', `Bearer ${token}`);
    } else {
      (config.headers as Record<string, unknown>)['Authorization'] = `Bearer ${token}`;
      (config.headers as Record<string, unknown>)['authorization'] = `Bearer ${token}`;
    }
  }

  if (USE_MOCK) {
    config.adapter = (c) => mockAdapter(c as InternalAxiosRequestConfig);
  }

  return config;
});

// Global response interceptor for 401, 403, and ApiError parsing
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const apiError = error.response?.data;

    // Handle 401 Unauthorized only for existing authenticated sessions
    if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    } else if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:forbidden'));
      }
    }

    if (apiError && apiError.message) {
      triggerApiErrorToast(apiError);
    }

    return Promise.reject(error);
  }
);
