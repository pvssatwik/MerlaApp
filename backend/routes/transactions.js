const express = require('express');
const router  = express.Router();
const {
  insertEggProduction,
  fetchEggProductions
} = require('../controllers/eggProductionController');

router.get('/egg-production',  fetchEggProductions);
router.post('/egg-production', insertEggProduction);

module.exports = router;