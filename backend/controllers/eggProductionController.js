const { execute } = require("../db/snowflake");

const safe = (val, def = "") => (val !== undefined && val !== null ? val : def);
const safeNum = (val) => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

// ── 1. Egg Production ─────────────────────────────────
const insertEggProduction = async (req, res) => {
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

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_EGG_PRODUCTION_SUMMARY(?,?,?,?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_DAILY_EGG_PRODUCTION_SUMMARY"],
    });
  } catch (err) {
    console.error("EggProduction error:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 2. Bird Live Stock ────────────────────────────────
// ── 2. Bird Live Stock ───────────────────────────────
const insertBirdLiveStock = async (req, res) => {
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

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_BIRD_LIVE_STOCK(?,?,?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_DAILY_BIRD_LIVE_STOCK"],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 3. Egg Godown Stock ───────────────────────────────
const insertEggGodownStock = async (req, res) => {
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

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_EGG_GODOWN_STOCK(?,?,?,?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_EGG_GODOWN_STOCK"],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 4. Egg Sale Summary ───────────────────────────────
const insertEggSaleSummary = async (req, res) => {
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

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_EGG_SALE_SUMMARY(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_EGG_SALE_SUMMARY"],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 5. Feed Consumption ───────────────────────────────
const insertFeedConsumption = async (req, res) => {
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

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_FEED_CONSUMPTION(?,?,?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_DAILY_FEED_CONSUMPTION"],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 6. Feed Production ────────────────────────────────
const insertFeedProduction = async (req, res) => {
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

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_FEED_PRODUCTION(?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_FEED_PRODUCTION"],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 7. Feed Shed Stock ────────────────────────────────
const insertFeedShedStock = async (req, res) => {
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

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_FEED_SHED_STOCK_SUMMARY(?,?,?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_FEED_SHED_STOCK_SUMMARY"],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 8. Feed Supply ────────────────────────────────────
const insertFeedSupply = async (req, res) => {
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

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_FEED_SUPPLY(?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_FEED_SUPPLY"],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── 9. Fetch Egg Productions list ─────────────────────
const fetchEggProductions = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT FARM_NAME, SHED_NO, FLOCK_NO, PRODUCTION_DATE,
          TRANSACTION_TYPE, EGG_TYPE, EGG_COUNT, TRIP_NO,
          COMMNETS, WHO_CREATED, WHEN_CREATED
        FROM MERLAFARMS.TRANSACTION.DAILY_EGG_PRODUCTION_SUMMARY
        ORDER BY WHEN_CREATED DESC
        LIMIT 100
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── 10. Fetch Egg Production Summary View ─────────────
const fetchEggProductionSummary = async (req, res) => {
  const { filter, start_date, end_date } = req.query;

  let dateCondition = "";

  switch (filter) {
    case "today":
      dateCondition = `WHERE CAST(PRODUCTION_DATE AS DATE) = CURRENT_DATE`;
      break;
    case "week":
      dateCondition = `WHERE CAST(PRODUCTION_DATE AS DATE) >= DATEADD(day, -7, CURRENT_DATE)`;
      break;
    case "month":
      dateCondition = `WHERE CAST(PRODUCTION_DATE AS DATE) >= DATEADD(month, -1, CURRENT_DATE)`;
      break;
    case "year":
      dateCondition = `WHERE CAST(PRODUCTION_DATE AS DATE) >= DATEADD(year, -1, CURRENT_DATE)`;
      break;
    case "custom":
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: "start_date and end_date are required",
        });
      }
      dateCondition = `WHERE CAST(PRODUCTION_DATE AS DATE) BETWEEN '${start_date}' AND '${end_date}'`;
      break;
    default:
      dateCondition = `WHERE CAST(PRODUCTION_DATE AS DATE) = CURRENT_DATE`;
  }

  console.log("EggProductionSummary filter:", filter, dateCondition);

  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          PRODUCTION_DATE,
          FLOCK_NAME,
          SHED_NO,
          AGE_WEEK,
          AGE_DAY,
          EGGS_PROD_COUNT,
          EGG_PRODUCTION_CHANGE,
          TARGET_PCT,
          ACTUAL_PCT,
          DIFF_PCT
        FROM MERLAFARMS.TRANSACTION.VW_DAILY_EGG_PRODUCTION_SUMMARY
        ${dateCondition}
        ORDER BY PRODUCTION_DATE DESC, SHED_NO ASC
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Summary view error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── 11. Egg Stock View ────────────────────────────────
const fetchEggStockSummary = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          OPENING_BAL,
          PRODUCTION,
          TOTAL,
          SALES,
          CLOSING_BALANCE,
          MEDIUM_EGGS,
          PULLETS
        FROM MERLAFARMS.TRANSACTION.VW_DAILY_EGG_STOCK
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── 12. Egg Sales View ────────────────────────────────
const fetchEggSalesSummary = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          FARM_NAME,
          SHED_NO,
          FLOCK_NO,
          EGGS,
          DAMAGED,
          PULLETS,
          MEDIUM_EGGS,
          TOTAL,
          DAMAGE_PCT
        FROM MERLAFARMS.TRANSACTION.VW_DAILY_EGG_SALES
        ORDER BY SHED_NO ASC
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── 13. Cull Birds View ───────────────────────────────
const fetchCullBirdsSummary = async (req, res) => {
  const { filter, start_date, end_date } = req.query;

  let dateCondition = "";

  switch (filter) {
    case "today":
      dateCondition = `WHERE REPORTING_DATE = CURRENT_DATE`;
      break;
    case "week":
      dateCondition = `WHERE REPORTING_DATE >= DATEADD(day, -7, CURRENT_DATE)`;
      break;
    case "month":
      dateCondition = `WHERE REPORTING_DATE >= DATEADD(month, -1, CURRENT_DATE)`;
      break;
    case "year":
      dateCondition = `WHERE REPORTING_DATE >= DATEADD(year, -1, CURRENT_DATE)`;
      break;
    case "custom":
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: "start_date and end_date required",
        });
      }
      dateCondition = `WHERE REPORTING_DATE BETWEEN '${start_date}' AND '${end_date}'`;
      break;
    default:
      dateCondition = `WHERE REPORTING_DATE = CURRENT_DATE`;
  }

  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          FARM_NAME,
          SHED_NO,
          FLOCK_NO,
          REPORTING_DATE,
          OPENING_BALANCE,
          COUNTER,
          TOTAL,
          SALES,
          DEATH,
          TOTAL_SALES,
          CLOSING_BALANCE
        FROM MERLAFARMS.TRANSACTION.VW_CULL_BIRDS
        ${dateCondition}
        ORDER BY REPORTING_DATE DESC, SHED_NO ASC
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── 14. Godown Sylo Stock View ────────────────────────
const fetchGodownSyloStock = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          SYLO_NO,
          FEED_TYPE,
          FEED_BALANCE
        FROM MERLAFARMS.TRANSACTION.VW_GODOWN_SYLO_STOCK
        ORDER BY SYLO_NO ASC
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Consolidated Summary (SUPERADMIN only) ────────────
const fetchConsolidatedSummary = async (req, res) => {
  const { filter, start_date, end_date } = req.query;

  const dateCondition = buildDateCondition(
    "PRODUCTION_DATE",
    filter,
    start_date,
    end_date,
  );

  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          PRODUCTION_DATE,
          FARM_NAME,
          SHED_NO,
          FLOCK_NAME,
          AGE_WEEK,
          AGE_DAY,
          EGGS_PROD_COUNT,
          EGG_PRODUCTION_CHANGE,
          TARGET_PCT,
          ACTUAL_PCT,
          DIFF_PCT,
          PREVIOUS_DAY_BIRD_COUNT,
          MORTALITY_LOSS,
          COUNTER_LOSS,
          CURRENT_DAY_BIRD_COUNT,
          FEED_USED,
          FEED_GRAMS_PER_BIRD,
          DAILY_EGGS_PER_TON_FEED,
          AVG_MONTHLY_FEED_GRAMS_PER_BIRD
        FROM MERLAFARMS.TRANSACTION.VW_DAILY_CONSOLIDATED_SUMMARY
        ${dateCondition}
        ORDER BY PRODUCTION_DATE DESC, SHED_NO ASC
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Shed Egg Production Summary ───────────────────────
const fetchShedEggProductionSummary = async (req, res) => {
  const { filter, start_date, end_date } = req.query;

  const dateCondition = buildDateCondition(
    "PRODUCTION_DATE",
    filter,
    start_date,
    end_date,
  );

  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          FARM_NAME,
          PRODUCTION_DATE,
          FLOCK_NAME,
          SHED_NO,
          EGG_TYPE,
          DAILY_EGGS_PROD_COUNT
        FROM MERLAFARMS.TRANSACTION.VW_DAILY_EGG_SHED_PRODUCTION_SUMMARY
        ${dateCondition}
        ORDER BY PRODUCTION_DATE DESC, SHED_NO ASC
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Shed Egg Balance ──────────────────────────────────
const fetchShedEggBalance = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          FARM_NAME,
          FLOCK_NAME,
          SHED_NO,
          SHED_BALANCE_EGG_COUNT
        FROM MERLAFARMS.TRANSACTION.VW_DAILY_EGG_SHED_EGG_BALANCE
        ORDER BY SHED_NO ASC
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Shed Feed Balance ─────────────────────────────────
const fetchShedFeedBalance = async (req, res) => {
  try {
    const { rows } = await execute({
      sqlText: `
        SELECT
          FARM_NAME,
          FLOCK_NAME,
          SHED_NO,
          FEED_TYPE,
          SHED_BALANCE_FEED
        FROM MERLAFARMS.TRANSACTION.VW_DAILY_EGG_SHED_FEED_BALANCE
        ORDER BY SHED_NO ASC, FEED_TYPE ASC
      `,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Helper for date conditions
const buildDateCondition = (dateCol, filter, start_date, end_date) => {
  switch (filter) {
    case "today":
      return `WHERE ${dateCol} = CURRENT_DATE`;
    case "week":
      return `WHERE ${dateCol} >= DATEADD(day, -7, CURRENT_DATE)`;
    case "month":
      return `WHERE ${dateCol} >= DATEADD(month, -1, CURRENT_DATE)`;
    case "year":
      return `WHERE ${dateCol} >= DATEADD(year, -1, CURRENT_DATE)`;
    case "custom":
      if (start_date && end_date)
        return `WHERE ${dateCol} BETWEEN '${start_date}' AND '${end_date}'`;
    default:
      return "";
  }
};

// ── Shed Egg Production ───────────────────────────────
const insertShedEggProduction = async (req, res) => {
  const {
    farm_name,
    shed_no,
    flock_no,
    production_date,
    transaction_type,
    egg_type,
    egg_count,
    batch_no,
    comments,
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
    safe(batch_no),
    safe(comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("ShedEggProduction binds:", binds);

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_SHED_EGG_PRODUCTION(?,?,?,?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_DAILY_SHED_EGG_PRODUCTION"],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ── Shed Feed Received ────────────────────────────────
const insertShedFeedReceived = async (req, res) => {
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
    safe(feed_used), // VARCHAR per SP definition
    safeNum(feed_balance),
    safe(comments),
    safe(who_created, "APP_USER"),
  ];

  console.log("ShedFeedReceived binds:", binds);

  try {
    const { rows } = await execute({
      sqlText: `CALL MERLAFARMS.TRANSACTION.SP_INS_DAILY_SHED_FEED_RECEIVED(?,?,?,?,?,?,?,?,?)`,
      binds,
    });

    return res.json({
      success: true,
      message: rows[0]["SP_INS_DAILY_SHED_FEED_RECEIVED"],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
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
  fetchEggProductionSummary,
  fetchEggStockSummary,
  fetchEggSalesSummary,
  fetchCullBirdsSummary,
  fetchGodownSyloStock,
  insertShedEggProduction,
  insertShedFeedReceived,
  fetchShedEggProductionSummary,
  fetchShedEggBalance,
  fetchShedFeedBalance,
  buildDateCondition,
  fetchConsolidatedSummary,
};
