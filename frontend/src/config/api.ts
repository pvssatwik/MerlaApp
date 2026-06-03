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

export const authFetch = async (url: string, options: any = {}) => {
  let token = await getAccessToken();

  const makeRequest = async (accessToken: string | null) => {
    const headers: Record<string, string> = {
      ...API_HEADERS,
      ...options.headers,
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });
  };

  let res = await makeRequest(token);

  if (res.status === 401) {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ refreshToken }),
      });
      const refreshResult = await refreshRes.json();
      if (!refreshRes.ok) throw new Error(refreshResult.error);

      await saveAccessToken(refreshResult.accessToken);
      onAccessTokenRefreshed?.(refreshResult.accessToken);
      token = refreshResult.accessToken;
      res = await makeRequest(token);
    } catch {
      await clearTokens();
      onSessionExpired?.();
      throw new Error("Session expired. Please login again.");
    }
  }

  return res;
};

export const authGet = async (url: string) => {
  const res = await authFetch(url, { method: "GET" });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Request failed");
  return result;
};

export const authPost = async (url: string, body: Record<string, unknown>) => {
  const res = await authFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Request failed");
  return result;
};
