// Tijara\backend\routes\api.js
const express = require("express");
const router = express.Router();
const { getMessage } = require("../controllers/apiController");

router.get("/message", getMessage);

module.exports = router;