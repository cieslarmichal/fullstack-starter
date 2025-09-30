import { useEffect, useState, useCallback } from 'react';
import { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { User } from '../api/types/user';
import { getMyUser } from '../api/queries/getMyUser';
import { logoutUser } from '../api/queries/logout';
import { refreshToken } from '../api/queries/refreshToken';
import { setTokenRefreshCallback, setAccessTokenGetter } from '../api/apiRequest';

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

  // Silent refresh - refresh token every 5 minutes to prevent expiration
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;

    if (accessToken) {
      refreshInterval = setInterval(
        async () => {
          try {
            console.log('Silent token refresh...');
            const tokenResponse = await refreshToken();
            setAccessToken(tokenResponse.accessToken);
          } catch (error) {
            console.error('Silent refresh failed:', error);
          }
        },
        5 * 60 * 1000,
      );
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [accessToken]);

  useEffect(() => {
    setTokenRefreshCallback((newToken: string) => {
      updateAccessToken(newToken);
    });

    setAccessTokenGetter(() => accessToken);
  }, [updateAccessToken, accessToken]);

  // Try to refresh token on app initialization
  useEffect(() => {
    const initializeAuth = async () => {
      if (!accessToken) {
        try {
          const tokenResponse = await refreshToken();
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
      } else if (!accessToken) {
        setUserDataInitialized(true);
      }
    };

    fetchUserData();
  }, [userData, accessToken]);

  return (
    <AuthContext.Provider
      value={{
        userData,
        userDataInitialized,
        clearUserData,
        refreshUserData,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
