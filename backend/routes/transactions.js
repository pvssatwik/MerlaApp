const express = require("express");
const router = express.Router();

const {
  insertEggProduction,
  insertBirdLiveStock,
  insertEggGodownStock,
  insertEggSaleSummary,
  insertFeedConsumption,
  insertFeedProduction,
  insertFeedShedStock,
  insertFeedSupply,
  fetchEggProductionSummary,
  fetchEggStockSummary,
  fetchEggSalesSummary,
  fetchCullBirdsSummary,
  fetchGodownSyloStock,
  insertShedEggProduction,
  insertShedFeedReceived,
  fetchEggProductions,
  fetchShedEggProductionSummary,
  fetchShedEggBalance,
  fetchShedFeedBalance,
  fetchConsolidatedSummary,
} = require("../controllers/eggProductionController");

const {
  verifyToken,
  checkRole,
  checkShedAccess,
  checkDateRestriction,
} = require("../middleware/auth");
const dropdownController = require("../controllers/dropDownController");

// Define role groups
const SUPERVISOR_ROLES = [
  "SUPERVISORS",
  "EGG_GODOWN_SUPERVISOR",
  "FEED_GODOWN_SUPERVISOR",
  "6",
  "7",
  "8",
];

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "INCHARGE",
  "EGG_GODOWN_INCHARGE",
  "FEED_GODOWN_INCHARGE",
  "1",
  "2",
  "3",
  "4",
  "5",
];

const SUPERADMIN_ONLY = ["SUPER_ADMIN", "1"];
// ── All transaction routes require auth ───────────────
router.use(verifyToken);

// ── Transaction routes ────────────────────────────────
router.post("/egg-production", insertEggProduction);
router.post("/bird-live-stock", insertBirdLiveStock);
router.post("/egg-godown-stock", insertEggGodownStock);
router.post("/egg-sale-summary", insertEggSaleSummary);
router.post("/feed-consumption", insertFeedConsumption);
router.post("/feed-production", insertFeedProduction);
router.post("/feed-shed-stock", insertFeedShedStock);
router.post("/feed-supply", insertFeedSupply);
router.post("/shed-egg-production", insertShedEggProduction);
router.post("/shed-feed-received", insertShedFeedReceived);

const blockSupervisors = (req, res, next) => {
  const role = req.user?.role;

  if (SUPERVISOR_ROLES.includes(role)) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Supervisors cannot access summary reports.",
    });
  }

  next();
};

// ── Summary view routes ───────────────────────────────
router.get(
  "/egg-production-summary",
  blockSupervisors,
  fetchEggProductionSummary,
);

router.get("/egg-stock-summary", blockSupervisors, fetchEggStockSummary);

router.get("/egg-sales-summary", blockSupervisors, fetchEggSalesSummary);

router.get("/cull-birds-summary", blockSupervisors, fetchCullBirdsSummary);

router.get("/godown-sylo-stock", blockSupervisors, fetchGodownSyloStock);

router.get(
  "/shed-egg-production-summary",
  blockSupervisors,
  fetchShedEggProductionSummary,
);

router.get("/shed-egg-balance", blockSupervisors, fetchShedEggBalance);

router.get("/shed-feed-balance", blockSupervisors, fetchShedFeedBalance);

router.get(
  "/consolidated-summary",
  checkRole("SUPER_ADMIN", "1"),
  fetchConsolidatedSummary,
);

// ── Dropdown routes ───────────────────────────────────
router.get("/dropdowns/sheds", dropdownController.getSheds);
router.get("/dropdowns/flocks", dropdownController.getFlocks);
router.get("/dropdowns/flocks/:shedName", dropdownController.getFlocksByShed);
router.get("/dropdowns/feeds", dropdownController.getFeeds);
router.get("/dropdowns/egg-types", dropdownController.getEggTypes);
router.get("/dropdowns/bird-loss-types", dropdownController.getBirdLossTypes);
router.get(
  "/dropdowns/egg-transactions",
  dropdownController.getEggTransactionTypes,
);
router.get("/dropdowns/trips", dropdownController.getTrips);

module.exports = router;
