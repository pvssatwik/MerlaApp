const express = require('express');
const router  = express.Router();

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
} = require('../controllers/eggProductionController');

const { verifyToken, checkShedAccess, checkDateRestriction } = require('../middleware/auth');
const dropdownController = require('../controllers/dropdownController');

// ── All transaction routes require auth ───────────────
router.use(verifyToken);

// ── Transaction routes ────────────────────────────────
router.post('/egg-production',   insertEggProduction);
router.post('/bird-live-stock',  insertBirdLiveStock);
router.post('/egg-godown-stock', insertEggGodownStock);
router.post('/egg-sale-summary', insertEggSaleSummary);
router.post('/feed-consumption', insertFeedConsumption);
router.post('/feed-production',  insertFeedProduction);
router.post('/feed-shed-stock',  insertFeedShedStock);
router.post('/feed-supply',      insertFeedSupply);

// ── Summary view routes ───────────────────────────────
router.get('/egg-production-summary',  fetchEggProductionSummary);
router.get('/egg-stock-summary',       fetchEggStockSummary);
router.get('/egg-sales-summary',       fetchEggSalesSummary);
router.get('/cull-birds-summary',      fetchCullBirdsSummary);
router.get('/godown-sylo-stock',       fetchGodownSyloStock);

// ── Dropdown routes ───────────────────────────────────
router.get('/dropdowns/sheds',              dropdownController.getSheds);
router.get('/dropdowns/flocks',             dropdownController.getFlocks);
router.get('/dropdowns/flocks/:shedNo',     dropdownController.getFlocksByShed);
router.get('/dropdowns/feeds',              dropdownController.getFeeds);
router.get('/dropdowns/egg-types',          dropdownController.getEggTypes);
router.get('/dropdowns/bird-loss-types',    dropdownController.getBirdLossTypes);
router.get('/dropdowns/egg-transactions',   dropdownController.getEggTransactionTypes);
router.get('/dropdowns/trips',              dropdownController.getTrips);

module.exports = router;