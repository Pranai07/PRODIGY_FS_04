import api from "./api";

export const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const createOrGetConversation = async (userId) => {
  const response = await api.post("/conversations", {
    userId,
  });

  return response.data;
};

// Get persistent private unread message counts
export const getPrivateUnreadCounts = async () => {
  const response = await api.get(
    "/conversations/unread"
  );

  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await api.get(
    `/messages/${conversationId}`
  );

  return response.data;
};
// ==========================================
// MARK PRIVATE MESSAGES AS READ
// ==========================================

export const markMessagesAsRead = async (
  conversationId
) => {
  const response = await api.patch(
    `/messages/conversation/${conversationId}/read`
  );

  return response.data;
};
export const markMessageAsDelivered = async (
  messageId
) => {
  const response = await api.patch(
    `/messages/${messageId}/delivered`
  );

  return response.data;
};
export const markPendingMessagesAsDelivered =
  async () => {
    const response = await api.patch(
      "/messages/pending/delivered"
    );

    return response.data;
  };
export const getUnreadCounts = async () => {
  const response = await api.get(
    "/messages/unread/counts"
  );

  return response.data;
};

export const sendMessage = async (
  conversationId,
  content,
  replyToId = null
) => {
  const response = await api.post("/messages", {
    conversationId,
    content,
    replyToId,
  });

  return response.data;
};

// Get all available rooms
export const getAllRooms = async () => {
  const response = await api.get("/rooms");
  return response.data;
};

// Get rooms joined by logged-in user
export const getMyRooms = async () => {
  const response = await api.get("/rooms/my");
  return response.data;
};

// Create a new room
export const createRoom = async (roomData) => {
  const response = await api.post("/rooms", roomData);
  return response.data;
};

// Join an existing room
export const joinRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/join`);
  return response.data;
};

// Leave a joined room
export const leaveRoom = async (roomId) => {
  const response = await api.delete(
    `/rooms/${roomId}/leave`
  );

  return response.data;
};

// Load room message history
export const getRoomMessages = async (roomId) => {
  const response = await api.get(
    `/messages/room/${roomId}`
  );

  return response.data;
};
// Get members of a room
export const getRoomMembers = async (
  roomId
) => {
  const response = await api.get(
    `/rooms/${roomId}/members`
  );

  return response.data;
};

// Remove a member from a room
export const removeRoomMember = async (
  roomId,
  userId
) => {
  const response = await api.delete(
    `/rooms/${roomId}/members/${userId}`
  );

  return response.data;
};

// Send room message
export const sendRoomMessage = async (
  roomId,
  content,
  replyToId = null
) => {
  const response = await api.post("/messages/room", {
    roomId,
    content,
    replyToId,
  });

  return response.data;
};
// Upload attachment for private chat or room
export const sendAttachment = async ({
  file,
  conversationId,
  roomId,
  content = "",
}) => {
  const formData = new FormData();

  formData.append("file", file);

  if (conversationId) {
    formData.append(
      "conversationId",
      conversationId
    );
  }

  if (roomId) {
    formData.append(
      "roomId",
      roomId
    );
  }

  if (content) {
    formData.append("content", content);
  }

  const response = await api.post(
    "/messages/attachment",
    formData
  );

  return response.data;
};

// ==========================================
// MESSAGE REACTIONS
// Private chats + rooms
// ==========================================

// Add a reaction, or toggle it off if the
// logged-in user already used the same emoji
export const toggleMessageReaction = async (
  messageId,
  emoji
) => {
  const response = await api.post(
    `/messages/${messageId}/reactions`,
    {
      emoji,
    }
  );

  return response.data;
};

// Explicitly remove a reaction
export const removeMessageReaction = async (
  messageId,
  emoji
) => {
  const response = await api.delete(
    `/messages/${messageId}/reactions`,
    {
      data: {
        emoji,
      },
    }
  );

  return response.data;
};
// ==========================================
// EDIT MESSAGE
// Works for private chats + rooms
// ==========================================

export const editMessage = async (
  messageId,
  content
) => {
  const response = await api.patch(
    `/messages/${messageId}`,
    {
      content,
    }
  );

  return response.data;
};

export const deleteMessage = async (
  messageId
) => {
  const response = await api.delete(
    `/messages/${messageId}`
  );

  return response.data;
};

export const getProfile = async () => {
  const response = await api.get(
    "/users/profile"
  );

  return response.data;
};

// Update logged-in user's name
export const updateProfile = async (
  name
) => {
  const response = await api.patch(
    "/users/profile",
    {
      name,
    }
  );

  return response.data;
};

// Upload / change profile picture
export const updateProfileAvatar = async (
  file
) => {
  const formData = new FormData();

  // Must match:
  // avatarUpload.single("avatar")
  formData.append("avatar", file);

  const response = await api.patch(
    "/users/profile/avatar",
    formData
  );

  return response.data;
};

export const renameRoom = async (
  roomId,
  name
) => {
  const response = await api.patch(
    `/rooms/${roomId}/rename`,
    { name }
  );

  return response.data;
};

export const deleteRoom = async (roomId) => {
  const response = await api.delete(`/rooms/${roomId}`);
  return response.data;
};