export const getFriendlyMessage = (
  rawMessage: string,
  type: "success" | "error",
): string => {
  if (type === "success") {
    const successMap: Record<string, string> = {
      "Row inserted": "Entry saved successfully! ✅",
      "inserted successfully": "Data recorded successfully! ✅",
      approved: "User approved successfully! ✅",
      rejected: "User request rejected.",
      "reset successfully": "Password changed successfully! ✅",
      "logged out": "You have been signed out.",
      "OTP sent": "OTP sent to your email and phone.",
      "Login successful": "Welcome back! 🎉",
    };
    for (const [key, msg] of Object.entries(successMap)) {
      if (rawMessage.toLowerCase().includes(key.toLowerCase())) return msg;
    }
    return rawMessage;
  }

  if (type === "error") {
    const errorMap: Record<string, string> = {
      "incorrect password": "Wrong password. Please try again.",
      "not found": "Account not found. Check your email or phone.",
      pending: "Your account is waiting for admin approval.",
      "not active": "Account is not active. Contact your admin.",
      blocked: "Your account has been blocked. Contact admin.",
      "invalid or expired otp":
        "OTP is incorrect or expired. Please try again.",
      network: "Connection failed. Check your internet.",
      "token expired": "Session expired. Please login again.",
      unauthorized: "You are not authorized. Please login again.",
      "access denied": "You do not have permission for this action.",
      required: "Please fill in all required fields.",
    };
    for (const [key, msg] of Object.entries(errorMap)) {
      if (rawMessage.toLowerCase().includes(key.toLowerCase())) return msg;
    }
    return rawMessage || "Something went wrong. Please try again.";
  }

  return rawMessage;
};
