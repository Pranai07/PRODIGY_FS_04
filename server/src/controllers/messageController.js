const prisma = require("../config/prisma");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

// SEND MESSAGE
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { conversationId, content,replyToId } = req.body;

    if (!conversationId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and message content are required",
      });
    }

    // Verify that the logged-in user belongs to this conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        userId_conversationId: {
          userId: senderId,
          conversationId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }
    // ==========================================
    // VALIDATE REPLY MESSAGE
    // ==========================================

    let replyToMessage = null;

    if (replyToId) {
      replyToMessage =
        await prisma.message.findUnique({
          where: {
            id: replyToId,
          },
        });

      if (!replyToMessage) {
        return res.status(404).json({
          success: false,
          message:
            "The message you are replying to was not found",
        });
      }

      // Reply must belong to this same conversation
      if (
        replyToMessage.conversationId !==
        conversationId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot reply to a message from another conversation",
        });
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId,
        conversationId,
        replyToId:
          replyToMessage
            ? replyToMessage.id
            : null,
      },

      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },

        replyTo: {
          select: {
            id: true,
            content: true,
            messageType: true,
            fileName: true,
            isDeleted: true,

            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },

        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });
    // Find the other user in this private conversation
    const recipientMember =
      await prisma.conversationMember.findFirst({
        where: {
          conversationId,
          userId: {
            not: senderId,
          },
        },
      });
    // Send message instantly to connected users
    const io = req.app.get("io");

    if (io) {
      
      let target = io.to(
        `conversation:${conversationId}`
      );

      if (recipientMember) {
        target = target.to(
          `user:${recipientMember.userId}`
        );
      }

      target.emit("message:new", message);
    }

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// GET CONVERSATION MESSAGES
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Verify membership
    const membership =
      await prisma.conversationMember.findUnique({
        where: {
          userId_conversationId: {
            userId,
            conversationId,
          },
        },
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this conversation",
      });
    }

    // Get messages + stored reactions
    const messages =
      await prisma.message.findMany({
        where: {
          conversationId,
        },

        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },

          replyTo: {
            select: {
              id: true,
              content: true,
              messageType: true,
              fileName: true,
              isDeleted: true,

              sender: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },

          reactions: {
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
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    // ==========================================
    // MARK PRIVATE CONVERSATION AS READ
    // ==========================================

    await prisma.conversationMember.update({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },

      data: {
        lastReadAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// SEND ROOM MESSAGE
const sendRoomMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { roomId, content ,replyToId } = req.body;

    if (!roomId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room ID and message content are required",
      });
    }

    // Only room members can send messages
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: senderId,
          roomId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room",
      });
    }
    // ==========================================
    // VALIDATE REPLY MESSAGE
    // ==========================================

    let replyToMessage = null;

    if (replyToId) {
      replyToMessage =
        await prisma.message.findUnique({
          where: {
            id: replyToId,
          },
        });

      if (!replyToMessage) {
        return res.status(404).json({
          success: false,
          message:
            "The message you are replying to was not found",
        });
      }

      // Original message must belong
      // to the same room.
      if (
        replyToMessage.roomId !== roomId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot reply to a message from another room",
        });
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId,
        roomId,
        replyToId:
        replyToMessage
          ? replyToMessage.id
          : null,
      },

      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },

        replyTo: {
          select: {
            id: true,
            content: true,
            messageType: true,
            fileName: true,
            isDeleted: true,

            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },

        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Update room activity timestamp
    await prisma.room.update({
      where: {
        id: roomId,
      },

      data: {
        updatedAt: new Date(),
      },
    });

    // Broadcast to users currently connected to this room
    const io = req.app.get("io");

    if (io) {
      io
        .to(`room:${roomId}`)
        .emit("room:message:new", message);
    }

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send room message error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ==========================================
// GET ROOM MESSAGE HISTORY + MARK AS READ
// ==========================================

const getRoomMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;

    // Only members can view room messages
    const membership =
      await prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId,
            roomId,
          },
        },
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this room",
      });
    }

    // Get all room messages + reactions
    const messages =
      await prisma.message.findMany({
        where: {
          roomId,
        },

        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },

          replyTo: {
            select: {
              id: true,
              content: true,
              messageType: true,
              fileName: true,
              isDeleted: true,

              sender: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },

          reactions: {
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
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    // ==========================================
    // MARK THIS ROOM AS READ
    // ==========================================

    await prisma.roomMember.update({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },

      data: {
        lastReadAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "Get room messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// UPLOAD AND SEND ATTACHMENT
const sendAttachment = async (req, res) => {
  try {
    const senderId = req.user.id;

    const {
      conversationId,
      roomId,
      content = "",
    } = req.body;

    // A file is required
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload",
      });
    }

    // Message must belong to either a private conversation or room
    if (
      (!conversationId && !roomId) ||
      (conversationId && roomId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide either a conversationId or roomId",
      });
    }

    // ==============================
    // PRIVATE CONVERSATION CHECK
    // ==============================

    if (conversationId) {
      const membership =
        await prisma.conversationMember.findUnique({
          where: {
            userId_conversationId: {
              userId: senderId,
              conversationId,
            },
          },
        });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a member of this conversation",
        });
      }
    }

    // ==============================
    // ROOM MEMBERSHIP CHECK
    // ==============================

    if (roomId) {
      const membership =
        await prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: senderId,
              roomId,
            },
          },
        });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a member of this room",
        });
      }
    }

    // ==============================
    // DETERMINE MESSAGE TYPE
    // ==============================

    const isImage =
      req.file.mimetype.startsWith("image/");

    const messageType = isImage
      ? "image"
      : "file";

    // ==============================
    // UPLOAD BUFFER TO CLOUDINARY
    // ==============================

    const uploadResult =
      await new Promise((resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder: "chatz/attachments",

              // auto supports both images and files
              resource_type: isImage ? "image" : "raw",
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

        readable.push(req.file.buffer);
        readable.push(null);

        readable.pipe(uploadStream);
      });

    // ==============================
    // SAVE MESSAGE
    // ==============================

    const message =
      await prisma.message.create({
        data: {
          content: content.trim(),

          senderId,

          conversationId:
            conversationId || null,

          roomId:
            roomId || null,

          messageType,

          fileUrl:
            uploadResult.secure_url,

          fileName:
            req.file.originalname,

          fileSize:
            req.file.size,

          mimeType:
            req.file.mimetype,
        },

        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

    // ==============================
    // UPDATE ACTIVITY TIMESTAMP
    // ==============================

    if (conversationId) {
      await prisma.conversation.update({
        where: {
          id: conversationId,
        },

        data: {
          updatedAt: new Date(),
        },
      });
    }

    if (roomId) {
      await prisma.room.update({
        where: {
          id: roomId,
        },

        data: {
          updatedAt: new Date(),
        },
      });
    }

    // ==============================
    // REAL-TIME BROADCAST
    // ==============================

    const io = req.app.get("io");

    if (io) {
      if (conversationId) {
        io
          .to(
            `conversation:${conversationId}`
          )
          .emit(
            "message:new",
            message
          );
      }

      if (roomId) {
        io
          .to(`room:${roomId}`)
          .emit(
            "room:message:new",
            message
          );
      }
    }

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error(
      "Send attachment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to upload attachment",
    });
  }
};
// ==========================================
// EDIT MESSAGE
// PATCH /api/messages/:messageId
// ==========================================

const editMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { content } = req.body;

    // ======================================
    // VALIDATE CONTENT
    // ======================================

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Prevent extremely large messages
    if (content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long",
      });
    }

    // ======================================
    // FIND MESSAGE
    // ======================================

    const existingMessage =
      await prisma.message.findUnique({
        where: {
          id: messageId,
        },
      });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // ======================================
    // ONLY SENDER CAN EDIT
    // ======================================

    if (existingMessage.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own messages",
      });
    }

    // ======================================
    // ONLY TEXT MESSAGES CAN BE EDITED
    // ======================================

    if (existingMessage.messageType !== "text") {
      return res.status(400).json({
        success: false,
        message:
          "Only text messages can be edited",
      });
    }

    // ======================================
    // UPDATE MESSAGE
    // ======================================

    const updatedMessage =
      await prisma.message.update({
        where: {
          id: messageId,
        },

        data: {
          content: content.trim(),
          isEdited: true,
        },

        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },

          reactions: {
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
          },
        },
      });

    // ======================================
    // REAL-TIME SOCKET UPDATE
    // ======================================

    const io = req.app.get("io");

    if (io) {
      if (updatedMessage.conversationId) {
        io
          .to(
            `conversation:${updatedMessage.conversationId}`
          )
          .emit(
            "message:updated",
            updatedMessage
          );
      }

      if (updatedMessage.roomId) {
        io
          .to(
            `room:${updatedMessage.roomId}`
          )
          .emit(
            "room:message:updated",
            updatedMessage
          );
      }
    }

    return res.status(200).json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error(
      "Edit message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ==========================================
// DELETE MESSAGE
// DELETE /api/messages/:messageId
// ==========================================

const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    // ======================================
    // FIND MESSAGE
    // ======================================

    const existingMessage =
      await prisma.message.findUnique({
        where: {
          id: messageId,
        },
      });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // ======================================
    // ONLY SENDER CAN DELETE
    // ======================================

    if (existingMessage.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message:
          "You can only delete your own messages",
      });
    }

    // Save these before deleting
    const conversationId =
      existingMessage.conversationId;

    const roomId =
      existingMessage.roomId;

    // ======================================
