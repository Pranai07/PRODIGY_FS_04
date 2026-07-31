const prisma = require("../config/prisma");

// ==========================================
// VERIFY USER CAN ACCESS MESSAGE
// ==========================================

const getMessageAccess = async (
  userId,
  messageId
) => {
  const message =
    await prisma.message.findUnique({
      where: {
        id: messageId,
      },

      select: {
        id: true,
        conversationId: true,
        roomId: true,
      },
    });

  if (!message) {
    return {
      success: false,
      status: 404,
      message: "Message not found",
    };
  }

  // ========================================
  // PRIVATE CONVERSATION ACCESS
  // ========================================

  if (message.conversationId) {
    const membership =
      await prisma.conversationMember.findUnique({
        where: {
          userId_conversationId: {
            userId,
            conversationId:
              message.conversationId,
          },
        },
      });

    if (!membership) {
      return {
        success: false,
        status: 403,
        message:
          "You are not a member of this conversation",
      };
    }
  }

  // ========================================
  // ROOM ACCESS
  // ========================================

  if (message.roomId) {
    const membership =
      await prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId,
            roomId: message.roomId,
          },
        },
      });

    if (!membership) {
      return {
        success: false,
        status: 403,
        message:
          "You are not a member of this room",
      };
    }
  }

  if (
    !message.conversationId &&
    !message.roomId
  ) {
    return {
      success: false,
      status: 400,
      message:
        "Message does not belong to a conversation or room",
    };
  }

  return {
    success: true,
    messageData: message,
  };
};

// ==========================================
// GET UPDATED REACTIONS
// ==========================================

const getUpdatedReactions = async (
  messageId
) => {
  return await prisma.messageReaction.findMany({
    where: {
      messageId,
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },

    orderBy: {
      createdAt: "asc",
    },
  });
};

// ==========================================
// EMIT REAL-TIME REACTION UPDATE
// ==========================================

const emitReactionUpdate = (
  req,
  message,
  reactions
) => {
  const io = req.app.get("io");

  if (!io) {
    return;
  }

  const payload = {
    messageId: message.id,

    conversationId:
      message.conversationId,

    roomId:
      message.roomId,

    reactions,
  };

  // Private conversation
  if (message.conversationId) {
    io
      .to(
        `conversation:${message.conversationId}`
      )
      .emit(
        "message:reaction:update",
        payload
      );
  }

  // Room
  if (message.roomId) {
    io
      .to(
        `room:${message.roomId}`
      )
      .emit(
        "room:reaction:update",
        payload
      );
  }
};

// ==========================================
// TOGGLE REACTION
//
// POST /api/messages/:messageId/reactions
//
// Body:
// {
//   "emoji": "👍"
// }
//
// First click  -> adds reaction
// Second click -> removes reaction
// ==========================================

const toggleReaction = async (
  req,
  res
) => {
  try {
    const userId =
      req.user.id;

    const {
      messageId,
    } = req.params;

    const emoji =
      typeof req.body.emoji === "string"
        ? req.body.emoji.trim()
        : "";

    // ======================================
    // VALIDATE EMOJI
    // ======================================

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message:
          "Emoji is required",
      });
    }

    // Prevent arbitrary large strings
    if (emoji.length > 32) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid emoji",
      });
    }

    // ======================================
    // VERIFY MESSAGE ACCESS
    // ======================================

    const access =
      await getMessageAccess(
        userId,
        messageId
      );

    if (!access.success) {
      return res
        .status(access.status)
        .json({
          success: false,
          message:
            access.message,
        });
    }

    const message =
      access.messageData;

    // ======================================
    // CHECK EXISTING REACTION
    // ======================================

    const existingReaction =
      await prisma.messageReaction.findUnique({
        where: {
          userId_messageId_emoji: {
            userId,
            messageId,
            emoji,
          },
        },
      });

    let action;

    // ======================================
    // REMOVE IF ALREADY EXISTS
    // ======================================

    if (existingReaction) {
      await prisma.messageReaction.delete({
        where: {
          id:
            existingReaction.id,
        },
      });

      action = "removed";
    }

    // ======================================
    // OTHERWISE ADD REACTION
    // ======================================

    else {
      await prisma.messageReaction.create({
        data: {
          userId,
          messageId,
          emoji,
        },
      });

      action = "added";
    }

    // ======================================
    // GET COMPLETE UPDATED REACTIONS
    // ======================================

    const reactions =
      await getUpdatedReactions(
        messageId
      );

    // ======================================
    // SOCKET.IO UPDATE
    // ======================================

    emitReactionUpdate(
      req,
      message,
      reactions
    );

    return res.status(200).json({
      success: true,
      action,
      messageId,
      reactions,
    });
  } catch (error) {
    console.error(
      "Toggle reaction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ==========================================
// REMOVE REACTION EXPLICITLY
//
// DELETE /api/messages/:messageId/reactions
//
// Body:
// {
//   "emoji": "👍"
// }
// ==========================================

const removeReaction = async (
  req,
  res
) => {
  try {
    const userId =
      req.user.id;

    const {
      messageId,
    } = req.params;

    const emoji =
      typeof req.body.emoji === "string"
        ? req.body.emoji.trim()
        : "";

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message:
          "Emoji is required",
      });
    }

    // ======================================
    // VERIFY MESSAGE ACCESS
    // ======================================

    const access =
      await getMessageAccess(
        userId,
        messageId
      );

    if (!access.success) {
      return res
        .status(access.status)
        .json({
          success: false,
          message:
            access.message,
        });
    }

    const message =
      access.messageData;

    // ======================================
    // DELETE REACTION
    // ======================================

    await prisma.messageReaction.deleteMany({
      where: {
        userId,
        messageId,
        emoji,
      },
    });

    // ======================================
    // GET UPDATED REACTIONS
    // ======================================

    const reactions =
      await getUpdatedReactions(
        messageId
      );

    // ======================================
    // SOCKET.IO UPDATE
    // ======================================

    emitReactionUpdate(
      req,
      message,
      reactions
    );

    return res.status(200).json({
      success: true,
      action: "removed",
      messageId,
      reactions,
    });
  } catch (error) {
    console.error(
      "Remove reaction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

module.exports = {
  toggleReaction,
  removeReaction,
};