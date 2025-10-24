import { config } from '../config';
import { refreshToken } from './queries/refreshToken';

interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: URLSearchParams;
  requiresAuth?: boolean;
}

let getAccessToken: (() => string | null) | null = null;
let onTokenRefresh: ((newToken: string) => void) | null = null;
// Global single-flight promise to serialize refresh calls across the app
let refreshPromise: Promise<{ accessToken: string }> | null = null;

export const setAccessTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

export const setTokenRefreshCallback = (callback: (newToken: string) => void) => {
  onTokenRefresh = callback;
};

// Public helper to request an access token refresh in a single-flight manner
// Ensures concurrent callers share the same promise and only one network call is made
export const requestAccessTokenRefresh = async (): Promise<{ accessToken: string }> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const res = await refreshToken();
    if (onTokenRefresh) {
      onTokenRefresh(res.accessToken);
    }
    return res;
  })();

  try {
    return await refreshPromise;
  } finally {
    // Clear so future requests can initiate a new refresh when needed
    refreshPromise = null;
  }
};

export const apiRequest = async <T>(endpoint: string, options: ApiRequestConfig): Promise<T> => {
  const { method, body, params, requiresAuth = true } = options;

  const url = params ? `${config.backendUrl}${endpoint}?${params}` : `${config.backendUrl}${endpoint}`;

  const makeRequest = async (token?: string): Promise<Response> => {
    const headers: Record<string, string> = {};

    if (token && requiresAuth) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (body) {
      if (body instanceof FormData) {
        requestConfig.body = body;
      } else {
        requestConfig.body = JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
      }
    }

    return fetch(url, requestConfig);
  };

  const accessToken = requiresAuth && getAccessToken ? getAccessToken() : undefined;
  let response = await makeRequest(accessToken || undefined);

  if (!response.ok && response.status === 401 && endpoint !== '/users/login' && requiresAuth) {
    try {
      const refreshResponse = await requestAccessTokenRefresh();
      response = await makeRequest(refreshResponse.accessToken);
    } catch (refreshError) {
      throw new Error(`Authentication failed: ${String(refreshError)}`);
    }
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  const responseData = await response.json();

  if (endpoint === '/users/login' && response.ok && onTokenRefresh) {
    onTokenRefresh(responseData.accessToken);
  }

  return responseData;
};
