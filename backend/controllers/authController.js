require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { v4: uuid } = require("uuid");
const { execute } = require("../db/snowflake");

// ── OTP BYPASS ────────────────────────────────────────
const isOtpBypassEnabled = () =>
  process.env.OTP_BYPASS === "true" || process.env.OTP_BYPASS === "1";
const getOtpBypassCode = () => process.env.OTP_BYPASS_CODE || "123456";
const isBypassOtp = (otp) => isOtpBypassEnabled() && otp === getOtpBypassCode();

if (isOtpBypassEnabled()) {
  console.warn(`⚠️  OTP_BYPASS enabled — Use OTP: ${getOtpBypassCode()}`);
}

// ── Email transporter ─────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Generate OTP ──────────────────────────────────────
const generateOTP = () =>
  isOtpBypassEnabled()
    ? getOtpBypassCode()
    : Math.floor(100000 + Math.random() * 900000).toString();

// ── Send OTP Email ────────────────────────────────────
const sendOTPEmail = async (email, otp, purpose = "Login") => {
  if (isOtpBypassEnabled()) {
    console.log(
      `[OTP BYPASS] ${purpose} for ${email} — code: ${getOtpBypassCode()}`,
    );
    return;
  }
  await transporter.sendMail({
    from: `"Merla Farms" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Merla Farms - OTP for ${purpose}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
        <h2 style="color:#1e3a5f;">🐔 Merla Farms</h2>
        <p>Your OTP for <strong>${purpose}</strong>:</p>
        <h1 style="letter-spacing:12px;color:#2563eb;">${otp}</h1>
        <p>Expires in <strong>${process.env.OTP_EXPIRY_MINS} minutes</strong>.</p>
      </div>
    `,
  });
};

// ── Send SMS OTP via Fast2SMS (OTP route — no DLT needed) ──
const sendSMSOTP = async (phone, otp) => {
  if (isOtpBypassEnabled()) {
    console.log(
      `[OTP BYPASS] SMS skipped for ${phone} — use code: ${getOtpBypassCode()}`,
    );
    return { success: true, bypass: true };
  }

  // Clean phone number — remove +91, spaces, etc
  const cleanPhone = phone.replace(/\D/g, "").replace(/^91/, "").slice(-10);

  if (cleanPhone.length !== 10) {
    console.error(`Invalid phone number: ${phone}`);
    return { success: false, error: "Invalid phone number" };
  }
  console.log("FAST2SMS_API_KEY:", process.env.FAST2SMS_API_KEY);

  try {
    const axios = require("axios");
    const response = await axios({
      method: "POST",
      url: "https://www.fast2sms.com/dev/bulkV2",
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      data: {
        route: "otp", // ← OTP route, no DLT needed
        variables_values: otp, // ← the OTP code
        numbers: cleanPhone, // ← 10-digit phone
      },
    });
    console.log("FAST2SMS_API_KEY:", process.env.FAST2SMS_API_KEY);
    console.log(`✅ SMS OTP sent to ${cleanPhone}:`, response.data);
    return { success: true, data: response.data };
  } catch (err) {
    const errMsg = err.response?.data?.message || err.message;
    console.error(`❌ SMS OTP failed for ${cleanPhone}:`, errMsg);
    return { success: false, error: errMsg };
  }
};

// ── Send OTP via both Email AND SMS ──────────────────
const sendOTP = async (email, phone, otp, purpose = "Login") => {
  const results = { email: null, sms: null };

  // Send email OTP
  if (email) {
    try {
      await sendOTPEmail(email, otp, purpose);
      results.email = "sent";
      console.log(`✅ Email OTP sent to ${email}`);
    } catch (emailErr) {
      console.error(`❌ Email OTP failed: ${emailErr.message}`);
      results.email = "failed";
    }
  }

  // Send SMS OTP
  if (phone) {
    const smsResult = await sendSMSOTP(phone, otp);
    results.sms = smsResult.success ? "sent" : "failed";
  }

  return results;
};

