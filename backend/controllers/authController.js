require('dotenv').config();
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const nodemailer  = require('nodemailer');
const connection  = require('../db/snowflake');

// ── In-memory OTP store (use Redis in production) ─────
const otpStore = {};

// ── Dev/testing OTP bypass (set OTP_BYPASS=false in production) ──
const isOtpBypassEnabled = () =>
  process.env.OTP_BYPASS === 'true' || process.env.OTP_BYPASS === '1';

const getOtpBypassCode = () => process.env.OTP_BYPASS_CODE || '123456';

const isBypassOtp = (otp) => isOtpBypassEnabled() && otp === getOtpBypassCode();

if (isOtpBypassEnabled()) {
  console.warn(
    `⚠️  OTP_BYPASS enabled — emails skipped. Use OTP: ${getOtpBypassCode()}`
  );
}

// ── Email transporter ─────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Generate 6-digit OTP ──────────────────────────────
const generateOTP = () =>
  isOtpBypassEnabled()
    ? getOtpBypassCode()
    : Math.floor(100000 + Math.random() * 900000).toString();

const fetchUserByIdentifier = (identifier, complete) => {
  connection.execute({
    sqlText: `
      SELECT USERID, USER_EMAIL, USER_CONTACT_NO, FARM_NAME,
             USER_FIRSTNAME, USER_LASTNAME
      FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
      WHERE USER_EMAIL = ? OR USER_CONTACT_NO = ?
      LIMIT 1
    `,
    binds: [identifier, identifier],
    complete: (err, stmt, rows) => {
      if (err || !rows || rows.length === 0) {
        return complete(err || new Error('User not found'), null);
      }
      const u = rows[0];
      complete(null, {
        userid:    u.USERID,
        email:     u.USER_EMAIL,
        contact:   u.USER_CONTACT_NO,
        farm_name: u.FARM_NAME,
        firstname: u.USER_FIRSTNAME,
        lastname:  u.USER_LASTNAME,
      });
    },
  });
};

