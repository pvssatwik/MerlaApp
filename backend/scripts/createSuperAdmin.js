/**
 * One-time bootstrap: create the first SUPERADMIN (can approve other users).
 *
 * Usage (from backend folder):
 *   node scripts/createSuperAdmin.js --email admin@merlafarms.com --password "YourPass123" --userid superadmin_01
 *
 * Optional: --firstname --lastname --phone --govid
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const connection = require("../db/snowflake");

const args = process.argv.slice(2);
const getArg = (name, fallback = "") => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const email = getArg("email");
const password = getArg("password");
const userid = getArg("userid", email ? email.split("@")[0] : "");
const firstname = getArg("firstname", "Super");
const lastname = getArg("lastname", "Admin");
const phone = getArg("phone", "9999999999");
const govId = getArg("govid", "BOOTSTRAP_ADMIN");

if (!email || !password || !userid) {
  console.error(`
Usage:
  node scripts/createSuperAdmin.js \\
    --email admin@merlafarms.com \\
    --password "Hello@123" \\
    --userid superadmin_01

Optional: --firstname --lastname --phone --govid
`);
  process.exit(1);
}

const run = (sqlText, binds = []) =>
  new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) reject(err);
        else resolve(rows);
      },
    });
  });

const waitForSnowflake = () =>
  new Promise((resolve) => {
    const check = () => {
      if (connection.isUp && connection.isUp()) return resolve();
      setTimeout(check, 500);
    };
    setTimeout(resolve, 8000);
    check();
  });

(async () => {
  try {
    console.log("Connecting to Snowflake...");
    await waitForSnowflake();

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    console.log("Creating user via SP_CREATE_FARM_USER_SQL (ACTIVE)...");
    const createRows = await run(
      `CALL MERLAFARMS.APP_TRANSACTION.SP_CREATE_FARM_USER_SQL(?,?,?,?,?,?,?,?,?,?)`,
      [
        "MERLA_FARMS",
        userid,
        firstname,
        lastname,
        "2000-01-01",
        email,
        phone,
        password_hash,
        govId,
        "ACTIVE",
      ],
    );

    const createResult =
      createRows?.[0]?.["SP_CREATE_FARM_USER_SQL"] ||
      JSON.stringify(createRows?.[0]);
    console.log("Create result:", createResult);

    if (String(createResult).toUpperCase().includes("ERROR")) {
      throw new Error(createResult);
    }

    console.log("Assigning SUPERADMIN role...");
    try {
      const assignRows = await run(
        `CALL MERLAFARMS.APP_TRANSACTION.SP_UPDATE_USER_STATUS_AND_ASSIGN(?,?,?,?)`,
        [userid, "ACTIVE", "SUPERADMIN", null],
      );
      const assignResult =
        assignRows?.[0]?.["SP_UPDATE_USER_STATUS_AND_ASSIGN"] ||
        JSON.stringify(assignRows?.[0]);
      console.log("Assign result:", assignResult);
    } catch (spErr) {
      console.warn(
        "SP_UPDATE_USER_STATUS_AND_ASSIGN failed — run manual SQL in Snowflake:",
      );
      console.warn(spErr.message);
      console.warn(`
-- Manual fallback (adjust column names if your table differs):
UPDATE MERLAFARMS.APP_TRANSACTION.FARM_USERS
SET STATUS = 'ACTIVE'
WHERE USERID = '${userid}';

INSERT INTO MERLAFARMS.APP_TRANSACTION.USER_SHED_ASSIGNMENT
  (ASSIGNMENT_ID, USERID, ROLE_ID, SHED_NAME, ASSIGNMENT_START_DATE, ASSIGNMENT_END_DATE)
VALUES
  ('${uuid()}', '${userid}', 'SUPERADMIN', NULL, CURRENT_DATE(), '9999-12-31');
`);
    }

    const verify = await run(
      `
      SELECT FU.USERID, FU.USER_EMAIL, FU.STATUS, USA.ROLE_ID, USA.SHED_NAME
      FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS FU
      LEFT JOIN MERLAFARMS.APP_TRANSACTION.USER_SHED_ASSIGNMENT USA
        ON FU.USERID = USA.USERID
        AND USA.ASSIGNMENT_END_DATE >= CURRENT_DATE
      WHERE FU.USERID = ?
    `,
      [userid],
    );

    console.log("\n✅ Super admin ready. Verify:");
    console.table(verify);

    console.log(`
Login in the app with:
  Email: ${email}
  Password: (what you passed)
  OTP: ${process.env.OTP_BYPASS === "true" ? process.env.OTP_BYPASS_CODE || "123456" : "from email"}
`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
})();
