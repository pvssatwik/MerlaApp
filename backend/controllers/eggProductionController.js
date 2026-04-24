const connection = require("../db/snowflake");

// ── Helper functions ──────────────────────────────────
const safe = (val, def = "") => (val !== undefined && val !== null ? val : def);
const safeNum = (val) => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

// ── 1. Egg Production ─────────────────────────────────
const insertEggProduction = (req, res) => {
  const {
    farm_name,
    shed_no,
    flock_no,
    production_date,
    transaction_type,
    egg_type,
    egg_count,
    trip_no,
    comments,
    commnets,
    who_created,
  } = req.body;

  const binds = [
    safe(farm_name, "MERLA_FARMS"),
    safe(shed_no),
    safe(flock_no),
    safe(production_date),
    safe(transaction_type),
    safe(egg_type),
    safeNum(egg_count),
    safe(trip_no),
    safe(commnets || comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("EggProduction binds:", binds);

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_EGG_PRODUCTION_SUMMARY(?,?,?,?,?,?,?,?,?,?)`,
    binds,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true,
        message: rows[0]["SP_INS_DAILY_EGG_PRODUCTION_SUMMARY"],
      });
    },
  });
};

// ── 2. Bird Live Stock ────────────────────────────────
// CALL SP('MERLA','LAYER-1','FLOCK15','2026-04-19',2,'COUNTER',0,'COMMENTS','WHO')
const insertBirdLiveStock = (req, res) => {
  const {
    farm_name,
    shed_no,
    flock_no,
    reporting_date,
    loss_of_bird,
    loss_type,
    balance_count,
    comments,
    who_created,
  } = req.body;

  const binds = [
    safe(farm_name, "MERLA_FARMS"),
    safe(shed_no),
    safe(flock_no),
    safe(reporting_date),
    safeNum(loss_of_bird),
    safe(loss_type),
    safeNum(balance_count),
    safe(comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("BirdLiveStock binds:", binds);

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_BIRD_LIVE_STOCK(?,?,?,?,?,?,?,?,?)`,
    binds,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true,
        message: rows[0]["SP_INS_DAILY_BIRD_LIVE_STOCK"],
      });
    },
  });
};

// ── 3. Egg Godown Stock ───────────────────────────────
// CALL SP('MERLA','LAYER-1','FLOCK16','2026-04-19','MEDIUM',1500,'TRIP 1','54894','COMMENTS','WHO')
const insertEggGodownStock = (req, res) => {
  const {
    farm_name,
    shed_no,
    flock_no,
    production_date,
    egg_type,
    egg_count,
    trip_no,
    total_egg_stock,
    comments,
    who_created,
  } = req.body;

  const binds = [
    safe(farm_name, "MERLA_FARMS"),
    safe(shed_no),
    safe(flock_no),
    safe(production_date),
    safe(egg_type),
    safeNum(egg_count),
    safe(trip_no),
    safe(total_egg_stock),
    safe(comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("EggGodownStock binds:", binds);

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_EGG_GODOWN_STOCK(?,?,?,?,?,?,?,?,?,?)`,
    binds,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: rows[0]["SP_INS_EGG_GODOWN_STOCK"] });
    },
  });
};

// ── 4. Egg Sale Summary ───────────────────────────────
// CALL SP('MERLA','2026-04-19','SALE','MEDIUM',24896,'GATE','CUSTOMER',9966332255,'LORRY','EICHER','TN TN',NULL,'COMMENTS','WHO')
const insertEggSaleSummary = (req, res) => {
  const {
    farm_name,
    sale_date,
    transaction_type,
    egg_type,
    eggs_volume,
    gate_pass_no,
    customer_name,
    customer_mobile_no,
    transport_mode,
    vehicle_type,
    vehicle_no,
    balance_count,
    comments,
    who_created,
  } = req.body;

  const binds = [
    safe(farm_name, "MERLA_FARMS"),
    safe(sale_date),
    safe(transaction_type),
    safe(egg_type),
    safeNum(eggs_volume),
    safe(gate_pass_no),
    safe(customer_name),
    safeNum(customer_mobile_no),
    safe(transport_mode),
    safe(vehicle_type),
    safe(vehicle_no),
    balance_count !== undefined && balance_count !== ""
      ? safeNum(balance_count)
      : null,
    safe(comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("EggSaleSummary binds:", binds);

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_EGG_SALE_SUMMARY(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    binds,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: rows[0]["SP_INS_EGG_SALE_SUMMARY"] });
    },
  });
};

// ── 5. Feed Consumption ───────────────────────────────
// CALL SP('MERLA','LAYER-1','FLOCK16','2026-04-19','GRW',1250,0,'COMMENTS','WHO')
const insertFeedConsumption = (req, res) => {
  const {
    farm_name,
    shed_no,
    flock_no,
    reporting_date,
    feed_type,
    feed_used,
    feed_balance,
    comments,
    who_created,
  } = req.body;

  const binds = [
    safe(farm_name, "MERLA_FARMS"),
    safe(shed_no),
    safe(flock_no),
    safe(reporting_date),
    safe(feed_type),
    safeNum(feed_used),
    safeNum(feed_balance),
    safe(comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("FeedConsumption binds:", binds);

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_FEED_CONSUMPTION(?,?,?,?,?,?,?,?,?)`,
    binds,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true,
        message: rows[0]["SP_INS_DAILY_FEED_CONSUMPTION"],
      });
    },
  });
};