// ── Generate JWT Tokens ───────────────────────────────
const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY,
  });
  const refreshToken = jwt.sign(
    { userId: payload.userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY },
  );
  return { accessToken, refreshToken };
};

// ── Store OTP via SP ──────────────────────────────────
const storeOTP = async (userId, otp, otpType) => {
  const otpId = uuid();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + parseInt(process.env.OTP_EXPIRY_MINS) * 60 * 1000,
  )
    .toISOString()
    .replace("T", " ")
    .replace("Z", "");
  const createdAt = now.toISOString().replace("T", " ").replace("Z", "");

  // Invalidate old OTPs
  try {
    await execute({
      sqlText: `UPDATE MERLAFARMS.APP_TRANSACTION.USER_OTP SET IS_USED = TRUE WHERE USER_ID = ? AND OTP_TYPE = ? AND IS_USED = FALSE`,
      binds: [userId, otpType],
    });
  } catch (e) {
    console.warn("Invalidate OTP warning:", e.message);
  }

  await execute({
    sqlText: `CALL MERLAFARMS.APP_TRANSACTION.SP_STORE_OTP(?,?,?,?,?,?,?)`,
    binds: [otpId, userId, otp, otpType, expiresAt, false, createdAt],
  });

  return otpId;
};

const storeSession = async (userId, refreshToken, deviceId, deviceName) => {
  const sessionId = uuid();
  const now = new Date().toISOString().replace("T", " ").replace("Z", "");

  await execute({
    sqlText: `CALL MERLAFARMS.APP_TRANSACTION.SP_INSERT_USER_SESSION(?,?,?,?,?,?,?,?)`,
    binds: [
      sessionId,
      userId,
      refreshToken,
      deviceId || "UNKNOWN",
      deviceName || "Mobile App",
      now,
      now,
      true,
    ],
  });

  return sessionId;
};

const verifyOTPFromDB = async (userId, otp, otpType) => {
  const { rows } = await execute({
    sqlText: `
      SELECT OTP_ID, EXPIRES_AT
      FROM MERLAFARMS.APP_TRANSACTION.USER_OTP
      WHERE USER_ID = ? AND OTP_CODE = ? AND OTP_TYPE = ?
      AND IS_USED = FALSE AND EXPIRES_AT > CURRENT_TIMESTAMP
      ORDER BY CREATED_AT DESC LIMIT 1
    `,
    binds: [userId, otp, otpType],
  });

  if (!rows || rows.length === 0) return null;

  await execute({
    sqlText: `UPDATE MERLAFARMS.APP_TRANSACTION.USER_OTP SET IS_USED = TRUE WHERE OTP_ID = ?`,
    binds: [rows[0].OTP_ID],
  });

  return rows[0];
};

// ── Fetch user with shed assignment ───────────────────
const fetchUserWithShed = async (userId) => {
  const { rows } = await execute({
    sqlText: `
      SELECT
        FU.USERID,
        FU.USER_EMAIL,
        FU.USER_CONTACT_NO,
        FU.FARM_NAME,
        FU.USER_FIRSTNAME,
        FU.USER_LASTNAME,
        USA.ROLE_ID,
        RM.ROLE_NAME,
        USA.SHED_NAME,
        USA.ASSIGNMENT_END_DATE
      FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS FU
      LEFT JOIN MERLAFARMS.APP_TRANSACTION.USER_SHED_ASSIGNMENT USA
        ON FU.USERID = USA.USERID
      LEFT JOIN MERLAFARMS.APP_TRANSACTION.FARM_ROLE_MASTER RM
        ON USA.ROLE_ID = RM.ROLE_ID
        AND FU.FARM_NAME = RM.FARM_NAME
      WHERE FU.USERID = ?
      LIMIT 1
    `,
    binds: [userId],
  });

  return rows.length ? rows[0] : null;
};

