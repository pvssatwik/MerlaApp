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
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Something went wrong");
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
