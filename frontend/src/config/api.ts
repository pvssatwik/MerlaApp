import { API_BASE_URL, API_HEADERS } from "./apiConfig";
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  saveAccessToken,
} from "../services/tokenStorage";

export { API_BASE_URL, API_HEADERS } from "./apiConfig";

let onAccessTokenRefreshed: ((token: string) => void) | null = null;
let onSessionExpired: (() => void) | null = null;

export const setAccessTokenRefreshedHandler = (
  handler: ((token: string) => void) | null,
) => {
  onAccessTokenRefreshed = handler;
};

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

// ── Safe Fetch ─────────────────────────────────────────
const safeFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  try {
    console.log("🌐 API Request:", url);

    const response = await fetch(url, options);

    console.log("📡 API Response:", response.status, url);
    console.log("🌐 BASE URL:", API_BASE_URL); /// remove in prod

    return response;
  } catch (error: any) {
    console.error("❌ Network Error:", {
      url,
      message: error?.message,
      name: error?.name,
    });

    throw new Error(
      "Cannot reach server. Please check your internet connection and try again.",
    );
  }
};

// ── Authenticated Fetch ─────────────────────────────────
export const authFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  let token = await getAccessToken();

  const makeRequest = async (accessToken: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      ...API_HEADERS,
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return safeFetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });
  };

  // ── First request ────────────────────────────────────
  let res = await makeRequest(token);

  // ── Access token expired ─────────────────────────────
  if (res.status === 401) {
    try {
      console.log("🔄 Access token expired. Refreshing...");

      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const refreshRes = await safeFetch(
        `${API_BASE_URL}/api/auth/refresh-token`,
        {
          method: "POST",
          headers: API_HEADERS,
          body: JSON.stringify({ refreshToken }),
        },
      );

      let refreshResult: any;

      try {
        refreshResult = await refreshRes.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!refreshRes.ok || !refreshResult.accessToken) {
        throw new Error(refreshResult?.error || "Failed to refresh session");
      }

      // Save new token
      await saveAccessToken(refreshResult.accessToken);

      // Notify app
      onAccessTokenRefreshed?.(refreshResult.accessToken);

      console.log("✅ Access token refreshed");

      token = refreshResult.accessToken;

      // Retry original request
      res = await makeRequest(token);
    } catch (error: any) {
      console.error("❌ Token refresh failed:", error?.message);

      // Important:
      // Don't automatically logout if the problem was just network connectivity
      if (error?.message?.includes("Cannot reach server")) {
        throw error;
      }

      await clearTokens();
      onSessionExpired?.();

      throw new Error("Session expired. Please login again.");
    }
  }

  return res;
};

// ── GET Request ─────────────────────────────────────────
export const authGet = async (url: string) => {
  const res = await authFetch(url, {
    method: "GET",
  });

  let result: any;

  try {
    result = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (${res.status}).`);
  }

  if (!res.ok || result?.success === false) {
    throw new Error(result?.error || `Request failed (${res.status})`);
  }

  return result;
};

// ── POST Request ────────────────────────────────────────
export const authPost = async (url: string, body: Record<string, unknown>) => {
  const res = await authFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  let result: any;

  try {
    result = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (${res.status}).`);
  }

  if (!res.ok || result?.success === false) {
    throw new Error(result?.error || `Request failed (${res.status})`);
  }

  return result;
};
