const express = require("express");
const router = express.Router();
const { getDeviceStatus,updateDeviceStatus,pairDevice } = require("../controllers/deviceController");

router.post("/pair", pairDevice);
router.get("/:espId", getDeviceStatus);
router.put("/:espId", updateDeviceStatus);
module.exports = router;
