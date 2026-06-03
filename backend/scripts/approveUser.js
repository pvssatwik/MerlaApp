/**
 * Approve a PREAPPROVED user (assign ACTIVE + role + shed).
 *
 * Usage:
 *   node scripts/approveUser.js --userid john_4297 --role SUPERVISOR --shed "SHED-01"
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const connection = require("../db/snowflake");

const args = process.argv.slice(2);
const getArg = (name, fallback = "") => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const userid = getArg("userid");
const role = getArg("role", "SUPERVISOR");
const shed = getArg("shed");

if (!userid) {
  console.error(`
Usage:
  node scripts/approveUser.js --userid <USERID> --role SUPERVISOR --shed "<SHED_NAME>"

List pending users in Snowflake:
  SELECT USERID, USER_EMAIL, STATUS FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
  WHERE STATUS = 'PREAPPROVED';
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

setTimeout(async () => {
  try {
    const rows = await run(
      `CALL MERLAFARMS.APP_TRANSACTION.SP_UPDATE_USER_STATUS_AND_ASSIGN(?,?,?,?)`,
      [userid, "ACTIVE", role, shed || null],
    );
    console.log("Result:", rows?.[0] || rows);
    console.log(`✅ User ${userid} → ACTIVE, role ${role}, shed ${shed || "(none)"}`);
    process.exit(0);
  } catch (err) {
    console.error("❌", err.message);
    console.error(`
Run in Snowflake manually (adjust if your SP signature differs):
  CALL MERLAFARMS.APP_TRANSACTION.SP_UPDATE_USER_STATUS_AND_ASSIGN(
    '${userid}', 'ACTIVE', '${role}', ${shed ? `'${shed}'` : "NULL"}
  );
`);
    process.exit(1);
  }
}, 3000);
