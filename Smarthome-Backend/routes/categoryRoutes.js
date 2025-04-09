const express = require("express");
const router = express.Router();
const { createCategory, getCategories } = require("../controllers/categoryController");
const authenticate = require("../middleware/authMiddleware");

router.post("/", authenticate, createCategory);
router.get("/", authenticate, getCategories);

module.exports = router;
