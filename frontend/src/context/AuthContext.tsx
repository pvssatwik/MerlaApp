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
  refreshAuth: () => Promise<boolean>;
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
  // ─── Auto-refresh access token before expiry ─────────────
  useEffect(() => {
    if (!accessToken) return;

    try {
      const parts = accessToken.split(".");
      const payload = JSON.parse(atob(parts[1]));

      const expiresIn = payload.exp * 1000 - Date.now();

      // Refresh 2 minutes before expiry
      const refreshIn = expiresIn - 2 * 60 * 1000;

      if (refreshIn <= 0) {
        console.log("Token expired/about to expire — refreshing now");

        refreshAuth();
        return;
      }

      console.log(
        `Token refresh scheduled in ${Math.round(refreshIn / 1000 / 60)} mins`,
      );

      const timer = setTimeout(async () => {
        console.log("Auto-refreshing token...");

        const success = await refreshAuth();

        if (!success) {
          console.log("Auto-refresh failed, user will need to login again");
        }
      }, refreshIn);

      return () => clearTimeout(timer);
    } catch (e) {
      console.error("Token schedule error:", e);
    }
  }, [accessToken]);
  const restoreSession = async () => {
    console.log("restoreSession started");

    try {
      const savedUser = await getUser();
      console.log("savedUser =", savedUser);

      const refresh = await getRefreshToken();
      console.log("refresh =", refresh);

      if (!savedUser || !refresh) {
        console.log("No saved session");
        return;
      }

      const result = await refreshAccessToken();
      console.log("refresh result =", result);

      await saveAccessToken(result.accessToken);

      setUser(savedUser);
      setAccessToken(result.accessToken);

      console.log("Session restored");
    } catch (e) {
      console.log("restoreSession error", e);

      await clearTokens();
      setUser(null);
      setAccessToken(null);
    } finally {
      console.log("restoreSession finished");
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

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const result = await refreshAccessToken();

      if (result.accessToken) {
        const refresh = await getRefreshToken();

        await saveTokens(result.accessToken, refresh || "");

        setAccessToken(result.accessToken);

        return true;
      }

      return false;
    } catch (error) {
      console.error("refreshAuth failed:", error);

      await signOut();

      return false;
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
