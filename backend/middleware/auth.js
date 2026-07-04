const jwt = require("jsonwebtoken");
const connection = require("../db/snowflake");

// ── Verify JWT Access Token ───────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Access token expired",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(403).json({
      success: false,
      error: "Invalid token",
    });
  }
};

// ── Check Role ────────────────────────────────────────
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const userRole = req.user.role;

    // Allow both role name and numeric ID
    const hasRole = allowedRoles.some(
      (allowed) =>
        userRole === allowed ||
        userRole?.toUpperCase() === allowed?.toUpperCase(),
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required: ${allowedRoles.join(" or ")}`,
      });
    }
    next();
  };
};

// ── Check Shed Assignment ─────────────────────────────
const checkShedAccess = (req, res, next) => {
  const fullAccessRoles = ["SUPER_ADMIN", "ADMIN", "INCHARGE", "1"];

  if (fullAccessRoles.includes(req.user.role)) {
    return next();
  }

  const requestedShed =
    req.body.shed_no || req.body.shed_name || req.query.shed;

  if (!requestedShed) return next(); // No shed in this request

  const assignedSheds = req.user.sheds || [];

  if (assignedSheds.includes("ALL")) {
    return next(); // ALL shed access
  }

  if (!assignedSheds.includes(requestedShed)) {
    return res.status(403).json({
      success: false,
      error: `You do not have access to shed: ${requestedShed}. Your assigned shed(s): ${assignedSheds.join(", ") || "None"}`,
    });
  }

  next();
};

// ── Check Date Restriction (Supervisors: today only) ──
const checkDateRestriction = (req, res, next) => {
  if (req.user.role !== "SUPERVISOR") return next();

  const entryDate =
    req.body.production_date || req.body.reporting_date || req.body.supply_date;

  if (!entryDate) return next();

  const today = new Date().toISOString().split("T")[0];
  if (entryDate !== today) {
    return res.status(403).json({
      success: false,
      error: "Supervisors can only enter data for today",
    });
  }

  next();
};

module.exports = {
  verifyToken,
  checkRole,
  checkShedAccess,
  checkDateRestriction,
};