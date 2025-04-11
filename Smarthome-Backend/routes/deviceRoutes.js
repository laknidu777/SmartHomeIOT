const express = require("express");
const router = express.Router();
const { getDeviceStatus } = require("../controllers/deviceController");

router.get("/:espId", getDeviceStatus);

module.exports = router;
