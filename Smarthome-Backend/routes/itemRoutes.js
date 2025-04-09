const express = require("express");
const router = express.Router();
const { createItem, getItems } = require("../controllers/itemController");
const authenticate = require("../middleware/authMiddleware");

router.post("/", authenticate, createItem);
router.get("/", authenticate, getItems);

module.exports = router;
