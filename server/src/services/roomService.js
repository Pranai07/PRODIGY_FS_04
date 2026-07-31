const prisma = require("../config/prisma");

const leaveRoom = async (roomId, userId) => {
  const membership = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId,
      },
    },
  });

  if (!membership) {
    throw new Error(
      "You are not a member of this room."
    );
  }

  await prisma.roomMember.delete({
    where: {
      userId_roomId: {
        userId,
        roomId,
      },
    },
  });

  return true;
};
const getRoomMembers = async (roomId) => {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  return room.members.map((member) => ({
    ...member.user,
    joinedAt: member.joinedAt,
  }));
};

const renameRoom = async (roomId, userId, newName) => {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.creatorId !== userId) {
    throw new Error("Only the room creator can rename the room.");
  }

  const updatedRoom = await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      name: newName.trim(),
    },
  });

  return updatedRoom;
};

const deleteRoom = async (roomId, userId) => {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.creatorId !== userId) {
    throw new Error("Only the room creator can delete this room.");
  }

  await prisma.room.delete({
    where: {
      id: roomId,
    },
  });

  return true;
};

const removeRoomMember = async (
  roomId,
  requesterId,
  memberUserId
) => {
  // Find the room
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  // Only the creator can remove members
  if (room.creatorId !== requesterId) {
    throw new Error(
      "Only the room creator can remove members."
    );
  }

  // Creator cannot remove themselves
  if (memberUserId === requesterId) {
    throw new Error(
      "Room creator cannot remove themselves."
    );
  }

  // Check whether target user belongs to this room
  const membership =
    await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          roomId,
          userId: memberUserId,
        },
      },
    });

  if (!membership) {
    throw new Error(
      "This user is not a member of the room."
    );
  }

  // Remove membership
  await prisma.roomMember.delete({
    where: {
      userId_roomId: {
        roomId,
        userId: memberUserId,
      },
    },
  });

  return {
    userId: memberUserId,
    roomId,
  };
};

module.exports = {
  leaveRoom,
  getRoomMembers,
  renameRoom,
  deleteRoom,
  removeRoomMember,
};