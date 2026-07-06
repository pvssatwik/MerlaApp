require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { v4: uuid } = require("uuid");
const connection = require("../db/snowflake");

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
const storeOTP = (userId, otp, otpType) => {
  return new Promise((resolve, reject) => {
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
    connection.execute({
      sqlText: `
        UPDATE MERLAFARMS.APP_TRANSACTION.USER_OTP
        SET IS_USED = TRUE
        WHERE USER_ID = ? AND OTP_TYPE = ? AND IS_USED = FALSE
      `,
      binds: [userId, otpType],
      complete: (updateErr) => {
        if (updateErr)
          console.error("Invalidate OTP error:", updateErr.message);

        // Insert via SP — column names, not P_ prefix
        connection.execute({
          sqlText: `CALL MERLAFARMS.APP_TRANSACTION.SP_STORE_OTP(?,?,?,?,?,?,?)`,
          binds: [
            otpId, // OTP_ID
            userId, // USER_ID
            otp, // OTP_CODE
            otpType, // OTP_TYPE
            expiresAt, // EXPIRES_AT
            false, // IS_USED
            createdAt, // CREATED_AT
          ],
          complete: (err, stmt, rows) => {
            if (err) {
              console.error("SP_STORE_OTP error:", err.message);
              return reject(err);
            }
            console.log("SP_STORE_OTP result:", JSON.stringify(rows?.[0]));
            resolve(otpId);
          },
        });
      },
    });
  });
};

// ── Verify OTP from DB ────────────────────────────────
const verifyOTPFromDB = (userId, otp, otpType) => {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: `
        SELECT OTP_ID, EXPIRES_AT
        FROM MERLAFARMS.APP_TRANSACTION.USER_OTP
        WHERE USER_ID    = ?
        AND   OTP_CODE   = ?
        AND   OTP_TYPE   = ?
        AND   IS_USED    = FALSE
        AND   EXPIRES_AT > CURRENT_TIMESTAMP
        ORDER BY CREATED_AT DESC
        LIMIT 1
      `,
      binds: [userId, otp, otpType],
      complete: (err, stmt, rows) => {
        if (err) return reject(err);
        if (!rows || rows.length === 0) return resolve(null);

        // Mark as used
        connection.execute({
          sqlText: `
            UPDATE MERLAFARMS.APP_TRANSACTION.USER_OTP
            SET IS_USED = TRUE WHERE OTP_ID = ?
          `,
          binds: [rows[0].OTP_ID],
          complete: () => resolve(rows[0]),
        });
      },
    });
  });
};

// ── Store Session via SP ──────────────────────────────
const storeSession = (userId, refreshToken, deviceId, deviceName) => {
  return new Promise((resolve, reject) => {
    const sessionId = uuid();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    connection.execute({
      sqlText: `CALL MERLAFARMS.APP_TRANSACTION.SP_INSERT_USER_SESSION(?,?,?,?,?,?,?,?)`,
      binds: [
        sessionId, // SESSION_ID
        userId, // USER_ID
        refreshToken, // REFRESH_TOKEN
        deviceId || "UNKNOWN", // DEVICE_ID
        deviceName || "Mobile App", // DEVICE_NAME
        now, // LOGIN_TIME
        now, // LAST_ACTIVITY
        true, // IS_ACTIVE
      ],
      complete: (err, stmt, rows) => {
        if (err) {
          console.error("SP_INSERT_USER_SESSION error:", err.message);
          return reject(err);
        }
        console.log(
          "SP_INSERT_USER_SESSION result:",
          JSON.stringify(rows?.[0]),
        );
        resolve(sessionId);
      },
    });
  });
};

