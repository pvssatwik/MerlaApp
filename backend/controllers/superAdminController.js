const connection = require("../db/snowflake");

// ── Available roles ───────────────────────────────────
const ROLES = [
  { id: "ADMIN", label: "Admin" },
  { id: "INCHARGE", label: "Incharge" },
  { id: "EGG_GODOWN_INCHARGE", label: "Egg Godown Incharge" },
  { id: "FEED_GODOWN_INCHARGE", label: "Feed Godown Incharge" },
  { id: "SUPERVISOR", label: "Supervisor" },
];

// ── 1. Get all PENDING users ──────────────────────────
const getPendingUsers = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT
        USERID, FARM_NAME, USER_FIRSTNAME, USER_LASTNAME,
        USER_EMAIL, USER_CONTACT_NO, USER_DOB, STATUS
      FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
      WHERE STATUS IN ('PENDING', 'PREAPPROVED')
      ORDER BY USERID
    `,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    },
  });
};

// ── 2. Get all users (all statuses) ──────────────────
const getAllUsers = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT
        FU.USERID, FU.FARM_NAME, FU.USER_FIRSTNAME,
        FU.USER_LASTNAME, FU.USER_EMAIL, FU.USER_CONTACT_NO,
        FU.STATUS, USA.ROLE_ID, USA.SHED_NAME,
        USA.ASSIGNMENT_START_DATE, USA.ASSIGNMENT_END_DATE
      FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS FU
      LEFT JOIN MERLAFARMS.APP_TRANSACTION.USER_SHED_ASSIGNMENT USA
        ON FU.USERID = USA.USERID
        AND USA.ASSIGNMENT_END_DATE >= CURRENT_DATE
      WHERE FU.USERID != 'SUPERADMIN_001'
      ORDER BY FU.STATUS, FU.USERID
    `,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    },
  });
};

// ── 3. Approve user → assign role + shed ─────────────
const approveUser = (req, res) => {
  const {
    userid,
    role_id,
    shed_name,
    assignment_start_date,
    assignment_end_date,
  } = req.body;

  if (!userid || !role_id) {
    return res.status(400).json({
      success: false,
      error: "userid and role_id are required",
    });
  }

  // Roles that need a shed assigned
  const shedRequiredRoles = [
    "INCHARGE",
    "SUPERVISOR",
    "EGG_GODOWN_INCHARGE",
    "FEED_GODOWN_INCHARGE",
  ];

  if (shedRequiredRoles.includes(role_id) && !shed_name) {
    return res.status(400).json({
      success: false,
      error: `shed_name is required for role: ${role_id}`,
    });
  }

  const shedToAssign = shed_name || "ALL"; // ADMIN gets ALL
  const startDate =
    assignment_start_date || new Date().toISOString().split("T")[0];
  const endDate = assignment_end_date || "2099-12-31";

  connection.execute({
    sqlText: `
      CALL MERLAFARMS.APP_TRANSACTION.SP_UPDATE_USER_STATUS_AND_ASSIGN(?,?,?,?,?,?,?)
    `,
    binds: [
      userid,
      "ACTIVE",
      "MERLA_FARMS",
      role_id,
      shedToAssign,
      startDate,
      endDate,
    ],
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });

      const spResult = rows[0]["SP_UPDATE_USER_STATUS_AND_ASSIGN"];
      console.log("Approve user SP result:", spResult);

      if (spResult && spResult.toUpperCase().includes("ERROR")) {
        return res.status(400).json({ success: false, error: spResult });
      }

      res.json({
        success: true,
        message: `User ${userid} approved successfully with role ${role_id}`,
      });
    },
  });
};

// ── 4. Reject user ────────────────────────────────────
const rejectUser = (req, res) => {
  const { userid, reason } = req.body;

  if (!userid) {
    return res.status(400).json({ success: false, error: "userid required" });
  }

  connection.execute({
    sqlText: `
      UPDATE MERLAFARMS.APP_TRANSACTION.FARM_USERS
      SET STATUS = 'REJECTED'
      WHERE USERID = ?
    `,
    binds: [userid],
    complete: (err) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true,
        message: `User ${userid} has been rejected`,
      });
    },
  });
};

// ── 5. Block/Deactivate user ──────────────────────────
const updateUserStatus = (req, res) => {
  const { userid, status } = req.body;

  const validStatuses = ["ACTIVE", "BLOCKED", "INACTIVE"];
  if (!userid || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `userid and valid status (${validStatuses.join(", ")}) required`,
    });
  }

  connection.execute({
    sqlText: `
      UPDATE MERLAFARMS.APP_TRANSACTION.FARM_USERS
      SET STATUS = ?
      WHERE USERID = ?
    `,
    binds: [status, userid],
    complete: (err) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true,
        message: `User ${userid} status updated to ${status}`,
      });
    },
  });
};

// ── 6. Get roles list ─────────────────────────────────
// ── Get roles from FARM_ROLE_MASTER ───────────────────
const getRoles = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT ROLE_ID, ROLE_NAME, ROLE_DESCRIPTION
      FROM MERLAFARMS.APP_TRANSACTION.FARM_ROLE_MASTER
      WHERE FARM_NAME = 'MERLA_FARMS'
      ORDER BY ROLE_ID
    `,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    },
  });
};

// ── 7. Get sheds list ─────────────────────────────────
const getSheds = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT SHED_NO, SHED_NAME
      FROM MERLAFARMS.MASTER.SHED_MASTER
      WHERE FARM_NAME = 'MERLA FARMS'
      ORDER BY SHED_NAME
    `,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    },
  });
};

module.exports = {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserStatus,
  getRoles,
  getSheds,
};
