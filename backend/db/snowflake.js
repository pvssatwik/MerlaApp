require('dotenv').config();
const snowflake = require('snowflake-sdk');
const fs        = require('fs');
const path      = require('path');

// Read private key file
const privateKeyPath = path.resolve(process.env.SNOWFLAKE_PRIVATE_KEY_PATH);
const privateKey     = fs.readFileSync(privateKeyPath, 'utf8');

const connection = snowflake.createConnection({
  account:       process.env.SNOWFLAKE_ACCOUNT,
  username:      process.env.SNOWFLAKE_USERNAME,
  authenticator: 'SNOWFLAKE_JWT',
  privateKey:    privateKey,
  database:      process.env.SNOWFLAKE_DATABASE,
  schema:        process.env.SNOWFLAKE_SCHEMA,
  warehouse:     process.env.SNOWFLAKE_WAREHOUSE,
});

connection.connect((err) => {
  if (err) console.error('❌ Snowflake connection failed:', err.message);
  else     console.log('✅ Connected to Snowflake');
});

module.exports = connection;