const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");

router.get("/", healthController.getHealth);
router.post("/log", healthController.logValue);

module.exports = router;
