import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getUser,
  getRefreshToken,
  clearTokens,
  refreshAccessToken,
  saveTokens,
  saveUser,
  saveAccessToken,
} from "../services/authService";
import {
  setAccessTokenRefreshedHandler,
  setSessionExpiredHandler,
} from "../config/api";
import { resetToLogin } from "../navigation/rootNavigation";

type User = {
  userId: string;
  email: string;
  farmName: string;
  firstname: string;
  lastname: string;
  role: string;
  sheds: string[];
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuthData: (
    user: User,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAccessTokenRefreshedHandler((token) => setAccessToken(token));
    setSessionExpiredHandler(() => {
      setUser(null);
      setAccessToken(null);
      resetToLogin();
    });
    restoreSession();

    return () => {
      setAccessTokenRefreshedHandler(null);
      setSessionExpiredHandler(null);
    };
  }, []);

  const restoreSession = async () => {
    try {
      const savedUser = await getUser();
      const refresh = await getRefreshToken();

      if (!savedUser || !refresh) {
        return;
      }

      const result = await refreshAccessToken();
      await saveAccessToken(result.accessToken);
      setUser(savedUser);
      setAccessToken(result.accessToken);
    } catch {
      // Stale tokens after logout or expired refresh — user logs in again
      await clearTokens();
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthData = async (
    userData: User,
    newAccessToken: string,
    newRefreshToken: string,
  ) => {
    await saveTokens(newAccessToken, newRefreshToken);
    await saveUser(userData);
    setUser(userData);
    setAccessToken(newAccessToken);
  };

  const signOut = async () => {
    await clearTokens();
    setUser(null);
    setAccessToken(null);
  };

  const refreshAuth = async () => {
    try {
      const result = await refreshAccessToken();
      if (result.accessToken) {
        const refresh = await getRefreshToken();
        await saveTokens(result.accessToken, refresh || "");
        setAccessToken(result.accessToken);
      }
    } catch {
      await signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        setAuthData,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
