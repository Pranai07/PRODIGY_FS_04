const {
  createRoom,
  getRooms,
  getMyRooms,
  joinRoom,
  leaveRoomController,
  getRoomMembersController,
  renameRoomController,
  deleteRoomController,
  removeRoomMemberController,
} = require("../controllers/roomController");


const express = require("express");



const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createRoom);

router.get("/", protect, getRooms);

// IMPORTANT: Keep /my before any future /:roomId GET route
router.get("/my", protect, getMyRooms);

router.post("/:roomId/join", protect, joinRoom);

router.patch(
  "/:roomId/rename",
  protect,
  renameRoomController,
);

router.delete(
  "/:roomId/leave",
  protect,
  leaveRoomController
);

router.get("/test", (req, res) => {
  res.json({ message: "Room routes working!" });
});

router.get(
  "/:roomId/members",
  protect,
  getRoomMembersController
);
router.delete(
  "/:roomId/members/:userId",
  protect,
  removeRoomMemberController
);
router.delete(
  "/:roomId",
  protect,
  deleteRoomController
);


module.exports = router;