// ── Fetch user with shed assignment ───────────────────
const fetchUserWithShed = (userId) => {
  return new Promise((resolve, reject) => {
    connection.execute({
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
      complete: (err, stmt, rows) => {
        if (err) return reject(err);
        if (!rows || rows.length === 0) return resolve(null);
        resolve(rows[0]);
      },
    });
  });
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
  const base =
    (firstname?.[0] || "U").toUpperCase() +
    (lastname || "USER").replace(/\s/g, "").substring(0, 5).toUpperCase();

  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: `
        SELECT USERID FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
        WHERE USERID LIKE ?
        ORDER BY USERID DESC
      `,
      binds: [`${base}%`],
      complete: (err, stmt, rows) => {
        if (err) return reject(err);

        if (!rows || rows.length === 0) {
          return resolve(base); // no duplicates
        }

        // Find highest suffix number
        let maxSuffix = 0;
        rows.forEach((row) => {
          const existing = row.USERID;
          if (existing === base) {
            maxSuffix = Math.max(maxSuffix, 0);
          }
          const match = existing.match(new RegExp(`^${base}(\\d+)$`));
          if (match) {
            maxSuffix = Math.max(maxSuffix, parseInt(match[1]));
          }
        });

        const exactMatch = rows.some((r) => r.USERID === base);
        if (!exactMatch && maxSuffix === 0) {
          return resolve(base);
        }

        resolve(`${base}${maxSuffix + 1}`);
      },
    });
  });
};
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
  // ⚠️ Note: userid removed from required fields — now auto-generated

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

    connection.execute({
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
      complete: (err, stmt, rows) => {
        if (err) {
          console.error("SignUp SP error:", err.message);
          return res.status(500).json({ success: false, error: err.message });
        }
        const spResult = rows[0]["SP_CREATE_FARM_USER_SQL"];
        if (spResult && spResult.toUpperCase().includes("ERROR")) {
          return res.status(400).json({ success: false, error: spResult });
        }
        return res.json({
          success: true,
          message: `Registration successful. Your User ID is ${userid}. Awaiting admin approval.`,
          status: "PENDING",
          userid,
        });
      },
    });
  } catch (err) {
    console.error("SignUp error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// 2. LOGIN
// ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: "Email/phone and password are required",
    });
  }

  connection.execute({
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
    complete: async (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });

      if (!rows || rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: "No account found with this email or phone.",
        });
      }

      const user = rows[0];

      // Status checks
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

      // Verify password
      try {
        const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            error: "Incorrect password. Please try again.",
          });
        }
      } catch (bcryptErr) {
        return res
          .status(500)
          .json({ success: false, error: "Password verification failed" });
      }

      // Call SP_VALIDATE_FARM_USER
      connection.execute({
        sqlText: `CALL MERLAFARMS.APP_TRANSACTION.SP_VALIDATE_FARM_USER(?,?,?,?)`,
        binds: [
          user.USERID,
          user.USER_EMAIL,
          user.USER_CONTACT_NO,
          user.PASSWORD_HASH,
        ],
        complete: async (err2, stmt2, rows2) => {
          if (err2)
            return res
              .status(500)
              .json({ success: false, error: err2.message });

          const spResult = rows2[0]["SP_VALIDATE_FARM_USER"];
          console.log("Validate SP:", spResult);

          if (spResult && spResult.toUpperCase().includes("ERROR")) {
            return res.status(401).json({ success: false, error: spResult });
          }

          // Generate OTP
          const otp = generateOTP();
          console.log(`LOGIN OTP for ${user.USER_EMAIL}: ${otp}`);

          try {
            // Only store OTP in DB if bypass is OFF
            if (!isOtpBypassEnabled()) {
              await storeOTP(user.USERID, otp, "LOGIN");
            } else {
              console.log(
                `[OTP BYPASS] Skipping OTP store for user: ${user.USERID}`,
              );
            }

            // Send email (bypass skips email automatically)
            await sendOTPEmail(user.USER_EMAIL, otp, "Login Verification");

            return res.json({
              success: true,
              message: isOtpBypassEnabled()
                ? `Dev mode: use OTP ${getOtpBypassCode()}`
                : `OTP sent to ${user.USER_EMAIL || user.USER_CONTACT_NO}`,
              identifier: user.USER_EMAIL || user.USER_CONTACT_NO,
              userId: user.USERID,
            });
          } catch (otpErr) {
            console.error("OTP error:", otpErr.message);
            return res
              .status(500)
              .json({ success: false, error: "Failed to process OTP" });
          }
        },
      });
    },
  });
};

