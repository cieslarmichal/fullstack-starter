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
let refreshPromise: Promise<{ accessToken: string }> | null = null;

export const setAccessTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

export const setTokenRefreshCallback = (callback: (newToken: string) => void) => {
  onTokenRefresh = callback;
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

  if (!response.ok && response.status === 401 && endpoint !== '/users/login') {
    try {
      // If there's already a refresh in progress, wait for it
      if (refreshPromise) {
        const refreshResponse = await refreshPromise;
        response = await makeRequest(refreshResponse.accessToken);
      } else {
        // Start a new refresh and share it with concurrent requests
        refreshPromise = refreshToken();

        try {
          const refreshResponse = await refreshPromise;

          if (onTokenRefresh) {
            onTokenRefresh(refreshResponse.accessToken);
          }

          response = await makeRequest(refreshResponse.accessToken);
        } finally {
          // Clear the refresh promise so future requests can start new refresh if needed
          refreshPromise = null;
        }
      }
    } catch (refreshError) {
      refreshPromise = null;
      throw new Error(`Authentication failed: ${refreshError}`);
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