// ── Send OTP email ────────────────────────────────────
const sendOTPEmail = async (email, otp, purpose = 'Login') => {
  if (isOtpBypassEnabled()) {
    console.log(`[OTP BYPASS] ${purpose} for ${email} — code: ${getOtpBypassCode()}`);
    return;
  }
  await transporter.sendMail({
    from:    `"Merla Farms" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Merla Farms - Your OTP for ${purpose}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
        <h2 style="color: #1e3a5f;">🐔 Merla Farms</h2>
        <p>Your OTP for <strong>${purpose}</strong> is:</p>
        <h1 style="letter-spacing: 8px; color: #2563eb;">${otp}</h1>
        <p>This OTP expires in <strong>${process.env.OTP_EXPIRY_MINS} minutes</strong>.</p>
        <p style="color: #9ca3af;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

// Snowflake expects YYYY-MM-DD (not en-IN style DD/M/YYYY)
const normalizeDateForSnowflake = (dateStr) => {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const slashMatch = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return dateStr;
};

// ─────────────────────────────────────────────────────
// 1. SIGN UP
// ─────────────────────────────────────────────────────
const signUp = async (req, res) => {
  const {
    farm_name, userid, user_firstname, user_lastname,
    user_dob, user_email, user_contact_no, password, gov_id,
  } = req.body;

  // Validate required fields
  if (!userid || !user_email || !user_contact_no || !password || !gov_id) {
    return res.status(400).json({
      success: false,
      error: 'userid, email, contact number, password and government ID are required',
    });
  }

  try {
    // Hash password
    const salt          = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    console.log('SignUp - calling SP for user:', userid);

    connection.execute({
      sqlText: `
        CALL MERLAFARMS.APP_TRANSACTION.SP_CREATE_FARM_USER_SQL(?,?,?,?,?,?,?,?,?)
      `,
      binds: [
        farm_name       || 'MERLA_FARMS',
        userid,
        user_firstname  || '',
        user_lastname   || '',
        normalizeDateForSnowflake(user_dob),
        user_email,
        user_contact_no,
        password_hash,
        'PREAPPROVED',   // default status
      ],
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('SignUp SP error:', err.message);
          return res.status(500).json({ success: false, error: err.message });
        }

        const spResult = rows[0]['SP_CREATE_FARM_USER_SQL'];
        console.log('SignUp SP result:', spResult);

        if (spResult && spResult.toUpperCase().includes('ERROR')) {
          return res.status(400).json({ success: false, error: spResult });
        }

        res.json({
          success: true,
          message: 'Account created successfully. Awaiting admin approval.',
          status:  'PREAPPROVED',
        });
      },
    });

  } catch (error) {
    console.error('SignUp error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────
// 2. LOGIN — validate credentials + send OTP
// ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email/phone and password are required',
    });
  }

  try {
    // Determine if identifier is email or phone
    const isEmail   = identifier.includes('@');
    const userid    = '';
    const email     = isEmail ? identifier : '';
    const contact   = isEmail ? '' : identifier;

    // We need to fetch the stored hash first
    // Query FARM_USERS to find the user
    connection.execute({
      sqlText: `
        SELECT USERID, USER_EMAIL, USER_CONTACT_NO,
               PASSWORD_HASH, STATUS, FARM_NAME,
               USER_FIRSTNAME, USER_LASTNAME
        FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
        WHERE USER_EMAIL = ? OR USER_CONTACT_NO = ?
        LIMIT 1
      `,
      binds: [identifier, identifier],
      complete: async (err, stmt, rows) => {
        if (err) {
          console.error('Login fetch error:', err.message);
          return res.status(500).json({ success: false, error: err.message });
        }

        if (!rows || rows.length === 0) {
          return res.status(401).json({
            success: false,
            error: 'User not found. Please check your email or phone.',
          });
        }

        const user = rows[0];

        // Check account status
        if (user.STATUS === 'PREAPPROVED') {
          return res.status(403).json({
            success:  false,
            error:    'Your account is pending admin approval.',
            status:   'PREAPPROVED',
          });
        }

        if (user.STATUS === 'INACTIVE' || user.STATUS === 'REJECTED') {
          return res.status(403).json({
            success: false,
            error:   'Your account has been deactivated. Contact admin.',
            status:  user.STATUS,
          });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            error:   'Invalid password. Please try again.',
          });
        }

        // Now call SP_VALIDATE_FARM_USER for extra validation
        connection.execute({
          sqlText: `
            CALL MERLAFARMS.APP_TRANSACTION.SP_VALIDATE_FARM_USER(?,?,?,?)
          `,
          binds: [
            user.USERID,
            user.USER_EMAIL,
            user.USER_CONTACT_NO,
            user.PASSWORD_HASH,
          ],
          complete: async (err2, stmt2, rows2) => {
            if (err2) {
              console.error('Validate SP error:', err2.message);
              return res.status(500).json({ success: false, error: err2.message });
            }

            const spResult = rows2[0]['SP_VALIDATE_FARM_USER'];
            console.log('Validate SP result:', spResult);

            if (spResult && spResult.toUpperCase().includes('ERROR')) {
              return res.status(401).json({ success: false, error: spResult });
            }

            // Generate and send OTP
            const otp = generateOTP();
            const key = user.USER_EMAIL || user.USER_CONTACT_NO;

            // Store OTP with expiry
            otpStore[key] = {
              otp,
              userid:    user.USERID,
              email:     user.USER_EMAIL,
              contact:   user.USER_CONTACT_NO,
              farm_name: user.FARM_NAME,
              firstname: user.USER_FIRSTNAME,
              lastname:  user.USER_LASTNAME,
              expires:   Date.now() + (parseInt(process.env.OTP_EXPIRY_MINS) * 60 * 1000),
            };

            if (!isOtpBypassEnabled()) {
              console.log(`OTP for ${key}: ${otp}`); // remove in production
            }

            // Send OTP email if email available
            if (user.USER_EMAIL) {
              try {
                await sendOTPEmail(user.USER_EMAIL, otp, 'Login');
              } catch (emailErr) {
                console.error('Email error:', emailErr.message);
                // Don't fail login if email fails — log OTP in console
              }
            }

            res.json({
              success:    true,
              message:    `OTP sent to ${key}`,
              identifier: key,
            });
          },
        });
      },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────
// 3. VERIFY OTP
// ─────────────────────────────────────────────────────
const issueJwtResponse = (res, user) => {
  const token = jwt.sign(
    {
      userid:    user.userid,
      email:     user.email,
      contact:   user.contact,
      farm_name: user.farm_name,
      firstname: user.firstname,
      lastname:  user.lastname,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'OTP verified successfully',
    token,
    user: {
      userid:    user.userid,
      email:     user.email,
      farm_name: user.farm_name,
      firstname: user.firstname,
      lastname:  user.lastname,
    },
  });
};

const verifyOTP = (req, res) => {
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Identifier and OTP are required',
    });
  }

  if (isBypassOtp(otp)) {
    return fetchUserByIdentifier(identifier, (err, user) => {
      if (err || !user) {
        return res.status(400).json({
          success: false,
          error: 'User not found. Please check your email or phone.',
        });
      }
      delete otpStore[identifier];
      return issueJwtResponse(res, user);
    });
  }

  const stored = otpStore[identifier];

  if (!stored) {
    return res.status(400).json({
      success: false,
      error: 'OTP not found. Please request a new OTP.',
    });
  }

  if (Date.now() > stored.expires) {
    delete otpStore[identifier];
    return res.status(400).json({
      success: false,
      error: 'OTP has expired. Please request a new one.',
    });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({
      success: false,
      error: 'Invalid OTP. Please try again.',
    });
  }

  delete otpStore[identifier];
  issueJwtResponse(res, stored);
};

// ─────────────────────────────────────────────────────
// 4. RESEND OTP
// ─────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Identifier required' });
  }

  // Fetch user
  connection.execute({
    sqlText: `
      SELECT USER_EMAIL, USER_CONTACT_NO, STATUS
      FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
      WHERE USER_EMAIL = ? OR USER_CONTACT_NO = ?
      LIMIT 1
    `,
    binds: [identifier, identifier],
    complete: async (err, stmt, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const user = rows[0];
      const otp  = generateOTP();
      const key  = user.USER_EMAIL || user.USER_CONTACT_NO;

      otpStore[key] = {
        ...otpStore[key],
        otp,
        expires: Date.now() + (parseInt(process.env.OTP_EXPIRY_MINS) * 60 * 1000),
      };

      if (!isOtpBypassEnabled()) {
        console.log(`Resend OTP for ${key}: ${otp}`);
      }

      if (user.USER_EMAIL) {
        try {
          await sendOTPEmail(user.USER_EMAIL, otp, 'Login');
        } catch (e) {
          console.error('Resend email error:', e.message);
        }
      }

      res.json({ success: true, message: `OTP resent to ${key}` });
    },
  });
};

// ─────────────────────────────────────────────────────
// 5. FORGOT PASSWORD — send OTP
// ─────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Email or phone required' });
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
          error: 'No account found with this email or phone.',
        });
      }

      const user = rows[0];
      const otp  = generateOTP();
      const key  = user.USER_EMAIL || user.USER_CONTACT_NO;

      otpStore[key] = {
        otp,
        userid:  user.USERID,
        email:   user.USER_EMAIL,
        contact: user.USER_CONTACT_NO,
        purpose: 'forgot',
        expires: Date.now() + (parseInt(process.env.OTP_EXPIRY_MINS) * 60 * 1000),
      };

      if (!isOtpBypassEnabled()) {
        console.log(`Forgot Password OTP for ${key}: ${otp}`);
      }

      if (user.USER_EMAIL) {
        try {
          await sendOTPEmail(user.USER_EMAIL, otp, 'Password Reset');
        } catch (e) {
          console.error('Forgot password email error:', e.message);
        }
      }

      res.json({
        success:    true,
        message:    `Password reset OTP sent to ${key}`,
        identifier: key,
      });
    },
  });
};

// ─────────────────────────────────────────────────────
// 6. VERIFY FORGOT PASSWORD OTP + RESET PASSWORD
// ─────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { identifier, otp, new_password } = req.body;

  if (!identifier || !otp || !new_password) {
    return res.status(400).json({
      success: false,
      error: 'Identifier, OTP and new password are required',
    });
  }

  const updatePassword = async (userid) => {
    try {
      const salt          = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(new_password, salt);

      connection.execute({
        sqlText: `
          UPDATE MERLAFARMS.APP_TRANSACTION.FARM_USERS
          SET PASSWORD_HASH = ?
          WHERE USERID = ?
        `,
        binds: [password_hash, userid],
        complete: (err) => {
          if (err) {
            return res.status(500).json({ success: false, error: err.message });
          }

          delete otpStore[identifier];

          res.json({
            success: true,
            message: 'Password reset successfully. Please login.',
          });
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  if (isBypassOtp(otp)) {
    return fetchUserByIdentifier(identifier, (err, user) => {
      if (err || !user) {
        return res.status(400).json({ success: false, error: 'User not found' });
      }
      updatePassword(user.userid);
    });
  }

  const stored = otpStore[identifier];

  if (!stored) {
    return res.status(400).json({ success: false, error: 'OTP not found' });
  }

  if (Date.now() > stored.expires) {
    delete otpStore[identifier];
    return res.status(400).json({ success: false, error: 'OTP has expired' });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid OTP' });
  }

  updatePassword(stored.userid);
};

module.exports = {
  signUp,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
};