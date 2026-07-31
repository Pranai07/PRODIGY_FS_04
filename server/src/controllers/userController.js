const prisma = require("../config/prisma");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
// GET ALL USERS EXCEPT LOGGED-IN USER
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: req.user.id,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        lastSeen : true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ==========================================
// GET LOGGED-IN USER PROFILE
// ==========================================

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        lastSeen : true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ==========================================
// UPDATE LOGGED-IN USER PROFILE
// ==========================================

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    const cleanName = name?.trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters",
      });
    }

    if (cleanName.length > 50) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot exceed 50 characters",
      });
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          name: cleanName,
        },

        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          lastSeen : true,
          createdAt: true,
          updatedAt: true,
        },
      });
    const io = req.app.get("io");

    if (io) {
      io.emit(
        "user:profile-updated",
        updatedUser
      );
    }
    
    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ==========================================
// UPDATE PROFILE AVATAR
// ==========================================

const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a profile picture",
      });
    }

    // ======================================
    // UPLOAD AVATAR TO CLOUDINARY
    // ======================================

    const uploadResult =
      await new Promise(
        (resolve, reject) => {
          const uploadStream =
            cloudinary.uploader.upload_stream(
              {
                folder: "chatz/avatars",
                resource_type: "image",

                // Keep avatars reasonably sized
                transformation: [
                  {
                    width: 500,
                    height: 500,
                    crop: "fill",
                    gravity: "face",
                  },
                ],
              },

              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );

          const readable =
            new Readable();

          readable.push(
            req.file.buffer
          );

          readable.push(null);

          readable.pipe(
            uploadStream
          );
        }
      );

    // ======================================
    // SAVE AVATAR URL TO USER
    // ======================================

    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          avatar:
            uploadResult.secure_url,
        },

        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          lastSeen : true,
          createdAt: true,
          updatedAt: true,
        },
      });
    const io = req.app.get("io");

    if (io) {
      io.emit(
        "user:profile-updated",
        updatedUser
      );
    }
    return res.status(200).json({
      success: true,
      message:
        "Profile picture updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Update avatar error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update profile picture",
    });
  }
};

module.exports = {
  getUsers,
  getProfile,
  updateProfile,
  updateAvatar,
};