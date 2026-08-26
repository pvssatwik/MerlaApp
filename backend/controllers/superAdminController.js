const { execute } = require("../db/snowflake");

// ── Available roles ───────────────────────────────────
const ROLES = [
  { id: "ADMIN", label: "Admin" },
  { id: "INCHARGE", label: "Incharge" },
  { id: "EGG_GODOWN_INCHARGE", label: "Egg Godown Incharge" },
  { id: "FEED_GODOWN_INCHARGE", label: "Feed Godown Incharge" },
  { id: "SUPERVISOR", label: "Supervisor" },
];

// ── 1. Get Pending Users ──────────────────────────────
const getPendingUsers = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          USERID,
          FARM_NAME,
          USER_FIRSTNAME,
          USER_LASTNAME,
          USER_EMAIL,
          USER_CONTACT_NO,
          USER_DOB,
          STATUS,
          GOV_ID
        FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
        WHERE STATUS = 'PENDING'
        ORDER BY USERID
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getPendingUsers:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 2. Get All Users ──────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          FU.USERID,
          FU.FARM_NAME,
          FU.USER_FIRSTNAME,
          FU.USER_LASTNAME,
          FU.USER_EMAIL,
          FU.USER_CONTACT_NO,
          FU.USER_DOB,
          FU.STATUS,
          FU.GOV_ID,
          USA.ROLE_ID,
          RM.ROLE_NAME,
          USA.SHED_NAME,
          USA.ASSIGNMENT_START_DATE,
          USA.ASSIGNMENT_END_DATE
        FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS FU
        LEFT JOIN MERLAFARMS.APP_TRANSACTION.USER_SHED_ASSIGNMENT USA
          ON FU.USERID = USA.USERID
        LEFT JOIN MERLAFARMS.APP_TRANSACTION.FARM_ROLE_MASTER RM
          ON CAST(USA.ROLE_ID AS VARCHAR) = CAST(RM.ROLE_ID AS VARCHAR)
          AND FU.FARM_NAME = RM.FARM_NAME
        WHERE FU.USERID NOT IN (
          SELECT USERID
          FROM MERLAFARMS.APP_TRANSACTION.USER_SHED_ASSIGNMENT
          WHERE ROLE_ID = 1
        )
        ORDER BY FU.STATUS, FU.USERID
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getAllUsers:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 3. Approve User ───────────────────────────────────
const approveUser = async (req, res) => {
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

  const SHED_REQUIRED = ["6", "7", "8"];
  const needsShed = SHED_REQUIRED.includes(String(role_id));

  if (needsShed && !shed_name) {
    return res.status(400).json({
      success: false,
      error: "shed_name is required for this role",
    });
  }

  const startDate =
    assignment_start_date || new Date().toISOString().split("T")[0];

  const endDate = assignment_end_date || "2099-12-31";

  try {
    const { rows } = await execute({
      sqlText: `
        CALL MERLAFARMS.APP_TRANSACTION.SP_UPDATE_USER_STATUS_AND_ASSIGN(?,?,?,?,?,?,?)
      `,
      binds: [
        userid,
        "ACTIVE",
        "MERLA_FARMS",
        role_id,
        needsShed ? shed_name : null,
        startDate,
        endDate,
      ],
    });

    const spResult = rows[0]["SP_UPDATE_USER_STATUS_AND_ASSIGN"];

    if (spResult && spResult.toUpperCase().includes("ERROR")) {
      return res.status(400).json({
        success: false,
        error: spResult,
      });
    }

    res.json({
      success: true,
      message: `User ${userid} approved successfully`,
    });
  } catch (err) {
    console.error("approveUser:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 4. Reject User ────────────────────────────────────
const rejectUser = async (req, res) => {
  const { userid } = req.body;

  if (!userid) {
    return res.status(400).json({
      success: false,
      error: "userid required",
    });
  }

  try {
    await execute({
      sqlText: `
        UPDATE MERLAFARMS.APP_TRANSACTION.FARM_USERS
        SET STATUS = 'REJECTED'
        WHERE USERID = ?
      `,
      binds: [userid],
    });

    res.json({
      success: true,
      message: `User ${userid} has been rejected`,
    });
  } catch (err) {
    console.error("rejectUser:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 5. Update User Status ─────────────────────────────
const updateUserStatus = async (req, res) => {
  const { userid, status } = req.body;

  const validStatuses = ["ACTIVE", "BLOCKED", "INACTIVE"];

  if (!userid || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `userid and valid status (${validStatuses.join(", ")}) required`,
    });
  }

  try {
    await execute({
      sqlText: `
        UPDATE MERLAFARMS.APP_TRANSACTION.FARM_USERS
        SET STATUS = ?
        WHERE USERID = ?
      `,
      binds: [status, userid],
    });

    res.json({
      success: true,
      message: `User ${userid} status updated to ${status}`,
    });
  } catch (err) {
    console.error("updateUserStatus:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 6. Get Roles ──────────────────────────────────────
const getRoles = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          ROLE_ID,
          ROLE_NAME,
          ROLE_DESCRIPTION
        FROM MERLAFARMS.APP_TRANSACTION.FARM_ROLE_MASTER
        WHERE FARM_NAME = 'MERLA_FARMS'
        ORDER BY ROLE_ID
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getRoles:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 7. Get Sheds ──────────────────────────────────────
const getSheds = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          SHED_NO,
          SHED_NAME
        FROM MERLAFARMS.MASTER.SHED_MASTER
        WHERE FARM_NAME = 'MERLA_FARMS'
        ORDER BY SHED_NO ASC
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getSheds:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
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