// ── 6. Feed Production ────────────────────────────────
// CALL SP('MERLA','2026-04-19','RAW MAT',100,'FEED','COMMENTS','WHO')
const insertFeedProduction = (req, res) => {
  const {
    farm_name,
    production_date,
    feed_type,
    volume,
    category,
    comments,
    who_created,
  } = req.body;

  const binds = [
    safe(farm_name, "MERLA_FARMS"),
    safe(production_date),
    safe(feed_type),
    safeNum(volume),
    safe(category),
    safe(comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("FeedProduction binds:", binds);

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_FEED_PRODUCTION(?,?,?,?,?,?,?)`,
    binds,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: rows[0]["SP_INS_FEED_PRODUCTION"] });
    },
  });
};

// ── 7. Feed Shed Stock ────────────────────────────────
// CALL SP('MERLA','LAYER-1','FLOCK16','2026-04-19','GRW',1250,0,'COMMENTS','WHO')
const insertFeedShedStock = (req, res) => {
  const {
    farm_name,
    shed_no,
    flock_no,
    reporting_date,
    feed_type,
    volume,
    balance,
    comments,
    who_created,
  } = req.body;

  const binds = [
    safe(farm_name, "MERLA_FARMS"),
    safe(shed_no),
    safe(flock_no),
    safe(reporting_date),
    safe(feed_type),
    safeNum(volume),
    safeNum(balance),
    safe(comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("FeedShedStock binds:", binds);

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_FEED_SHED_STOCK_SUMMARY(?,?,?,?,?,?,?,?,?)`,
    binds,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true,
        message: rows[0]["SP_INS_FEED_SHED_STOCK_SUMMARY"],
      });
    },
  });
};

// ── 8. Feed Supply ────────────────────────────────────
// CALL SP('MERLA','LAYER-1','FLOCK16','2026-04-19','LMW','COMMENTS','WHO')
const insertFeedSupply = (req, res) => {
  const {
    farm_name,
    shed_no,
    flock_no,
    supply_date,
    feed_type,
    comments,
    who_created,
  } = req.body;

  const binds = [
    safe(farm_name, "MERLA_FARMS"),
    safe(shed_no),
    safe(flock_no),
    safe(supply_date),
    safe(feed_type),
    safe(comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("FeedSupply binds:", binds);

  connection.execute({
    sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_FEED_SUPPLY(?,?,?,?,?,?,?)`,
    binds,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: rows[0]["SP_INS_FEED_SUPPLY"] });
    },
  });
};

// ── Fetch Egg Productions ─────────────────────────────
const fetchEggProductions = (req, res) => {
  connection.execute({
    sqlText: `
      SELECT FARM_NAME, SHED_NO, FLOCK_NO, PRODUCTION_DATE,
        TRANSACTION_TYPE, EGG_TYPE, EGG_COUNT, TRIP_NO,
        COMMNETS, WHO_CREATED, WHEN_CREATED
      FROM MERLAFARMS.TRANSACTION.DAILY_EGG_PRODUCTION_SUMMARY
      ORDER BY WHEN_CREATED DESC
      LIMIT 100
    `,
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    },
  });
};

module.exports = {
  insertEggProduction,
  insertBirdLiveStock,
  insertEggGodownStock,
  insertEggSaleSummary,
  insertFeedConsumption,
  insertFeedProduction,
  insertFeedShedStock,
  insertFeedSupply,
  fetchEggProductions,
};
