const multer = require("multer");

const storage = multer.memoryStorage();

const allowedAvatarTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const fileFilter = (
  req,
  file,
  cb
) => {
  if (
    allowedAvatarTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Profile picture must be a JPG, PNG, or WEBP image."
      ),
      false
    );
  }
};

const avatarUpload = multer({
  storage,

  limits: {
    // Maximum avatar size: 5 MB
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

module.exports = avatarUpload;