require("dotenv").config();
const snowflake = require("snowflake-sdk");
const fs = require("fs");
const path = require("path");

// Support both file path and env variable for private key
let privateKey;

if (process.env.SNOWFLAKE_PRIVATE_KEY) {
  // Railway/Production — key stored as env variable
  privateKey = process.env.SNOWFLAKE_PRIVATE_KEY.replace(/\\n/g, "\n");
  console.log("✅ Using private key from environment variable");
} else if (process.env.SNOWFLAKE_PRIVATE_KEY_PATH) {
  // Local development — key stored as file
  privateKey = fs.readFileSync(
    path.resolve(process.env.SNOWFLAKE_PRIVATE_KEY_PATH),
    "utf8",
  );
  console.log(
    "✅ Using private key from file:",
    process.env.SNOWFLAKE_PRIVATE_KEY_PATH,
  );
} else {
  console.error("❌ No Snowflake private key configured!");
}

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  authenticator: "SNOWFLAKE_JWT",
  privateKey,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Snowflake connection failed:", err.message);
  } else {
    console.log("✅ Connected to Snowflake");
    connection.execute({
      sqlText: `USE WAREHOUSE ${process.env.SNOWFLAKE_WAREHOUSE}`,
      complete: () => {},
    });
    connection.execute({
      sqlText: `USE DATABASE ${process.env.SNOWFLAKE_DATABASE}`,
      complete: () => {},
    });
    connection.execute({
      sqlText: `USE SCHEMA ${process.env.SNOWFLAKE_DATABASE}.${process.env.SNOWFLAKE_SCHEMA}`,
      complete: () => {},
    });
  }
});

module.exports = connection;
