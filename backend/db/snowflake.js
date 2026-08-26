require("dotenv").config();
const snowflake = require("snowflake-sdk");
const fs = require("fs");
const path = require("path");

// ── Load private key ──────────────────────────────────
let privateKey;
if (process.env.SNOWFLAKE_PRIVATE_KEY) {
  privateKey = process.env.SNOWFLAKE_PRIVATE_KEY.replace(/\\n/g, "\n");
  console.log("✅ Using private key from environment variable");
} else if (process.env.SNOWFLAKE_PRIVATE_KEY_PATH) {
  privateKey = fs.readFileSync(
    path.resolve(process.env.SNOWFLAKE_PRIVATE_KEY_PATH),
    "utf8",
  );
  console.log("✅ Using private key from file");
} else {
  console.error("❌ No Snowflake private key found!");
}

const SF_CONFIG = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  authenticator: "SNOWFLAKE_JWT",
  privateKey,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
};

// ── Connection state ──────────────────────────────────
let connection = null;
let isConnecting = false;
let keepAliveTimer = null;

// ── Create and connect ────────────────────────────────
const createConnection = () => {
  return new Promise((resolve, reject) => {
    const conn = snowflake.createConnection(SF_CONFIG);
    conn.connect((err) => {
      if (err) {
        console.error("❌ Snowflake connect error:", err.message);
        reject(err);
      } else {
        console.log("✅ Connected to Snowflake");
        // Set context
        conn.execute({
          sqlText: `USE WAREHOUSE ${process.env.SNOWFLAKE_WAREHOUSE}`,
          complete: () => {},
        });
        conn.execute({
          sqlText: `USE DATABASE ${process.env.SNOWFLAKE_DATABASE}`,
          complete: () => {},
        });
        conn.execute({
          sqlText: `USE SCHEMA ${process.env.SNOWFLAKE_DATABASE}.${process.env.SNOWFLAKE_SCHEMA}`,
          complete: () => {},
        });
        resolve(conn);
      }
    });
  });
};

// ── Get healthy connection ─────────────────────────────
const getConnection = async () => {
  // Already connected and healthy
  if (connection && connection.isUp()) {
    return connection;
  }

  // Wait if already connecting
  if (isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return getConnection();
  }

  // Reconnect
  isConnecting = true;
  console.log("🔄 Reconnecting to Snowflake...");

  try {
    if (connection) {
      try {
        connection.destroy(() => {});
      } catch (e) {}
      connection = null;
    }

    connection = await createConnection();
    isConnecting = false;
    startKeepAlive();
    return connection;
  } catch (err) {
    isConnecting = false;
    connection = null;
    throw err;
  }
};

// ── Keep-alive ping every 10 minutes ─────────────────
const startKeepAlive = () => {
  if (keepAliveTimer) clearInterval(keepAliveTimer);

  keepAliveTimer = setInterval(
    async () => {
      try {
        const conn = await getConnection();
        conn.execute({
          sqlText: "SELECT CURRENT_TIMESTAMP()",
          complete: (err, stmt, rows) => {
            if (err) {
              console.warn("⚠️ Keep-alive failed:", err.message);
              connection = null; // Force reconnect next time
            } else {
              console.log(
                "💓 Snowflake keep-alive OK:",
                rows[0]["CURRENT_TIMESTAMP()"],
              );
            }
          },
        });
      } catch (e) {
        console.warn("⚠️ Keep-alive error:", e.message);
      }
    },
    10 * 60 * 1000,
  ); // every 10 minutes
};

// ── Execute with auto-retry on stale connection ───────
const execute = async (options) => {
  return new Promise(async (resolve, reject) => {
    const runQuery = async (retryCount = 0) => {
      try {
        const conn = await getConnection();

        conn.execute({
          ...options,
          complete: async (err, stmt, rows) => {
            if (err) {
              const isStaleError =
                err.message?.includes("Connection") ||
                err.message?.includes("Session no longer exists") ||
                err.message?.includes("network") ||
                err.code === "250001" ||
                err.code === "250002";

              if (isStaleError && retryCount === 0) {
                console.warn("⚠️ Stale connection detected, reconnecting...");
                connection = null;
                try {
                  await runQuery(1);
                } catch (retryErr) {
                  reject(retryErr);
                }
              } else {
                reject(err);
              }
            } else {
              resolve({ stmt, rows });
            }
          },
        });
      } catch (connErr) {
        reject(connErr);
      }
    };

    await runQuery();
  });
};

// ── Initial connection on startup ─────────────────────
getConnection()
  .then(() => console.log("✅ Snowflake ready"))
  .catch((err) =>
    console.error("❌ Initial Snowflake connection failed:", err.message),
  );

// ── Export ────────────────────────────────────────────
module.exports = { getConnection, execute };
