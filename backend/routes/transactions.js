const express = require('express');
const router = express.Router();
const {
  insertEggProduction,
  insertBirdLiveStock,
  insertFeedConsumption,
  fetchEggProductions
} = require('../controllers/eggProductionController');

router.get('/egg-production',  fetchEggProductions);
router.post('/egg-production', insertEggProduction);
router.post('/bird-live-stock',  insertBirdLiveStock);
router.post('/feed-consumption', insertFeedConsumption);

module.exports = router;