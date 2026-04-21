const connection = require('../db/snowflake');

// ── SP 1: Daily Egg Production ─────────────────────────
const insertEggProduction = (req, res) => {
  const {
    farm_name, shed_name, flock_name, production_date,
    transaction_type, egg_type, egg_count, trip_no,
    commnets, who_created
  } = req.body;

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_EGG_PRODUCTION_SUMMARY(?,?,?,?,?,?,?,?,?,?)`,
    binds: [
      farm_name, shed_name, flock_name, production_date,
      transaction_type, egg_type, egg_count, trip_no,
      commnets , who_created || 'APP_USER'
    ],
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('SP Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      const spResult = rows[0]['SP_INS_DAILY_EGG_PRODUCTION_SUMMARY'];
      res.json({ success: true, message: spResult });
    }
  });
};

// ── SP 2: Bird Live Stock ──────────────────────────────
const insertBirdLiveStock = (req, res) => {
  const {
    farm_name, shed_name, flock_name, reporting_date,
    loss_of_bird, loss_type, balance_count,
    comments, who_created
  } = req.body;

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_BIRD_LIVE_STOCK(?,?,?,?,?,?,?,?,?)`,
    binds: [
      farm_name, shed_name, flock_name, reporting_date,
      loss_of_bird, loss_type, balance_count,
      comments, who_created || 'APP_USER'
    ],
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('SP Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      const spResult = rows[0]['SP_INS_DAILY_BIRD_LIVE_STOCK'];
      res.json({ success: true, message: spResult });
    }
  });
};

// ── SP 3: Feed Consumption ─────────────────────────────
const insertFeedConsumption = (req, res) => {
  const {
    farm_name, shed_name, flock_name, reporting_date,
    feed_type, feed_used, feed_balance,
    comments, who_created
  } = req.body;

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_FEED_CONSUMPTION(?,?,?,?,?,?,?,?,?)`,
    binds: [
      farm_name, shed_name, flock_name, reporting_date,
      feed_type, feed_used, feed_balance,
      comments, who_created || 'APP_USER'
    ],
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('SP Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      const spResult = rows[0]['SP_INS_DAILY_FEED_CONSUMPTION'];
      res.json({ success: true, message: spResult });
    }
  });
};
const fetchEggProductions = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT
        SHED_NO, FARM_NAME, FLOCK_NO, SHED_NAME,
        PRODUCTION_DATE, FLOCK_NAME, TRANSACTION_TYPE,
        EGG_TYPE, EGG_COUNT, TRIP_NO, COMMENTS,
        WHO_CREATED, WHEN_CREATED
      FROM MERLAFARMS.TRANSACTION.DAILY_EGG_PRODUCTION_SUMMARY
      ORDER BY WHEN_CREATED DESC
      LIMIT 100
    `,
    complete: (err, stmt, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  });
};

module.exports = {
  insertEggProduction,
  insertBirdLiveStock,
  insertFeedConsumption,
  fetchEggProductions
};