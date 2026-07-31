const express = require("express");

const {
  sendMessage,
  getMessages,
  sendRoomMessage,
  getRoomMessages,
  sendAttachment,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
  markMessageAsDelivered,
  markPendingMessagesAsDelivered,
  getUnreadCounts,
} = require("../controllers/messageController");

const {
  toggleReaction,
  removeReaction,
} = require("../controllers/reactionController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// ==============================
// PRIVATE TEXT MESSAGE
// ==============================

router.post(
  "/",
  protect,
  sendMessage
);

// ==============================
// ATTACHMENTS
// Private chats + rooms
// ==============================

router.post(
  "/attachment",
  protect,
  upload.single("file"),
  sendAttachment
);

// ==============================
// MESSAGE REACTIONS
// Private chats + rooms
// ==============================

// Click same emoji again = toggle/remove
router.post(
  "/:messageId/reactions",
  protect,
  toggleReaction
);

// Explicitly remove an emoji reaction
router.delete(
  "/:messageId/reactions",
  protect,
  removeReaction
);

// ==============================
// ROOM MESSAGES
// ==============================

router.post(
  "/room",
  protect,
  sendRoomMessage
);

router.get(
  "/room/:roomId",
  protect,
  getRoomMessages
);

router.patch(
  "/conversation/:conversationId/read",
  protect,
  markMessagesAsRead
);
router.get(
  "/unread/counts",
  protect,
  getUnreadCounts
);
router.patch(
  "/pending/delivered",
  protect,
  markPendingMessagesAsDelivered
);
router.patch(
  "/:messageId/delivered",
  protect,
  markMessageAsDelivered
);


router.patch(
  "/:messageId",
  protect,
  editMessage
);

router.delete(
  "/:messageId",
  protect,
  deleteMessage
);

router.get(
  "/:conversationId",
  protect,
  getMessages
);

module.exports = router;