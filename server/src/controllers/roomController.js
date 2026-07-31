const {
  leaveRoom,
  getRoomMembers,
  renameRoom,
  deleteRoom,
  removeRoomMember,
} = require("../services/roomService");

const prisma = require("../config/prisma");

// CREATE ROOM
const createRoom = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room name is required",
      });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        creatorId,

        // Automatically add creator as a member
        members: {
          create: {
            userId: creatorId,
            lastReadAt : new Date(),
          },
        },
      },

      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },

        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Create room error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// GET ALL ROOMS
const getRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },

        members: {
          select: {
            userId: true,
          },
        },

        _count: {
          select: {
            members: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    console.error("Get rooms error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// GET MY JOINED ROOMS
// ==========================================
// GET MY JOINED ROOMS + PERSISTENT UNREAD
// ==========================================

const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get memberships so we also have
    // the logged-in user's lastReadAt.
    const memberships =
      await prisma.roomMember.findMany({
        where: {
          userId,
        },

        include: {
          room: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },

              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
        },

        orderBy: {
          room: {
            updatedAt: "desc",
          },
        },
      });

    const rooms = await Promise.all(
      memberships.map(
        async (membership) => {
          const messageWhere = {
            roomId: membership.roomId,

            // Never count the logged-in
            // user's own messages as unread.
            senderId: {
              not: userId,
            },
          };

          // Only count messages newer than
          // the user's last read timestamp.
          if (membership.lastReadAt) {
            messageWhere.createdAt = {
              gt: membership.lastReadAt,
            };
          }

          const unreadCount =
            await prisma.message.count({
              where: messageWhere,
            });

          return {
            ...membership.room,
            unreadCount,
          };
        }
      )
    );

    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    console.error(
      "Get my rooms error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// JOIN ROOM
const joinRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const existingMembership =
      await prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId,
            roomId,
          },
        },
      });

    if (existingMembership) {
      return res.status(200).json({
        success: true,
        message: "You are already a member of this room",
      });
    }

    await prisma.roomMember.create({
      data: {
        userId,
        roomId,
        lastReadAt : new Date(),
      },
    });
    const io = req.app.get("io");

    if (io) {
      io.to(`room:${roomId}`).emit(
        "room:members-updated",
        {
          roomId,
          joinedUserId: userId,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Room joined successfully",
    });
  } catch (error) {
    console.error("Join room error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const leaveRoomController = async (req, res) => {
  try {
    const { roomId } = req.params;

    await leaveRoom(roomId, req.user.id);

    const io = req.app.get("io");

    if (io) {
      const roomSockets =
        await io.in(`room:${roomId}`).fetchSockets();
      io.to(`room:${roomId}`).emit(
        "room:members-updated",
        {
          roomId,
          leftUserId: req.user.id,
        }
      );
    }

    return res.json({
      success: true,
      message: "Left room successfully.",
    });
  } catch (error) {
    console.error("Leave room error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getRoomMembersController = async (
  req,
  res
) => {
  try {
    const { roomId } = req.params;

    const members = await getRoomMembers(roomId);

    return res.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get room members error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const renameRoomController = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room name is required.",
      });
    }

    const room = await renameRoom(
      roomId,
      req.user.id,
      name
    );
    const io = req.app.get("io");
    io.to(room.id).emit("room:renamed", room);

    return res.json({
      success: true,
      room,
    });
  } 
  catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
const deleteRoomController = async (req, res) => {
  try {
    const { roomId } = req.params;

    await deleteRoom(roomId, req.user.id);

    const io = req.app.get("io");

    io.to(`room:${roomId}`).emit("room:deleted", {
      roomId,
    });

    return res.json({
      success: true,
      message: "Room deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const removeRoomMemberController = async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    const removedMember = await removeRoomMember(
      roomId,
      req.user.id,
      userId
    );

    const io = req.app.get("io");

    if (io) {
      // Notify the removed user directly
      io.to(`user:${userId}`).emit(
        "room:member-removed",
        {
          roomId,
          userId,
        }
      );

      // Notify everyone still inside the room
      io.to(`room:${roomId}`).emit(
        "room:members-updated",
        {
          roomId,
          removedUserId: userId,
        }
      );
    }

    return res.json({
      success: true,
      message: "Member removed successfully.",
      removedMember,
    });
  } catch (error) {
    console.error(
      "Remove room member error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getMyRooms,
  joinRoom,
  leaveRoomController,
  getRoomMembersController,
  renameRoomController,
  deleteRoomController,
  removeRoomMemberController,
};