// ── Build JWT payload from user row ──────────────────
const buildPayload = (user) => {
  const roleName = user.ROLE_NAME || String(user.ROLE_ID) || "SUPERVISOR";
  return {
    userId: user.USERID,
    email: user.USER_EMAIL,
    farmName: user.FARM_NAME,
    firstname: user.USER_FIRSTNAME,
    lastname: user.USER_LASTNAME,
    role: roleName,
    sheds: user.SHED_NAME ? [user.SHED_NAME] : [],
  };
};

const generateUserId = async (firstname, lastname) => {
  // Take first letter of firstname + ALL letters of lastname
  const firstPart = (firstname?.[0] || "U").toUpperCase();
  const secondPart = (lastname || "USER")
    .replace(/\s/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();

  const base = firstPart + secondPart;

  const { rows } = await execute({
    sqlText: `
      SELECT USERID
      FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
      WHERE USERID LIKE ?
      ORDER BY USERID
    `,
    binds: [`${base}%`],
  });

  if (!rows || rows.length === 0) {
    return base;
  }

  // Check if exact base exists
  const exactMatch = rows.some((r) => r.USERID === base);
  if (!exactMatch) {
    return base;
  }

  // Find highest numeric suffix
  let maxSuffix = 0;

  rows.forEach((row) => {
    const match = row.USERID.match(new RegExp(`^${base}(\\d+)$`));
    if (match) {
      maxSuffix = Math.max(maxSuffix, parseInt(match[1], 10));
    }
  });

  return `${base}${maxSuffix + 1}`;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
const isValidPhone = (value) => {
  const normalized = (value || "").replace(/\D/g, "");
  return /^\d{10,}$/.test(normalized);
};
const isValidIdentifier = (value) => isValidEmail(value) || isValidPhone(value);
const isValidPassword = (value) => (value || "").length >= 6;
// ─────────────────────────────────────────────────────
// 1. SIGN UP
// ─────────────────────────────────────────────────────

const signUp = async (req, res) => {
  const {
    farm_name,
    user_firstname,
    user_lastname,
    user_dob,
    user_email,
    user_contact_no,
    password,
    gov_id,
  } = req.body;

  if (
    !user_firstname ||
    !user_lastname ||
    !user_email ||
    !user_contact_no ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      error:
        "First name, last name, email, contact number and password are required",
    });
  }

  try {
    const userid = await generateUserId(user_firstname, user_lastname);
    console.log("Generated userid:", userid);

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.APP_TRANSACTION.SP_CREATE_FARM_USER_SQL(?,?,?,?,?,?,?,?,?)`,
      binds: [
        farm_name || "MERLA_FARMS",
        userid,
        user_firstname,
        user_lastname,
        user_dob || null,
        user_email,
        user_contact_no,
        password_hash,
        gov_id || "",
      ],
    });

    const spResult = rows[0]["SP_CREATE_FARM_USER_SQL"];

    if (spResult && spResult.toUpperCase().includes("ERROR")) {
      return res.status(400).json({
        success: false,
        error: spResult,
      });
    }

    return res.json({
      success: true,
      message: `Registration successful. Your User ID is ${userid}. Awaiting admin approval.`,
      status: "PENDING",
      userid,
    });
  } catch (err) {
    console.error("SignUp error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── Check if email exists ─────────────────────────────
const checkEmail = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email required",
    });
  }

  try {
    const { rows } = await execute({
      sqlText: `
        SELECT COUNT(*) AS COUNT
        FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
        WHERE USER_EMAIL = ?
      `,
      binds: [email],
    });

    const exists = rows[0].COUNT > 0;

    return res.json({
      success: true,
      exists,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
// ─────────────────────────────────────────────────────
// 2. LOGIN
// ─────────────────────────────────────────────────────
// authController.js - full updated login function:
const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: "Email/phone and password are required",
    });
  }

  try {
    // Fetch user
    const { rows: userRows } = await execute({
      sqlText: `
        SELECT
          FU.USERID, FU.USER_EMAIL, FU.USER_CONTACT_NO,
          FU.PASSWORD_HASH, FU.STATUS, FU.FARM_NAME,
          FU.USER_FIRSTNAME, FU.USER_LASTNAME,
          USA.ROLE_ID, RM.ROLE_NAME, USA.SHED_NAME
        FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS FU
        LEFT JOIN MERLAFARMS.APP_TRANSACTION.USER_SHED_ASSIGNMENT USA
          ON FU.USERID = USA.USERID
        LEFT JOIN MERLAFARMS.APP_TRANSACTION.FARM_ROLE_MASTER RM
          ON CAST(USA.ROLE_ID AS VARCHAR) = CAST(RM.ROLE_ID AS VARCHAR)
          AND FU.FARM_NAME = RM.FARM_NAME
        WHERE FU.USER_EMAIL = ? OR FU.USER_CONTACT_NO = ?
        LIMIT 1
      `,
      binds: [identifier, identifier],
    });

    if (!userRows || userRows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "No account found with this email or phone.",
      });
    }

    const user = userRows[0];

    if (user.STATUS === "PENDING") {
      return res.status(403).json({
        success: false,
        error: "Your account is pending admin approval.",
        status: "PENDING",
      });
    }

    if (["REJECTED", "BLOCKED", "INACTIVE"].includes(user.STATUS)) {
      return res.status(403).json({
        success: false,
        error: "Your account is not active. Contact admin.",
        status: user.STATUS,
      });
    }

    if (!["ACTIVE", "APPROVED"].includes(user.STATUS)) {
      return res.status(403).json({
        success: false,
        error: "Account not active. Contact admin.",
        status: user.STATUS,
      });
    }

    const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Incorrect password." });
    }

    // Validate via SP
    const { rows: validateRows } = await execute({
      sqlText: `CALL MERLAFARMS.APP_TRANSACTION.SP_VALIDATE_FARM_USER(?,?,?,?)`,
      binds: [
        user.USERID,
        user.USER_EMAIL,
        user.USER_CONTACT_NO,
        user.PASSWORD_HASH,
      ],
    });

    const spResult = validateRows[0]["SP_VALIDATE_FARM_USER"];
    if (spResult && spResult.toUpperCase().includes("ERROR")) {
      return res.status(401).json({ success: false, error: spResult });
    }

    const otp = generateOTP();
    console.log(`LOGIN OTP for ${user.USER_EMAIL}: ${otp}`);

    if (!isOtpBypassEnabled()) {
      await storeOTP(user.USERID, otp, "LOGIN");
    }

    await sendOTP(
      user.USER_EMAIL,
      user.USER_CONTACT_NO,
      otp,
      "Login Verification",
    );

    return res.json({
      success: true,
      message: isOtpBypassEnabled()
        ? `Dev mode: use OTP ${getOtpBypassCode()}`
        : `OTP sent to ${user.USER_EMAIL}`,
      identifier: user.USER_EMAIL || user.USER_CONTACT_NO || "",
      userId: user.USERID,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// 3. VERIFY LOGIN OTP
// ─────────────────────────────────────────────────────
const verifyLoginOTP = async (req, res) => {
  const { userId, otp, device_id, device_name } = req.body;

  if (!userId || !otp) {
    return res
      .status(400)
      .json({ success: false, error: "userId and OTP required" });
  }

  try {
    const isBypass = isBypassOtp(otp);

    if (!isBypass) {
      const otpRecord = await verifyOTPFromDB(userId, otp, "LOGIN");
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          error: "Invalid or expired OTP. Please try again.",
        });
      }
    } else {
      console.log(`[OTP BYPASS] Login verified for: ${userId}`);
    }

    // Fetch user with role
    const { rows } = await execute({
      sqlText: `
        SELECT
          FU.USERID, FU.USER_EMAIL, FU.USER_CONTACT_NO,
          FU.FARM_NAME, FU.USER_FIRSTNAME, FU.USER_LASTNAME,
          USA.ROLE_ID, RM.ROLE_NAME, USA.SHED_NAME
        FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS FU
        LEFT JOIN MERLAFARMS.APP_TRANSACTION.USER_SHED_ASSIGNMENT USA
          ON FU.USERID = USA.USERID
        LEFT JOIN MERLAFARMS.APP_TRANSACTION.FARM_ROLE_MASTER RM
          ON CAST(USA.ROLE_ID AS VARCHAR) = CAST(RM.ROLE_ID AS VARCHAR)
          AND FU.FARM_NAME = RM.FARM_NAME
        WHERE FU.USERID = ?
        LIMIT 1
      `,
      binds: [userId],
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = rows[0];
    const payload = buildPayload(user);

    console.log("JWT payload:", JSON.stringify(payload)); // debug

    const { accessToken, refreshToken } = generateTokens(payload);

    if (!accessToken || !refreshToken) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to generate tokens" });
    }

    // Store session
    try {
      await storeSession(userId, refreshToken, device_id, device_name);
    } catch (sessErr) {
      console.error("Session store error (non-fatal):", sessErr.message);
    }

    const responseUser = {
      userId: user.USERID || "",
      email: user.USER_EMAIL || "",
      farmName: user.FARM_NAME || "",
      firstname: user.USER_FIRSTNAME || "",
      lastname: user.USER_LASTNAME || "",
      role: user.ROLE_NAME || String(user.ROLE_ID) || "SUPERVISOR",
      sheds: user.SHED_NAME ? [user.SHED_NAME] : [],
    };

    console.log("Sending response user:", JSON.stringify(responseUser)); // debug

    return res.json({
      success: true,
      message: "Login successful",
      accessToken: String(accessToken),
      refreshToken: String(refreshToken),
      user: responseUser,
    });
  } catch (err) {
    console.error("verifyLoginOTP error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// 4. REFRESH TOKEN
// ─────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const { rows } = await execute({
      sqlText: `
        SELECT SESSION_ID, USER_ID
        FROM MERLAFARMS.APP_TRANSACTION.USER_SESSIONS
        WHERE REFRESH_TOKEN = ? AND IS_ACTIVE = TRUE
        LIMIT 1
      `,
      binds: [token],
    });

    const hasSession = rows && rows.length > 0;

    if (!hasSession) {
      console.warn(
        "Refresh: no active session row — allowing valid refresh JWT (re-login if this persists)",
      );
    }

    const user = await fetchUserWithShed(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.STATUS !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "Account not active. Please login again.",
      });
    }

    const newAccessToken = jwt.sign(
      buildPayload(user),
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRY,
      },
    );

    if (hasSession) {
      await execute({
        sqlText: `
          UPDATE MERLAFARMS.APP_TRANSACTION.USER_SESSIONS
          SET LAST_ACTIVITY = CURRENT_TIMESTAMP
          WHERE REFRESH_TOKEN = ?
        `,
        binds: [token],
      });
    } else {
      try {
        await storeSession(decoded.userId, token, "UNKNOWN", "Mobile App");
      } catch (sessErr) {
        console.error("Refresh session re-store error:", sessErr.message);
      }
    }

    return res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error:
        err.name === "JsonWebTokenError" || err.name === "TokenExpiredError"
          ? "Invalid refresh token. Please login again."
          : err.message,
    });
  }
};

// ─────────────────────────────────────────────────────
// 5. RESEND OTP
// ─────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  const { userId, otpType } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "userId required",
    });
  }

  try {
    const { rows } = await execute({
      sqlText: `
        SELECT USER_EMAIL, USER_CONTACT_NO
        FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
        WHERE USERID = ?
      `,
      binds: [userId],
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = rows[0];
    const otp = generateOTP();
    const type = otpType || "LOGIN";

    console.log(`RESEND OTP for ${user.USER_EMAIL}: ${otp}`);

    // Only store if bypass is off
    if (!isOtpBypassEnabled()) {
      await storeOTP(userId, otp, type);
    }

    await sendOTP(user.USER_EMAIL, user.USER_CONTACT_NO, otp, "Password Reset");

    return res.json({
      success: true,
      message: `New OTP sent to ${user.USER_EMAIL || user.USER_CONTACT_NO}`,
    });
  } catch (err) {
    console.error("Resend OTP error:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────────────
// 6. FORGOT PASSWORD
// ─────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "Email or phone required",
    });
  }

  try {
    const { rows } = await execute({
      sqlText: `
        SELECT USERID, USER_EMAIL, USER_CONTACT_NO
        FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
        WHERE USER_EMAIL = ? OR USER_CONTACT_NO = ?
        LIMIT 1
      `,
      binds: [identifier, identifier],
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No account found with this email or phone.",
      });
    }

    const user = rows[0];
    const otp = generateOTP();

    console.log(`FORGOT PASSWORD OTP for ${user.USER_EMAIL}: ${otp}`);

    if (!isOtpBypassEnabled()) {
      await storeOTP(user.USERID, otp, "FORGOT_PASSWORD");
    }

    await sendOTP(user.USER_EMAIL, user.USER_CONTACT_NO, otp, "Password Reset");

    return res.json({
      success: true,
      message: isOtpBypassEnabled()
        ? `Dev mode: use OTP ${getOtpBypassCode()}`
        : `OTP sent to ${user.USER_EMAIL || user.USER_CONTACT_NO}`,
      userId: user.USERID,
      identifier: user.USER_EMAIL || user.USER_CONTACT_NO,
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);

    return res.status(500).json({
      success: false,
      error: "Failed to generate OTP",
    });
  }
};

// ─────────────────────────────────────────────────────
// 7. VERIFY FORGOT PASSWORD OTP
// ─────────────────────────────────────────────────────
const verifyForgotOTP = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res
      .status(400)
      .json({ success: false, error: "userId and OTP required" });
  }

  try {
    if (!isBypassOtp(otp)) {
      const otpRecord = await verifyOTPFromDB(userId, otp, "FORGOT_PASSWORD");
      if (!otpRecord) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid or expired OTP." });
      }
    } else {
      console.log(`[OTP BYPASS] Forgot password verified for user: ${userId}`);
    }

    const resetToken = jwt.sign(
      { userId, purpose: "password_reset" },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "10m" },
    );

    return res.json({
      success: true,
      message: "OTP verified. You can now reset your password.",
      resetToken,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// 8. RESET PASSWORD
// ─────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { resetToken, new_password } = req.body;

  if (!resetToken || !new_password) {
    return res.status(400).json({
      success: false,
      error: "Reset token and new password are required",
    });
  }

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_ACCESS_SECRET);

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({
        success: false,
        error: "Invalid reset token",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await execute({
      sqlText: `
        UPDATE MERLAFARMS.APP_TRANSACTION.FARM_USERS
        SET PASSWORD_HASH = ?
        WHERE USERID = ?
      `,
      binds: [password_hash, decoded.userId],
    });

    return res.json({
      success: true,
      message: "Password reset successfully. Please login.",
    });
  } catch (err) {
    console.error("Reset password error:", err.message);

    return res.status(400).json({
      success: false,
      error: "Reset token expired. Please start over.",
    });
  }
};

// ─────────────────────────────────────────────────────
// 9. LOGOUT
// ─────────────────────────────────────────────────────
const logout = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Refresh token required",
    });
  }

  try {
    await execute({
      sqlText: `
        UPDATE MERLAFARMS.APP_TRANSACTION.USER_SESSIONS
        SET IS_ACTIVE = FALSE
        WHERE REFRESH_TOKEN = ?
      `,
      binds: [token],
    });

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
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
};
