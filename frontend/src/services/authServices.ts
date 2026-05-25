import { API_BASE_URL, API_HEADERS } from "../config/api";

const post = async (url: string, body: any) => {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify(body),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Something went wrong");
  return result;
};

// Sign up
export const signUp = (data: {
  farm_name: string;
  userid: string;
  user_firstname: string;
  user_lastname: string;
  user_dob: string;
  user_email: string;
  user_contact_no: string;
  password: string;
  gov_id: string;
  requested_role: string;
}) => post("/api/auth/signup", data);

// Login
export const login = (data: { identifier: string; password: string }) =>
  post("/api/auth/login", data);

// Verify OTP
export const verifyOTP = (data: { identifier: string; otp: string }) =>
  post("/api/auth/verify-otp", data);

// Resend OTP
export const resendOTP = (identifier: string) =>
  post("/api/auth/resend-otp", { identifier });

// Forgot password
export const forgotPassword = (identifier: string) =>
  post("/api/auth/forgot-password", { identifier });

// Reset password
export const resetPassword = (data: {
  identifier: string;
  otp: string;
  new_password: string;
}) => post("/api/auth/reset-password", data);
