const connection = require('../db/snowflake');

// ── Sheds ─────────────────────────────────────────────
const getSheds = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT SHED_NO, SHED_NAME 
      FROM MERLAFARMS.MASTER.SHED_MASTER
      WHERE FARM_NAME = 'MERLA FARMS'
      ORDER BY SHED_NAME
    `,
    complete: (err, stmt, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  });
};

// ── All Flocks ────────────────────────────────────────
const getFlocks = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT FLOCK_NO, FLOCK_NAME
      FROM MERLAFARMS.MASTER.FLOCK_MASTER
      WHERE FARM_NAME = 'MERLA_FARMS'
      ORDER BY FLOCK_NAME
    `,
    complete: (err, stmt, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  });
};

// ── Flocks by Shed (cascading) ────────────────────────
const getFlocksByShed = (req, res) => {
  const { shedNo } = req.params;
  connection.execute({
    sqlText: `
      SELECT FLOCK_NO, FLOCK_NAME
      FROM MERLAFARMS.MASTER.FLOCK_MASTER
      WHERE FARM_NAME = 'MERLA_FARMS'
      AND (CHICK_SHED_NAME = ? OR LAYER_SHED_NAME = ?)
      ORDER BY FLOCK_NAME
    `,
    binds: [shedNo, shedNo],
    complete: (err, stmt, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  });
};

// ── Feed Types ────────────────────────────────────────
const getFeeds = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT FEED_TYPE
      FROM MERLAFARMS.MASTER.FEED_MASTER
      WHERE FARM_NAME = 'MERLA_FARMS'
      ORDER BY FEED_TYPE
    `,
    complete: (err, stmt, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  });
};

// ── Egg Types ─────────────────────────────────────────
const getEggTypes = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT EGG_TYPE
      FROM MERLAFARMS.MASTER.EGG_TYPE_MASTER
      WHERE FARM_NAME = 'MERLA_FARM'
      ORDER BY EGG_TYPE
    `,
    complete: (err, stmt, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  });
};

// ── Bird Loss Types ───────────────────────────────────
const getBirdLossTypes = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT LOSS_TYPE
      FROM MERLAFARMS.MASTER.BIRD_LOSS_TYPE_MASTER
      WHERE FARM_NAME = 'MERLA_FARM'
      ORDER BY LOSS_TYPE
    `,
    complete: (err, stmt, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  });
};

// ── Egg Transaction Types ─────────────────────────────
const getEggTransactionTypes = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT TRANSACTION_TYPE
      FROM MERLAFARMS.MASTER.EGG_TRANSACTION_MASTER
      WHERE FARM_NAME = 'MERLA_FARM'
      ORDER BY TRANSACTION_TYPE
    `,
    complete: (err, stmt, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  });
};

// ── Trip Numbers ──────────────────────────────────────
const getTrips = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT TRIP_NO, TRIP_NAME
      FROM MERLAFARMS.MASTER.TRIP_MASTER
      WHERE FARM_NAME = 'MERLA_FARM'
      ORDER BY TRIP_NO
    `,
    complete: (err, stmt, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  });
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