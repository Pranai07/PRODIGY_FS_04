const express = require("express");

const {
  createOrGetConversation,
  getPrivateUnreadCounts,
} = require("../controllers/conversationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// PRIVATE CONVERSATION ROUTES
// ==========================================

// Get persistent private unread counts
// IMPORTANT: Keep this above any future /:id route
router.get(
  "/unread",
  protect,
  getPrivateUnreadCounts
);

// Create or get private conversation
router.post(
  "/",
  protect,
  createOrGetConversation
);

module.exports = router;