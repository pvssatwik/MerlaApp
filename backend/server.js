require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/transactions", require("./routes/transactions"));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/superAdmin'));

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

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(`Local:   http://localhost:${process.env.PORT}`);
  console.log(`Network: http://10.142.11.140:${process.env.PORT}`);
});