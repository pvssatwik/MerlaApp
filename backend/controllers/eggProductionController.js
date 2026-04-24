const connection = require('../db/snowflake');

const insertEggProduction = (req, res) => {
  console.log('Received body:', req.body); // ← debug log

  const {
    farm_name,
    shed_no,
    flock_no,
    production_date,
    transaction_type,
    egg_type,
    egg_count,
    trip_no,
    comments,   // ← frontend sends "comments"
    who_created
  } = req.body;

  // Replace undefined with empty string or default
  const binds = [
    farm_name        || 'MERLA',
    shed_no          || '',
    flock_no         || '',
    production_date  || '',
    transaction_type || '',
    egg_type         || '',
    Number(egg_count) || 0,
    trip_no          || '',
    comments         || '',   // ← map "comments" to SP's "commnets"
    who_created      || 'APP_USER'
  ];

  console.log('Binds:', binds); // ← debug log

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_EGG_PRODUCTION_SUMMARY(?,?,?,?,?,?,?,?,?,?)`,
    binds: binds,
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

const fetchEggProductions = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT
        FARM_NAME, SHED_NO, FLOCK_NO,
        PRODUCTION_DATE, TRANSACTION_TYPE,
        EGG_TYPE, EGG_COUNT, TRIP_NO,
        COMMNETS, WHO_CREATED, WHEN_CREATED
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

module.exports = { insertEggProduction, fetchEggProductions };