// ─────────────────────────────────────────────────────
// 3. VERIFY LOGIN OTP
// ─────────────────────────────────────────────────────
const verifyLoginOTP = async (req, res) => {
  const { userId, otp, device_id, device_name } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      error: "userId and OTP are required",
    });
  }

  try {
    // Check bypass first
    const isBypass = isBypassOtp(otp);

    if (!isBypass) {
      // Verify real OTP from DB
      const otpRecord = await verifyOTPFromDB(userId, otp, "LOGIN");
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          error: "Invalid or expired OTP. Please try again.",
        });
      }
    } else {
      console.log(`[OTP BYPASS] Login OTP verified for user: ${userId}`);
    }

    // Fetch user
    const user = await fetchUserWithShed(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Generate tokens
    const payload = buildPayload(user);
    const { accessToken, refreshToken } = generateTokens(payload);

    // Store session
    try {
      await storeSession(userId, refreshToken, device_id, device_name);
    } catch (sessErr) {
      console.error("Session store error:", sessErr.message);
      // Don't fail login if session store fails
    }

    return res.json({
      success: true,
      message: isBypass ? "Login successful (OTP bypass)" : "Login successful",
      accessToken,
      refreshToken,
      user: {
        userId: user.USERID,
        email: user.USER_EMAIL,
        farmName: user.FARM_NAME,
        firstname: user.USER_FIRSTNAME,
        lastname: user.USER_LASTNAME,
        role: user.ROLE_ID || "SUPERVISOR",
        sheds: user.SHED_NAME ? [user.SHED_NAME] : [],
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// 4. REFRESH TOKEN
// ─────────────────────────────────────────────────────
const refreshToken = (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ success: false, error: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    connection.execute({
      sqlText: `
        SELECT SESSION_ID, USER_ID
        FROM MERLAFARMS.APP_TRANSACTION.USER_SESSIONS
        WHERE REFRESH_TOKEN = ? AND IS_ACTIVE = TRUE
        LIMIT 1
      `,
      binds: [token],
      complete: async (err, stmt, rows) => {
        const hasSession = !err && rows && rows.length > 0;

        if (!hasSession) {
          console.warn(
            "Refresh: no active session row — allowing valid refresh JWT (re-login if this persists)",
          );
        }

        try {
          const user = await fetchUserWithShed(decoded.userId);
          if (!user) {
            return res
              .status(401)
              .json({ success: false, error: "User not found" });
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
            { expiresIn: process.env.JWT_ACCESS_EXPIRY },
          );

          if (hasSession) {
            connection.execute({
              sqlText: `
                UPDATE MERLAFARMS.APP_TRANSACTION.USER_SESSIONS
                SET LAST_ACTIVITY = CURRENT_TIMESTAMP
                WHERE REFRESH_TOKEN = ?
              `,
              binds: [token],
              complete: () => {},
            });
          } else {
            try {
              await storeSession(
                decoded.userId,
                token,
                "UNKNOWN",
                "Mobile App",
              );
            } catch (sessErr) {
              console.error("Refresh session re-store error:", sessErr.message);
            }
          }

          return res.json({ success: true, accessToken: newAccessToken });
        } catch (fetchErr) {
          return res
            .status(500)
            .json({ success: false, error: fetchErr.message });
        }
      },
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid refresh token. Please login again.",
    });
  }
};

// ─────────────────────────────────────────────────────
// 5. RESEND OTP
// ─────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  const { userId, otpType } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: "userId required" });
  }

  connection.execute({
    sqlText: `
      SELECT USER_EMAIL, USER_CONTACT_NO
      FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
      WHERE USERID = ?
    `,
    binds: [userId],
    complete: async (err, stmt, rows) => {
      if (err || !rows || rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const user = rows[0];
      const otp = generateOTP();
      const type = otpType || "LOGIN";

      console.log(`RESEND OTP for ${user.USER_EMAIL}: ${otp}`);

      try {
        // Only store if bypass is off
        if (!isOtpBypassEnabled()) {
          await storeOTP(userId, otp, type);
        }

        await sendOTPEmail(
          user.USER_EMAIL,
          otp,
          type === "LOGIN" ? "Login Verification" : "Password Reset",
        );

        return res.json({
          success: true,
          message: `New OTP sent to ${user.USER_EMAIL || user.USER_CONTACT_NO}`,
        });
      } catch (e) {
        console.error("Resend OTP error:", e.message);
        return res
          .status(500)
          .json({ success: false, error: "Failed to resend OTP" });
      }
    },
  });
};

// ─────────────────────────────────────────────────────
// 6. FORGOT PASSWORD
// ─────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res
      .status(400)
      .json({ success: false, error: "Email or phone required" });
  }

  connection.execute({
    sqlText: `
      SELECT USERID, USER_EMAIL, USER_CONTACT_NO
      FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
      WHERE USER_EMAIL = ? OR USER_CONTACT_NO = ?
      LIMIT 1
    `,
    binds: [identifier, identifier],
    complete: async (err, stmt, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No account found with this email or phone.",
        });
      }

      const user = rows[0];
      const otp = generateOTP();

      console.log(`FORGOT PASSWORD OTP for ${user.USER_EMAIL}: ${otp}`);

      try {
        if (!isOtpBypassEnabled()) {
          await storeOTP(user.USERID, otp, "FORGOT_PASSWORD");
        }

        await sendOTPEmail(user.USER_EMAIL, otp, "Password Reset");

        return res.json({
          success: true,
          message: isOtpBypassEnabled()
            ? `Dev mode: use OTP ${getOtpBypassCode()}`
            : `OTP sent to ${user.USER_EMAIL || user.USER_CONTACT_NO}`,
          userId: user.USERID,
          identifier: user.USER_EMAIL || user.USER_CONTACT_NO,
        });
      } catch (otpErr) {
        console.error("Forgot password error:", otpErr.message);
        return res
          .status(500)
          .json({ success: false, error: "Failed to generate OTP" });
      }
    },
  });
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
      return res
        .status(400)
        .json({ success: false, error: "Invalid reset token" });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    connection.execute({
      sqlText: `
        UPDATE MERLAFARMS.APP_TRANSACTION.FARM_USERS
        SET PASSWORD_HASH = ? WHERE USERID = ?
      `,
      binds: [password_hash, decoded.userId],
      complete: (err) => {
        if (err)
          return res.status(500).json({ success: false, error: err.message });
        return res.json({
          success: true,
          message: "Password reset successfully. Please login.",
        });
      },
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: "Reset token expired. Please start over.",
    });
  }
};

// ─────────────────────────────────────────────────────
// 9. LOGOUT
// ─────────────────────────────────────────────────────
const logout = (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ success: false, error: "Refresh token required" });
  }

  connection.execute({
    sqlText: `
      UPDATE MERLAFARMS.APP_TRANSACTION.USER_SESSIONS
      SET IS_ACTIVE = FALSE WHERE REFRESH_TOKEN = ?
    `,
    binds: [token],
    complete: (err) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      return res.json({ success: true, message: "Logged out successfully" });
    },
  });
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
};
