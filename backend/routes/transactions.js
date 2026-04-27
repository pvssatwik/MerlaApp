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
  fetchEggProductions,
} = require('../controllers/eggProductionController');

const dropdownController = require('../controllers/dropdownController');

// ── Transaction routes ────────────────────────────────
router.get('/egg-production',    fetchEggProductions);
router.post('/egg-production',   insertEggProduction);
router.post('/bird-live-stock',  insertBirdLiveStock);
router.post('/egg-godown-stock', insertEggGodownStock);
router.post('/egg-sale-summary', insertEggSaleSummary);
router.post('/feed-consumption', insertFeedConsumption);
router.post('/feed-production',  insertFeedProduction);
router.post('/feed-shed-stock',  insertFeedShedStock);
router.post('/feed-supply',      insertFeedSupply);

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