const express = require("express");
const router = express.Router();
const { createHome, getHomes } = require("../controllers/homeController");
const authenticate = require("../middleware/authMiddleware");

router.post("/", authenticate, createHome);   // Create a new home
router.get("/", authenticate, getHomes);      // Get all homes for current user

module.exports = router;
