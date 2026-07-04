const express = require("express");
const router = express.Router();
const {
  insertEggProduction,
} = require("../controllers/eggProductionController");

router.post("/insert", insertEggProduction);

module.exports = router;