// SOFT DELETE MESSAGE
// ======================================

// Remove reactions first because a deleted
// message should no longer have reactions.
await prisma.messageReaction.deleteMany({
  where: {
    messageId,
  },
});

// Keep the message record, but remove
// all user-visible message content.
const deletedMessage =
  await prisma.message.update({
    where: {
      id: messageId,
    },

    data: {
      content: "",

      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,

      isDeleted: true,
      deletedAt: new Date(),
    },

    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },

      reactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });
    // ======================================
    // REAL-TIME SOCKET UPDATE
    // ======================================

    const io = req.app.get("io");

    const payload = {
      messageId,
      conversationId,
      roomId,
      message : deletedMessage,
    };

    if (io) {
      if (conversationId) {
        io
          .to(
            `conversation:${conversationId}`
          )
          .emit(
            "message:deleted",
            payload
          );
      }

      if (roomId) {
        io
          .to(`room:${roomId}`)
          .emit(
            "room:message:deleted",
            payload
          );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      messageId,
      deletedMessage,
    });
  } catch (error) {
    console.error(
      "Delete message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ==========================================
// MARK PRIVATE MESSAGES AS READ
// ==========================================

const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
    }

    // Make sure logged-in user belongs
    // to this conversation.
    const membership =
      await prisma.conversationMember.findUnique({
        where: {
          userId_conversationId: {
            userId,
            conversationId,
          },
        },
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this conversation",
      });
    }

    // Find unread messages received from
    // the OTHER user.
    const unreadMessages =
      await prisma.message.findMany({
        where: {
          conversationId,

          senderId: {
            not: userId,
          },

          isRead: false,
        },

        select: {
          id: true,
          senderId: true,
        },
      });
      
    if (unreadMessages.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No unread messages",
        messageIds: [],
      });
    }

    const messageIds =
      unreadMessages.map(
        (message) => message.id
      );

    const readAt = new Date();

    // Mark all received unread messages
    // as both delivered and read.
    await prisma.message.updateMany({
      where: {
        id: {
          in: messageIds,
        },
      },

      data: {
        isDelivered: true,
        deliveredAt: readAt,

        isRead: true,
        readAt,
      },
    });

    // ======================================
    // REAL-TIME READ RECEIPT
    // ======================================

    const io = req.app.get("io");

    if (io) {
      io
        .to(
          `conversation:${conversationId}`
        )
        .emit(
          "message:read",
          {
            conversationId,
            messageIds,
            readAt,
            readBy: userId,
          }
        );
    }

    return res.status(200).json({
      success: true,
      message:
        "Messages marked as read",
      messageIds,
      readAt,
    });
  } catch (error) {
    console.error(
      "Mark messages as read error:",
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
// MARK MESSAGE AS DELIVERED
// ==========================================

const markMessageAsDelivered = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message =
      await prisma.message.findUnique({
        where: {
          id: messageId,
        },

        include: {
          conversation: {
            include: {
              members: true,
            },
          },
        },
      });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Delivery receipts currently apply
    // only to private conversations.
    if (!message.conversationId) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery receipts are only available for private messages",
      });
    }

    // Sender cannot mark their own
    // message as delivered.
    if (message.senderId === userId) {
      return res.status(403).json({
        success: false,
        message:
          "Sender cannot mark own message as delivered",
      });
    }

    // Make sure recipient belongs
    // to this conversation.
    const isMember =
      message.conversation?.members?.some(
        (member) =>
          member.userId === userId
      );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this conversation",
      });
    }

    // Don't overwrite the original
    // delivery timestamp.
    if (message.isDelivered) {
      return res.status(200).json({
        success: true,
        message:
          "Message already delivered",
        messageId: message.id,
        deliveredAt:
          message.deliveredAt,
      });
    }

    const deliveredAt = new Date();

    const updatedMessage =
      await prisma.message.update({
        where: {
          id: messageId,
        },

        data: {
          isDelivered: true,
          deliveredAt,
        },
      });

    // Tell sender in real time
    const io = req.app.get("io");

    if (io) {
      io
        .to(
          `conversation:${message.conversationId}`
        )
        .emit("message:delivered", {
          messageId:
            updatedMessage.id,

          conversationId:
            message.conversationId,

          deliveredAt:
            updatedMessage.deliveredAt,

          deliveredTo: userId,
        });
    }

    return res.status(200).json({
      success: true,
      message:
        "Message marked as delivered",
      messageId:
        updatedMessage.id,
      deliveredAt:
        updatedMessage.deliveredAt,
    });
  } catch (error) {
    console.error(
      "Mark message delivered error:",
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
// MARK PENDING PRIVATE MESSAGES DELIVERED
// ==========================================

const markPendingMessagesAsDelivered = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    // Find private messages sent TO this user
    // that have not yet been delivered.
    const pendingMessages =
      await prisma.message.findMany({
        where: {
          conversationId: {
            not: null,
          },

          senderId: {
            not: userId,
          },

          isDelivered: false,

          conversation: {
            members: {
              some: {
                userId,
              },
            },
          },
        },

        select: {
          id: true,
          conversationId: true,
        },
      });

    if (pendingMessages.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No pending messages",
        deliveredCount: 0,
      });
    }

    const messageIds =
      pendingMessages.map(
        (message) => message.id
      );

    const deliveredAt = new Date();

    await prisma.message.updateMany({
      where: {
        id: {
          in: messageIds,
        },
      },

      data: {
        isDelivered: true,
        deliveredAt,
      },
    });

    // Tell senders that their messages
    // have now reached the recipient.
    const io = req.app.get("io");

    if (io) {
      for (const message of pendingMessages) {
        io
          .to(
            `conversation:${message.conversationId}`
          )
          .emit(
            "message:delivered",
            {
              messageId: message.id,

              conversationId:
                message.conversationId,

              deliveredAt,

              deliveredTo: userId,
            }
          );
      }
    }

    return res.status(200).json({
      success: true,

      message:
        "Pending messages marked as delivered",

      deliveredCount:
        messageIds.length,

      messageIds,

      deliveredAt,
    });
  } catch (error) {
    console.error(
      "Mark pending messages delivered error:",
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
// GET PRIVATE UNREAD MESSAGE COUNTS
// ==========================================

const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all unread private messages
    // received by the logged-in user.
    const unreadMessages =
      await prisma.message.findMany({
        where: {
          conversationId: {
            not: null,
          },

          senderId: {
            not: userId,
          },

          isRead: false,

          conversation: {
            members: {
              some: {
                userId,
              },
            },
          },
        },

        select: {
          senderId: true,
        },
      });

    // Convert messages into:
    // {
    //   senderUserId: unreadCount
    // }
    const unreadCounts =
      unreadMessages.reduce(
        (counts, message) => {
          counts[message.senderId] =
            (counts[message.senderId] || 0) +
            1;

          return counts;
        },
        {}
      );

    return res.status(200).json({
      success: true,
      unreadCounts,
    });
  } catch (error) {
    console.error(
      "Get unread counts error:",
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
};