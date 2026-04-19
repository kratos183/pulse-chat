const express = require("express");
const {
  sendMessage,
  getMessages,
  markAsRead,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Multer only runs for file uploads (multipart/form-data).
// For plain text messages (JSON), multer is skipped so req.body is parsed correctly.
const optionalUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    upload.array("attachments", 5)(req, res, next);
  } else {
    next();
  }
};

router.post("/", protect, optionalUpload, sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/read/:chatId", protect, markAsRead);

module.exports = router;
