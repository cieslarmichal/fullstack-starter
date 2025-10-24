import { useEffect, useState, useCallback, useMemo } from 'react';
import { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { User } from '../api/types/user';
import { getMyUser } from '../api/queries/getMyUser';
import { logoutUser } from '../api/queries/logout';
import { requestAccessTokenRefresh, setTokenRefreshCallback, setAccessTokenGetter } from '../api/apiRequest';

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [userDataInitialized, setUserDataInitialized] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const refreshUserData = useCallback(async () => {
    if (accessToken) {
      try {
        const user = await getMyUser();
        setUserData(user);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  }, [accessToken]);

  const clearUserData = useCallback(async () => {
    await logoutUser();

    setUserData(null);
    setAccessToken(null);
  }, []);

  const updateAccessToken = useCallback((newAccessToken: string) => {
    setAccessToken(newAccessToken);
  }, []);

  // Silent refresh - refresh token every 10 minutes to prevent expiration
  useEffect(() => {
    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    if (accessToken) {
      refreshInterval = setInterval(
        async () => {
          try {
            const tokenResponse = await requestAccessTokenRefresh();
            setAccessToken(tokenResponse.accessToken);
          } catch (error) {
            console.error('Silent refresh failed:', error);
          }
        },
        10 * 60 * 1000,
      );
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [accessToken]);

  // Keep the token update callback stable and set once
  useEffect(() => {
    setTokenRefreshCallback((newToken: string) => {
      updateAccessToken(newToken);
    });
  }, [updateAccessToken]);

  // Update the access token getter whenever the token changes
  useEffect(() => {
    setAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  // Try to refresh token on app initialization
  useEffect(() => {
    const initializeAuth = async () => {
      if (!accessToken) {
        try {
          const tokenResponse = await requestAccessTokenRefresh();
          setAccessToken(tokenResponse.accessToken);
        } catch {
          console.log('No valid refresh token available - user needs to log in');
          setUserDataInitialized(true);
        }
      }
    };

    initializeAuth();
  }, [accessToken]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData && accessToken) {
        try {
          const user = await getMyUser();

          setUserData(user);
          setUserDataInitialized(true);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setUserData(null);
          setUserDataInitialized(true);
        }
      }
    };

    fetchUserData();
  }, [userData, accessToken]);

  const contextValue = useMemo(
    () => ({
      userData,
      userDataInitialized,
      clearUserData,
      refreshUserData,
      accessToken,
    }),
    [userData, userDataInitialized, clearUserData, refreshUserData, accessToken],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
