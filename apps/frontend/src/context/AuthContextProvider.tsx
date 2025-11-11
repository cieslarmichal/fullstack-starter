import { useEffect, useState, useCallback, useMemo } from 'react';
import { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { User } from '../api/types/user';
import { getMyUser } from '../api/queries/getMyUser';
import { logoutUser } from '../api/queries/logout';
import {
  requestAccessTokenRefresh,
  setTokenRefreshCallback,
  setAccessToken as setApiAccessToken,
} from '../api/apiRequest';

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [userDataInitialized, setUserDataInitialized] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState<boolean>(false);

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
            console.error('Silent refresh failed - clearing auth state:', error);
            // If silent refresh fails, clear the auth state to force re-login
            setAccessToken(null);
            setUserData(null);
            setUserDataInitialized(true);
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

  // Update the access token in apiRequest module whenever the token changes
  useEffect(() => {
    setApiAccessToken(accessToken);
  }, [accessToken]);

  // Try to refresh token on app initialization - only once
  useEffect(() => {
    const initializeAuth = async () => {
      if (!hasAttemptedRefresh && !accessToken) {
        setHasAttemptedRefresh(true);
        try {
          const tokenResponse = await requestAccessTokenRefresh();
          setAccessToken(tokenResponse.accessToken);
        } catch {
          setUserDataInitialized(true);
        }
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

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
