require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
//app.use(cors());
// Production CORS
app.use(
  cors({
    origin: "*", // or specify your app's bundle ID
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/superAdmin"));

app.get("/", (req, res) => {
  res.json({
    status: "✅ Merla Farms API Running",
    version: "1.0.0",
    routes: [
      "GET  /health",
      "POST /api/transactions/egg-production",
      "GET  /api/transactions/dropdowns/sheds",
      "...",
    ],
  });
});
// Temporary debug endpoint — remove after testing
app.get("/debug", (req, res) => {
  res.json({
    status: "OK",
    node_env: process.env.NODE_ENV,
    has_sf_key: !!process.env.SNOWFLAKE_PRIVATE_KEY,
    has_sf_path: !!process.env.SNOWFLAKE_PRIVATE_KEY_PATH,
    has_email: !!process.env.EMAIL_USER,
    has_email_pw: !!process.env.EMAIL_PASS,
    has_jwt: !!process.env.JWT_ACCESS_SECRET,
    otp_bypass: process.env.OTP_BYPASS,
    sf_account: process.env.SNOWFLAKE_ACCOUNT,
    sf_user: process.env.SNOWFLAKE_USERNAME,
  });
});

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(`Local:   http://localhost:${process.env.PORT}`);
  console.log(`Network: http://10.142.11.140:${process.env.PORT}`);
});
