const { execute } = require("../db/snowflake");

// ── Sheds ─────────────────────────────────────────────
const getSheds = async (req, res) => {
  const userRole = req.user?.role;
  const userSheds = req.user?.sheds || [];

  // Roles that see ALL sheds
  const fullAccessRoles = ["SUPER_ADMIN", "ADMIN", "INCHARGE", "1", "2", "3"];

  const hasFullAccess = fullAccessRoles.includes(userRole);

  try {
    let sqlText = `
      SELECT SHED_NO, SHED_NAME
      FROM MERLAFARMS.MASTER.SHED_MASTER
      WHERE FARM_NAME = 'MERLA_FARMS'
    `;

    let binds = [];

    if (!hasFullAccess && userSheds.length > 0 && !userSheds.includes("ALL")) {
      const placeholders = userSheds.map(() => "?").join(",");
      sqlText += ` AND SHED_NAME IN (${placeholders})`;
      binds = userSheds;
    }

    sqlText += ` ORDER BY SHED_NAME`;

    const { rows } = await execute({
      sqlText,
      binds,
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

// ── All Flocks ────────────────────────────────────────
const getFlocks = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT FLOCK_NO, FLOCK_NAME
        FROM MERLAFARMS.MASTER.FLOCK_MASTER
        WHERE FARM_NAME = 'MERLA_FARMS'
        ORDER BY FLOCK_NAME
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getFlocks:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── Flocks by Shed ────────────────────────────────────
const getFlocksByShed = async (req, res) => {
  const { shedName } = req.params;
  const userRole = req.user?.role;
  const userSheds = req.user?.sheds || [];

  const fullAccessRoles = ["SUPER_ADMIN", "ADMIN", "INCHARGE", "1", "2", "3"];

  const hasFullAccess = fullAccessRoles.includes(userRole);

  if (
    !hasFullAccess &&
    !userSheds.includes("ALL") &&
    !userSheds.includes(shedName)
  ) {
    return res.status(403).json({
      success: false,
      error: `You do not have access to shed: ${shedName}`,
    });
  }

  try {
    const { rows } = await execute({
      sqlText: `
        SELECT FLOCK_NO, FLOCK_NAME
        FROM MERLAFARMS.MASTER.FLOCK_MASTER
        WHERE FARM_NAME = 'MERLA_FARMS'
          AND (
            CHICK_SHED_NAME = ?
            OR LAYER_SHED_NAME = ?
          )
        ORDER BY FLOCK_NAME
      `,
      binds: [shedName, shedName],
    });

    console.log(`Flocks for shed ${shedName}:`, rows.length);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getFlocksByShed:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── Feed Types ────────────────────────────────────────
const getFeeds = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT FEED_TYPE
        FROM MERLAFARMS.MASTER.FEED_MASTER
        WHERE FARM_NAME = 'MERLA_FARMS'
        ORDER BY FEED_TYPE
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getFeeds:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── Egg Types ─────────────────────────────────────────
const getEggTypes = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT EGG_TYPE
        FROM MERLAFARMS.MASTER.EGG_TYPE_MASTER
        WHERE FARM_NAME = 'MERLA_FARM'
        ORDER BY EGG_TYPE
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getEggTypes:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── Bird Loss Types ───────────────────────────────────
const getBirdLossTypes = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT LOSS_TYPE
        FROM MERLAFARMS.MASTER.BIRD_LOSS_TYPE_MASTER
        WHERE FARM_NAME = 'MERLA_FARM'
        ORDER BY LOSS_TYPE
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getBirdLossTypes:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── Egg Transaction Types ─────────────────────────────
const getEggTransactionTypes = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT TRANSACTION_TYPE
        FROM MERLAFARMS.MASTER.EGG_TRANSACTION_MASTER
        WHERE FARM_NAME = 'MERLA_FARM'
        ORDER BY TRANSACTION_TYPE
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getEggTransactionTypes:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── Trip Numbers ──────────────────────────────────────
const getTrips = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT TRIP_NO, TRIP_NAME
        FROM MERLAFARMS.MASTER.TRIP_MASTER
        WHERE FARM_NAME = 'MERLA_FARM'
        ORDER BY TRIP_NO
      `,
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getTrips:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  getSheds,
  getFlocks,
  getFlocksByShed,
  getFeeds,
  getEggTypes,
  getBirdLossTypes,
  getEggTransactionTypes,
  getTrips,
};
