const express = require("express");
const { searchUsers, getUserById } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, searchUsers);
router.get("/:id", protect, getUserById);

module.exports = router;
