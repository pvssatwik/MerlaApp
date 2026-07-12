const express = require("express");
const router = express.Router();
const {
  signUp,
  login,
  verifyLoginOTP,
  refreshToken,
  resendOTP,
  forgotPassword,
  verifyForgotOTP,
  resetPassword,
  logout,
  checkEmail,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

router.post("/signup", signUp);
router.post("/login", login);
router.post("/login/verify-otp", verifyLoginOTP);
router.post("/refresh-token", refreshToken);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-otp", verifyForgotOTP);
router.post("/reset-password", resetPassword);
router.post("/logout", verifyToken, logout);
router.get('/check-email', checkEmail);

module.exports = router;
