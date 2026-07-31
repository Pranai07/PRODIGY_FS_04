
const prisma = require("../config/prisma");
const socketHandler = (io) => {
  // userId -> Set(socketIds)
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    // ==============================
    // USER ONLINE
    // ==============================
    socket.on("user:online", (userId) => {
      if (!userId) return;

      // Store userId on socket
      socket.userId = userId;

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }

      onlineUsers.get(userId).add(socket.id);

      socket.join(`user:${userId}`);

      io.emit("users:online", Array.from(onlineUsers.keys()));
    });

    // ==============================
    // PRIVATE CONVERSATIONS
    // ==============================

    socket.on("conversation:join", (conversationId) => {
      if (!conversationId) return;

      socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId) => {
      if (!conversationId) return;

      socket.leave(`conversation:${conversationId}`);
    });

    // ==============================
    // PRIVATE CHAT TYPING
    // ==============================

    socket.on("typing:start", ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;

      socket
        .to(`conversation:${conversationId}`)
        .emit("typing:start", {
          conversationId,
          userId,
        });
    });

    socket.on("typing:stop", ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;

      socket
        .to(`conversation:${conversationId}`)
        .emit("typing:stop", {
          conversationId,
          userId,
        });
    });

    // ==============================
    // GROUP CHAT ROOMS
    // ==============================

    socket.on("room:join", (roomId) => {
      socket.join(`room:${roomId}`);
  });

    socket.on("room:leave", (roomId) => {
      if (!roomId) return;

      socket.leave(`room:${roomId}`);

      
    });

  // ==============================
  // DISCONNECT
  // ==============================

  socket.on("disconnect", async () => {
    const userId = socket.userId;

    if (userId && onlineUsers.has(userId)) {
      const sockets = onlineUsers.get(userId);

      sockets.delete(socket.id);

      // User is truly offline only when all sockets are gone
      if (sockets.size === 0) {
        onlineUsers.delete(userId);

        try {
          const lastSeen = new Date();

          await prisma.user.update({
            where: {
              id: userId,
            },
            data: {
              lastSeen,
            },
          });

          io.emit("user:last-seen-updated", {
            userId,
            lastSeen,
          });
        } catch (error) {
          console.error("Failed to update lastSeen:", error);
        }

        io.emit("users:online", Array.from(onlineUsers.keys()));

      }
    }
  });
  });
};



module.exports = socketHandler;