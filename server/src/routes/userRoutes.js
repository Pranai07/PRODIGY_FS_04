const express = require("express");

const {
  getUsers,getProfile,updateProfile,updateAvatar,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const avatarUpload = require(
  "../middleware/avatarUploadMiddleware"
);
const router = express.Router();

router.get(
  "/profile",
  protect,
  getProfile
);

router.patch(
  "/profile",
  protect,
  updateProfile
);
router.patch(
  "/profile/avatar",
  protect,
  avatarUpload.single("avatar"),
  updateAvatar
);
router.get("/", protect, getUsers);

module.exports = router;