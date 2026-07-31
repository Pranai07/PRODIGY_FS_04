const prisma = require("../config/prisma");

// ==========================================
// CREATE OR GET PRIVATE CONVERSATION
// ==========================================
const createOrGetConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot create a conversation with yourself",
      });
    }

    // Make sure selected user exists
    const selectedUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
      },
    });

    if (!selectedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find an existing private conversation
    // containing both users.
    const existingConversation =
      await prisma.conversation.findFirst({
        where: {
          AND: [
            {
              members: {
                some: {
                  userId: currentUserId,
                },
              },
            },

            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
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
                },
              },
            },
          },
        },
      });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        conversation: existingConversation,
      });
    }

    // Create a new private conversation
    const conversation =
      await prisma.conversation.create({
        data: {
          members: {
            create: [
              {
                userId: currentUserId,

                // New conversation starts as read
                // for the user creating/opening it.
                lastReadAt: new Date(),
              },

              {
                userId,

                // Keep null for the other user.
                // They have not opened it yet.
                lastReadAt: null,
              },
            ],
          },
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
                },
              },
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(
      "Conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// GET PRIVATE UNREAD COUNTS
// ==========================================
const getPrivateUnreadCounts = async (
  req,
  res
) => {
  try {
    const currentUserId = req.user.id;

    // Get every private conversation
    // membership for logged-in user.
    const memberships =
      await prisma.conversationMember.findMany({
        where: {
          userId: currentUserId,
        },

        select: {
          conversationId: true,
          lastReadAt: true,

          conversation: {
            select: {
              members: {
                where: {
                  userId: {
                    not: currentUserId,
                  },
                },

                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

    const unreadPrivate = {};

    for (const membership of memberships) {
      const otherUser =
        membership.conversation.members[0];

      if (!otherUser) {
        continue;
      }

      const messageWhere = {
        conversationId:
          membership.conversationId,

        // Never count our own messages as unread
        senderId: {
          not: currentUserId,
        },
      };

      // If user has previously read the chat,
      // only count messages after that time.
      if (membership.lastReadAt) {
        messageWhere.createdAt = {
          gt: membership.lastReadAt,
        };
      }

      const unreadCount =
        await prisma.message.count({
          where: messageWhere,
        });

      if (unreadCount > 0) {
        unreadPrivate[otherUser.userId] =
          unreadCount;
      }
    }

    return res.status(200).json({
      success: true,
      unreadPrivate,
    });
  } catch (error) {
    console.error(
      "Get private unread counts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to get unread message counts",
    });
  }
};

module.exports = {
  createOrGetConversation,
  getPrivateUnreadCounts,
};