const express = require("express");
const router = express.Router();
const { createItem, getItems,getAllItemsByHome } = require("../controllers/itemController");
const authenticate = require("../middleware/authMiddleware");

router.post("/", authenticate, createItem);
router.get("/", authenticate, getItems);
router.get("/all", authenticate, getAllItemsByHome);


module.exports = router;
