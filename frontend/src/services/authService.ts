import { API_BASE_URL, API_HEADERS } from "../config/apiConfig";
import {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  saveUser,
  getUser,
} from "./tokenStorage";

export {
  saveTokens,
  saveAccessToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  saveUser,
  getUser,
} from "./tokenStorage";

const post = async (url: string, body: any, token?: string) => {
  const headers: any = { ...API_HEADERS };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE_URL}${url}`;

  console.log("══════════════════════════════");
  console.log("📡 POST REQUEST");
  console.log("📍 URL:", fullUrl);
  console.log("══════════════════════════════");

  let res: Response;

  try {
    res = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    console.log("✅ RESPONSE RECEIVED");
    console.log("📊 STATUS:", res.status);
  } catch (networkErr: any) {
    console.log("════════ NETWORK ERROR ════════");
    console.log("❌ ERROR:", networkErr);
    console.log("❌ MESSAGE:", networkErr?.message);
    console.log("❌ URL:", fullUrl);
    console.log("═══════════════════════════════");

    const msg = networkErr?.message || "";

    if (msg.includes("Network request failed")) {
      throw new Error(
        "Cannot reach server. Check your internet connection and try again.",
      );
    }

    throw new Error(`Connection error: ${msg || "Unknown error"}`);
  }

  let result: any;

  try {
    result = await res.json();
    console.log("📦 RESPONSE:", result);
  } catch (jsonError: any) {
    console.log("❌ JSON PARSE ERROR:", jsonError);

    throw new Error(`Server returned invalid response (${res.status}).`);
  }

  if (!res.ok || result.success === false) {
    console.log("❌ SERVER ERROR RESPONSE:", result);

    throw new Error(
      result.error || result.message || `Request failed (${res.status})`,
    );
  }

  return result;
};

// ── GET helper ────────────────────────────────────────
const get = async (url: string, token?: string) => {
  const headers: any = { ...API_HEADERS };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE_URL}${url}`;

  console.log("══════════════════════════════");
  console.log("📡 GET REQUEST");
  console.log("📍 URL:", fullUrl);
  console.log("══════════════════════════════");

  let res: Response;

  try {
    res = await fetch(fullUrl, {
      method: "GET",
      headers,
    });

    console.log("✅ RESPONSE RECEIVED");
    console.log("📊 STATUS:", res.status);
  } catch (networkErr: any) {
    console.log("════════ NETWORK ERROR ════════");
    console.log("❌ ERROR:", networkErr);
    console.log("❌ MESSAGE:", networkErr?.message);
    console.log("❌ URL:", fullUrl);
    console.log("═══════════════════════════════");

    const msg = networkErr?.message || "";

    throw new Error(`Connection error: ${msg || "Unknown error"}`);
  }

  let result: any;

  try {
    result = await res.json();
    console.log("📦 RESPONSE:", result);
  } catch (jsonError) {
    console.log("❌ JSON PARSE ERROR:", jsonError);

    throw new Error(`Server returned invalid response (${res.status}).`);
  }

  if (!res.ok || result.success === false) {
    throw new Error(
      result.error || result.message || `Request failed (${res.status})`,
    );
  }

  return result;
};

export const signUp = (data: {
  farm_name: string;
  user_firstname: string;
  user_lastname: string;
  user_dob: string;
  user_email: string;
  user_contact_no: string;
  password: string;
  gov_id: string;
  requested_role?: string;
}) => post("/api/auth/signup", data);

export const login = (data: { identifier: string; password: string }) =>
  post("/api/auth/login", data);

export const verifyLoginOTP = (data: {
  userId: string;
  otp: string;
  device_id?: string;
  device_name?: string;
}) => post("/api/auth/login/verify-otp", data);

export const resendOTP = (data: { userId: string; otpType: string }) =>
  post("/api/auth/resend-otp", data);

export const forgotPassword = (identifier: string) =>
  post("/api/auth/forgot-password", { identifier });

export const verifyForgotOTP = (data: { userId: string; otp: string }) =>
  post("/api/auth/verify-forgot-otp", data);

export const resetPassword = (data: {
  resetToken: string;
  new_password: string;
}) => post("/api/auth/reset-password", data);

export const refreshAccessToken = async () => {
  const token = await getRefreshToken();
  if (!token) throw new Error("No refresh token");
  return post("/api/auth/refresh-token", { refreshToken: token });
};

export const logout = async () => {
  const token = await getRefreshToken();
  const accessToken = await getAccessToken();
  if (token) {
    try {
      await post(
        "/api/auth/logout",
        { refreshToken: token },
        accessToken || undefined,
      );
    } catch (e) {
      console.error("Logout error:", e);
    }
  }
  await clearTokens();
};
