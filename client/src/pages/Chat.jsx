import { useEffect, useLayoutEffect, useRef, useState } from "react";

import WelcomeScreen from "../components/chat/WelcomeScreen";
import ReplyPreview from "../components/chat/ReplyPreview";
import AttachmentPreview from "../components/chat/AttachmentPreview";
import ChatHeader from "../components/chat/ChatHeader";
import Sidebar from "../components/Sidebar/Sidebar";
import MessageInput from "../components/chat/MessageInput";
import MessageBubble from "../components/messages/MessageBubble";
import ProfileModal from "../components/profile/ProfileModal";
import RoomModal from "../components/rooms/RoomModal";
import formatTime from "../utils/formatTime";
import formatFileSize from "../utils/formatFileSize";
import getInitial from "../utils/getInitial";
import { highlightSearchText } from "../utils/highlightSearchText";
import ImageViewer from "../components/chat/ImageViewer";
import RoomMembersModal from "../components/rooms/RoomMembersModal";
import RenameRoomModal from "../components/rooms/RenameRoomModal";
import RoomInfoModal from "../components/rooms/RoomInfoModal";
import ChatWallpaperModal from "../components/ChatWallpaper/ChatWallpaperModal";
import chatWallpapers from "../constants/chatWallpapers";
import AppearanceModal from "../components/Appearance/AppearanceModal";

import { Hash } from "lucide-react";

import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContextObject";

import {
  createOrGetConversation,
  getMessages,
  getUsers,
  sendMessage,
  getAllRooms,
  getMyRooms,
  createRoom,
  joinRoom,
  renameRoom,
  leaveRoom,
  deleteRoom,
  getRoomMembers,
  removeRoomMember,
  getRoomMessages,
  sendRoomMessage,
  sendAttachment,
  toggleMessageReaction,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
  getProfile,
  updateProfile,
  updateProfileAvatar,
  markMessageAsDelivered,
  markPendingMessagesAsDelivered,
  getUnreadCounts,
} from "../services/chatService";

import socket from "../services/socket";

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const getDateLabel = (dateString) => {
  const messageDate = new Date(dateString);
  const today = new Date();

  // Remove time so we compare calendar days only
  const messageDay = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );

  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const differenceInDays = Math.round(
    (todayDay - messageDay) / (1000 * 60 * 60 * 24)
  );

  // Today
  if (differenceInDays === 0) {
    return "Today";
  }

  // Yesterday
  if (differenceInDays === 1) {
    return "Yesterday";
  }

  // Within the last 7 days
  if (differenceInDays > 1 && differenceInDays < 7) {
    return messageDate.toLocaleDateString("en-GB", {
      weekday: "long",
    });
  }

  // Older messages
  return messageDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Chat = () => {
  const { user, logout, updateAuthUser } = useAuth();

  // ==============================
  // PRIVATE CHAT STATE
  // ==============================

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [conversation, setConversation] = useState(null);

  const [unreadPrivate, setUnreadPrivate] = useState({});
  const [unreadRooms, setUnreadRooms] = useState({});

  const [newMessagesStartId, setNewMessagesStartId] = useState(null);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  // ==========================================
  // PROFILE STATE
  // ==========================================

  const [showProfileModal, setShowProfileModal] = useState(false);

  const [profile, setProfile] = useState(null);

  const [profileName, setProfileName] = useState("");

  const [profileAvatarFile, setProfileAvatarFile] = useState(null);

  const [profileAvatarPreview, setProfileAvatarPreview] = useState(null);

  const [, setLoadingProfile] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const profileAvatarInputRef = useRef(null);
  // ==============================
  // ATTACHMENT STATE
  // ==============================

  const [selectedFile, setSelectedFile] = useState(null);

  const [uploadingFile, setUploadingFile] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const fileInputRef = useRef(null);
  const isOpeningChatRef = useRef(false);
  // ==============================
  // ROOM STATE
  // ==============================

  const [myRooms, setMyRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState(null);

  const [showRoomModal, setShowRoomModal] = useState(false);

  const [showRoomInfoModal, setShowRoomInfoModal] =
  useState(false);

  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
  });

  const [creatingRoom, setCreatingRoom] = useState(false);

  const [joiningRoomId, setJoiningRoomId] = useState(null);

  const [showMembersModal, setShowMembersModal] = useState(false);

  const [roomMembers, setRoomMembers] = useState([]);

  const [loadingMembers, setLoadingMembers] = useState(false);

  const [showRenameModal, setShowRenameModal] = useState(false);

  const [newRoomName, setNewRoomName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);

  // ==============================
  // COMMON CHAT STATE
  // ==============================

  const [chatMode, setChatMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [openReactionPicker, setOpenReactionPicker] = useState(null);
  // ==========================================
// CHAT WALLPAPER STATE
// ==========================================

const [showWallpaperModal, setShowWallpaperModal] =
  useState(false);
const [showAppearanceModal, setShowAppearanceModal] =
  useState(false);

const [selectedTheme, setSelectedTheme] =
  useState(() => {
    return localStorage.getItem("chatzTheme") || "dark";
  });

const applyTheme = (theme) => {
  let resolvedTheme = theme;

  if (theme === "system") {
    resolvedTheme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
      ? "dark"
      : "light";
  }

  document.documentElement.setAttribute(
    "data-theme",
    resolvedTheme
  );
};
const handleSelectTheme = (theme) => {
  setSelectedTheme(theme);
  localStorage.setItem("chatzTheme", theme);
  applyTheme(theme);
};
useEffect(() => {
  applyTheme(selectedTheme);

  if (selectedTheme !== "system") {
    return;
  }

  const mediaQuery = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

  const handleSystemThemeChange = () => {
    applyTheme("system");
  };

  mediaQuery.addEventListener(
    "change",
    handleSystemThemeChange
  );

  return () => {
    mediaQuery.removeEventListener(
      "change",
      handleSystemThemeChange
    );
  };
}, [selectedTheme]);

const [selectedWallpaper, setSelectedWallpaper] =
  useState(() => {
    return (
      localStorage.getItem("chatWallpaper") ||
      "default"
    );
  });
  const activeWallpaper =
    chatWallpapers.find(
      (wallpaper) =>
        wallpaper.id === selectedWallpaper
    ) || chatWallpapers[0];
  const handleSelectWallpaper = (wallpaperId) => {
    setSelectedWallpaper(wallpaperId);

    localStorage.setItem(
      "chatWallpaper",
      wallpaperId
    );
  };
  // ==========================================
  // EDIT / DELETE MESSAGE STATE
  // ==========================================

  // Which message currently has the ⋮ menu open
  const [openMessageMenu, setOpenMessageMenu] = useState(null);

  // Message currently being edited
  const [editingMessageId, setEditingMessageId] = useState(null);

  // Current text inside the edit input
  const [editingContent, setEditingContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const typingTimeoutRef = useRef(null);
  // ==========================================
  // MESSAGE SEARCH STATE
  // ==========================================

  const [showMessageSearch, setShowMessageSearch] = useState(false);

  const [messageSearchQuery, setMessageSearchQuery] = useState("");

  const [messageSearchResults, setMessageSearchResults] = useState([]);

  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const [viewerImage, setViewerImage] = useState(null);

  const [viewerFileName, setViewerFileName] = useState("");

  const isScrollingToNewRef = useRef(false);

  // ==============================
  // SOCKET CONNECTION
  // ==============================

  useEffect(() => {
    if (!user?.id) return;

    socket.connect();

    socket.emit("user:online", user.id);
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    const handleOnlineUsers = (userIds) => {
      setOnlineUsers(userIds);
    };

    socket.on("users:online", handleOnlineUsers);

    return () => {
      socket.off("users:online", handleOnlineUsers);

      socket.disconnect();
    };
  }, [user?.id]);

  // ==============================
  // LOAD USERS
  // ==============================

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();

        setUsers(data.users || []);
      } catch (error) {
        console.error("Load users error:", error);

        toast.error("Unable to load users");
      }
    };

    loadUsers();
  }, []);

  // ==============================
  // LOAD ROOMS
  // ==============================

  const refreshRooms = async () => {
    try {
      const [myRoomsData, allRoomsData] = await Promise.all([
        getMyRooms(),
        getAllRooms(),
      ]);

      setMyRooms(myRoomsData.rooms || []);

      setAllRooms(allRoomsData.rooms || []);
    } catch (error) {
      console.error("Load rooms error:", error);

      toast.error("Unable to load rooms");
    }
  };

  // Load joined and available rooms when the logged-in user is ready
  useEffect(() => {
    if (!user?.id) return;

    refreshRooms();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    myRooms.forEach((room) => {
      socket.emit("room:join", room.id);
    });
  }, [myRooms, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadUnreadCounts = async () => {
      try {
        const data = await getUnreadCounts();

        setUnreadPrivate(data.unreadCounts || {});
      } catch (error) {
        console.error("Load unread counts error:", error);
      }
    };

    loadUnreadCounts();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const markPendingDelivered = async () => {
      try {
        await markPendingMessagesAsDelivered();
      } catch (error) {
        console.error("Mark pending messages delivered error:", error);
      }
    };

    markPendingDelivered();
  }, [user?.id]);
  // ==============================
  // PRIVATE REAL-TIME MESSAGES
  // ==============================
  function showBrowserNotification(message) {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;

    const notification = new Notification(
      message.sender?.name || "New Message",
      {
        body:
          message.content ||
          (message.messageType === "image"
            ? "📷 Image"
            : message.messageType === "file"
              ? "📎 File"
              : "You received a new message"),
        icon: message.sender?.avatar || "/favicon.ico",
        tag: message.conversationId || message.roomId,
      },
    );

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      const isOwnMessage = newMessage.senderId === user?.id;

      const isCurrentConversation =
        chatMode === "private" &&
        newMessage.conversationId === conversation?.id;

      // Acknowledge delivery for every
      // incoming private message.
      if (!isOwnMessage && newMessage?.id && newMessage?.conversationId) {
        markMessageAsDelivered(newMessage.id).catch((error) => {
          console.error("Mark message delivered error:", error);
        });
      }

      // Current private conversation is open
      if (isCurrentConversation) {
        if (
          !isOwnMessage &&
          !shouldAutoScrollRef.current
        ) {
          setNewMessagesStartId((current) =>
            current || newMessage.id
          );

          setNewMessagesCount((current) => current + 1);
        }
        setMessages((current) => {
          const alreadyExists = current.some(
            (message) => message.id === newMessage.id,
          );

          if (alreadyExists) {
            return current;
          }

          return [...current, newMessage];
        });

        // User is actively viewing this chat,
        // so mark incoming message as read.
        if (!isOwnMessage) {
          markMessagesAsRead(newMessage.conversationId).catch((error) => {
            console.error("Mark new message as read error:", error);
          });
        }

        return;
      }
      if (!isOwnMessage && !isCurrentConversation) {
        showBrowserNotification(newMessage);
      }

      // Another private chat or room is open:
      // increment unread badge for sender.
      if (!isOwnMessage && newMessage.senderId) {
        setUnreadPrivate((current) => ({
          ...current,

          [newMessage.senderId]: (current[newMessage.senderId] || 0) + 1,
        }));
      }
    };

    const handlePrivateReactionUpdate = (payload) => {
      if (!payload?.messageId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === payload.messageId
            ? {
                ...message,
                reactions: payload.reactions || [],
              }
            : message,
        ),
      );
    };
    const handlePrivateMessageUpdated = (updatedMessage) => {
      if (!updatedMessage?.id) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === updatedMessage.id ? updatedMessage : message,
        ),
      );
    };

    const handlePrivateMessageDeleted = (payload) => {
      if (!payload?.messageId || !payload?.message) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === payload.messageId ? payload.message : message,
        ),
      );
    };

    const handleMessageRead = (data) => {
      const { conversationId, messageIds, readAt } = data;

      if (conversationId !== conversation?.id) {
        return;
      }

      const readMessageIds = new Set(messageIds || []);

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          readMessageIds.has(message.id)
            ? {
                ...message,
                isRead: true,
                readAt,
              }
            : message,
        ),
      );
    };
    const handleMessageDelivered = ({ messageId, deliveredAt }) => {
      if (!messageId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                isDelivered: true,
                deliveredAt,
              }
            : message,
        ),
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:reaction:update", handlePrivateReactionUpdate);
    socket.on("message:updated", handlePrivateMessageUpdated);

    socket.on("message:deleted", handlePrivateMessageDeleted);
    socket.on("message:read", handleMessageRead);
    socket.on("message:delivered", handleMessageDelivered);
    return () => {
      socket.off("message:new", handleNewMessage);

      socket.off("message:reaction:update", handlePrivateReactionUpdate);
      socket.off("message:updated", handlePrivateMessageUpdated);

      socket.off("message:deleted", handlePrivateMessageDeleted);
      socket.off("message:read", handleMessageRead);
      socket.off("message:delivered", handleMessageDelivered);
    };
  }, [conversation?.id, chatMode, user?.id]);

  // ==============================
  // ROOM REAL-TIME MESSAGES
  // ==============================

  useEffect(() => {
    const handleNewRoomMessage = (newMessage) => {
      const isOwnMessage = newMessage.senderId === user?.id;

      const isCurrentRoom =
        chatMode === "room" && newMessage.roomId === selectedRoom?.id;
      if (!isOwnMessage && !isCurrentRoom) {
        showBrowserNotification(newMessage);
      }
      if (isCurrentRoom) {
        if (
          !isOwnMessage &&
          !shouldAutoScrollRef.current
        ) {
          setNewMessagesStartId((current) =>
            current || newMessage.id
          );

          setNewMessagesCount((current) => current + 1);
        }
        setMessages((current) => {
          const alreadyExists = current.some(
            (message) => message.id === newMessage.id,
          );

          if (alreadyExists) {
            return current;
          }

          return [...current, newMessage];
        });

        return;
      }

      if (!isOwnMessage && newMessage.roomId) {
        setUnreadRooms((current) => {
          const updated = {
            ...current,
            [newMessage.roomId]: (current[newMessage.roomId] || 0) + 1,
          };
          return updated;
        });
      }
    };

    const handleRoomReactionUpdate = (payload) => {
      if (!payload?.messageId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === payload.messageId
            ? {
                ...message,
                reactions: payload.reactions || [],
              }
            : message,
        ),
      );
    };
    const handleRoomMessageUpdated = (updatedMessage) => {
      if (!updatedMessage?.id) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === updatedMessage.id ? updatedMessage : message,
        ),
      );
    };

    const handleRoomMessageDeleted = (payload) => {
      if (!payload?.messageId || !payload?.message) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === payload.messageId ? payload.message : message,
        ),
      );
    };
    const handleUserProfileUpdated = (updatedUser) => {
      if (!updatedUser?.id) {
        return;
      }

      // Update only the matching user
      // in the PEOPLE list
      setUsers((currentUsers) =>
        currentUsers.map((chatUser) =>
          chatUser.id === updatedUser.id
            ? {
                ...chatUser,
                ...updatedUser,
              }
            : chatUser,
        ),
      );

      // Update the selected private-chat user
      // only if this is the same user
      setSelectedUser((currentSelectedUser) => {
        if (!currentSelectedUser || currentSelectedUser.id !== updatedUser.id) {
          return currentSelectedUser;
        }

        return {
          ...currentSelectedUser,
          ...updatedUser,
        };
      });
    };
    const handleLastSeenUpdated = ({ userId, lastSeen }) => {
      setUsers((currentUsers) =>
        currentUsers.map((chatUser) =>
          chatUser.id === userId
            ? {
                ...chatUser,
                lastSeen,
              }
            : chatUser,
        ),
      );

      setSelectedUser((currentUser) => {
        if (!currentUser || currentUser.id !== userId) {
          return currentUser;
        }

        return {
          ...currentUser,
          lastSeen,
        };
      });
    };

    const handleRoomRenamed = (updatedRoom) => {
      setMyRooms((currentRooms) =>
        currentRooms.map((room) =>
          room.id === updatedRoom.id ? updatedRoom : room
        )
      );

      setAllRooms((currentRooms) =>
        currentRooms.map((room) =>
          room.id === updatedRoom.id ? updatedRoom : room
        )
      );

      setSelectedRoom((currentRoom) =>
        currentRoom?.id === updatedRoom.id
          ? updatedRoom
          : currentRoom
      );
    };

    const handleRoomDeleted = ({ roomId }) => {
      setMyRooms((currentRooms) =>
        currentRooms.filter((room) => room.id !== roomId)
      );

      setAllRooms((currentRooms) =>
        currentRooms.filter((room) => room.id !== roomId)
      );

      setUnreadRooms((current) => {
        const updated = { ...current };
        delete updated[roomId];
        return updated;
      });

      setSelectedRoom((currentRoom) => {
        if (currentRoom?.id === roomId) {
          setMessages([]);
          setChatMode(null);
          return null;
        }

        return currentRoom;
      });

      toast("🚪 This room has been deleted.");
    };
    const handleMemberRemoved = ({ roomId, userId }) => {
      // This event is only for the removed user
      if (userId !== user?.id) return;

      // Remove room from My Rooms
      setMyRooms((current) =>
        current.filter((room) => room.id !== roomId)
      );

      // Remove unread badge
      setUnreadRooms((current) => {
        const updated = { ...current };
        delete updated[roomId];
        return updated;
      });

      // Close the room if the removed user
      // currently has it open
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        setMessages([]);
        setRoomMembers([]);
        setShowMembersModal(false);
        setChatMode(null);
      }

      toast.error("You were removed from the room.");
    };

    const handleRoomMembersUpdated = async ({
      roomId,
    }) => {
      try {
        const data = await getRoomMembers(roomId);

        const updatedMembers = data.members || [];
        const memberCount = updatedMembers.length;

        // Update sidebar room count
        setMyRooms((current) =>
          current.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  _count: {
                    ...room._count,
                    members: memberCount,
                  },
                }
              : room
          )
        );

        // Update currently opened room
        setSelectedRoom((current) => {
          if (current?.id !== roomId) {
            return current;
          }

          return {
            ...current,
            _count: {
              ...current._count,
              members: memberCount,
            },
          };
        });

        // Update members modal only when
        // this is the currently opened room
        if (selectedRoom?.id === roomId) {
          setRoomMembers(updatedMembers);
        }
      } catch (error) {
        console.error(
          "Unable to refresh room members:",
          error
        );
      }
    };

    socket.on("room:message:new", handleNewRoomMessage);

    socket.on("room:reaction:update", handleRoomReactionUpdate);
    socket.on("room:message:updated", handleRoomMessageUpdated);

    socket.on("room:message:deleted", handleRoomMessageDeleted);
    socket.on("user:profile-updated", handleUserProfileUpdated);
    socket.on("user:last-seen-updated", handleLastSeenUpdated);
    socket.on("room:deleted", handleRoomDeleted);
    socket.on("room:renamed", handleRoomRenamed);
    socket.on(
      "room:member-removed",
      handleMemberRemoved
    );

    socket.on(
      "room:members-updated",
      handleRoomMembersUpdated
    );

    return () => {
      socket.off("room:message:new", handleNewRoomMessage);
      socket.off("room:reaction:update", handleRoomReactionUpdate);
      socket.off("room:message:updated", handleRoomMessageUpdated);

      socket.off("room:message:deleted", handleRoomMessageDeleted);
      socket.off("user:profile-updated", handleUserProfileUpdated);
      socket.off("user:last-seen-updated", handleLastSeenUpdated);
      socket.off("room:renamed", handleRoomRenamed);
      socket.off("room:deleted", handleRoomDeleted);
      socket.off(
        "room:member-removed",
        handleMemberRemoved
      );

      socket.off(
        "room:members-updated",
        handleRoomMembersUpdated
      );
    };
  }, [selectedRoom?.id, chatMode, user?.id]);

  // ==============================
  // PRIVATE TYPING LISTENERS
  // ==============================

  useEffect(() => {
    const handleTypingStart = ({ conversationId, userId }) => {
      if (
        chatMode === "private" &&
        conversationId === conversation?.id &&
        userId !== user?.id
      ) {
        setTypingUser(true);
      }
    };

    const handleTypingStop = ({ conversationId, userId }) => {
      if (conversationId === conversation?.id && userId !== user?.id) {
        setTypingUser(false);
      }
    };

    socket.on("typing:start", handleTypingStart);

    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("typing:start", handleTypingStart);

      socket.off("typing:stop", handleTypingStop);
    };
  }, [conversation?.id, user?.id, chatMode]);

  // ==============================
  // AUTO SCROLL
  // ==============================

  useLayoutEffect(() => {
  if (!messagesContainerRef.current) return;

  if (isOpeningChatRef.current) {
    // Instantly jump before the browser paints
    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;

    isOpeningChatRef.current = false;
    return;
  }

  if (shouldAutoScrollRef.current) {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }
}, [messages]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
    setNewMessagesStartId(null);
    setNewMessagesCount(0);
  }, [conversation?.id, selectedRoom?.id]);
  // ==========================================
  // KEEP MESSAGE SEARCH RESULTS IN SYNC
  // ==========================================

  useEffect(() => {
    if (!showMessageSearch || !messageSearchQuery.trim()) {
      return;
    }

    const cleanQuery = messageSearchQuery.trim().toLowerCase();

    const updatedResults = messages.filter(
      (message) =>
        !message.isDeleted &&
        message.messageType === "text" &&
        message.content?.toLowerCase().includes(cleanQuery),
    );

    setMessageSearchResults(updatedResults);

    // Keep current result index valid
    setCurrentSearchIndex((currentIndex) => {
      if (updatedResults.length === 0) {
        return 0;
      }

      if (currentIndex >= updatedResults.length) {
        return updatedResults.length - 1;
      }

      return currentIndex;
    });
  }, [messages, messageSearchQuery, showMessageSearch]);
  // ==============================
  // IMAGE PREVIEW CLEANUP
  // ==============================

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectUser = async (selected) => {
    try {
      isOpeningChatRef.current = true;
      setTypingUser(false);
      removeSelectedFile();
      setMessageText("");
      // Reset message search when switching chats
      setShowMessageSearch(false);
      setMessageSearchQuery("");
      setMessageSearchResults([]);
      setCurrentSearchIndex(0);

      // if (selectedRoom?.id) {
      //   socket.emit(
      //     "room:leave",
      //     selectedRoom.id
      //   );
      // }

      if (conversation?.id) {
        socket.emit("conversation:leave", conversation.id);
      }

      setSelectedRoom(null);

      // Clear unread count when this private chat is opened
      setUnreadPrivate((current) => {
        const updated = { ...current };
        delete updated[selected.id];
        return updated;
      });
      const conversationData = await createOrGetConversation(selected.id);

      const activeConversation = conversationData.conversation;

      setConversation(activeConversation);

      socket.emit("conversation:join", activeConversation.id);

      const messageData = await getMessages(activeConversation.id);

      setMessages(messageData.messages || []);
      setSelectedUser(selected);
      setChatMode("private");
      requestAnimationFrame(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "auto",
        });
      });

      // Mark messages from the other user as read
      await markMessagesAsRead(activeConversation.id);
    } catch (error) {
      console.error("Open conversation error:", error);

      toast.error(
        error.response?.data?.message || "Unable to open conversation",
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectRoom = async (room) => {
    try {
      isOpeningChatRef.current = true;
      setTypingUser(false);
      removeSelectedFile();
      setMessageText("");
      // Reset message search when switching rooms
      setShowMessageSearch(false);
      setMessageSearchQuery("");
      setMessageSearchResults([]);
      setCurrentSearchIndex(0);

      if (conversation?.id) {
        socket.emit("conversation:leave", conversation.id);
      }

      setSelectedUser(null);
      setConversation(null);

      // Clear unread count when this room is opened
      setUnreadRooms((current) => {
        const updated = { ...current };
        delete updated[room.id];
        return updated;
      });

      socket.emit("room:join", room.id);

      const data = await getRoomMessages(room.id);

      setMessages(data.messages || []);
      setSelectedRoom(room);
      setChatMode("room");

      requestAnimationFrame(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "auto",
        });
      });
    } catch (error) {
      console.error("Open room error:", error);

      toast.error(error.response?.data?.message || "Unable to open room");
    } finally {
      setLoadingMessages(false);
    }
  };

  // ==============================
  // MESSAGE INPUT CHANGE
  // ==============================

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);

    if (chatMode !== "private" || !conversation?.id) {
      return;
    }

    socket.emit("typing:start", {
      conversationId: conversation.id,

      userId: user.id,
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", {
        conversationId: conversation.id,

        userId: user.id,
      });
    }, 1000);
  };

  // ==============================
  // FILE SELECTION
  // ==============================

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Unsupported file type. Choose an image, PDF, TXT, DOC, or DOCX.",
      );

      e.target.value = "";

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be smaller than 10 MB.");

      e.target.value = "";

      return;
    }

    setSelectedFile(file);
  };

  // ==============================
  // SEND ATTACHMENT
  // ==============================

  const handleSendAttachment = async () => {
    if (!selectedFile || uploadingFile) {
      return;
    }

    if (chatMode === "private" && !conversation?.id) {
      return;
    }

    if (chatMode === "room" && !selectedRoom?.id) {
      return;
    }

    const fileToUpload = selectedFile;

    const caption = messageText.trim();

    try {
      setUploadingFile(true);

      if (chatMode === "private") {
        clearTimeout(typingTimeoutRef.current);

        socket.emit("typing:stop", {
          conversationId: conversation.id,

          userId: user.id,
        });
      }

      await sendAttachment({
        file: fileToUpload,

        conversationId: chatMode === "private" ? conversation.id : undefined,

        roomId: chatMode === "room" ? selectedRoom.id : undefined,

        content: caption,
      });

      setMessageText("");

      removeSelectedFile();
    } catch (error) {
      console.error("Attachment upload error:", error);

      toast.error(
        error.response?.data?.message || "Unable to upload attachment",
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (selectedFile) {
      await handleSendAttachment();

      return;
    }

    const content = messageText.trim();
    const replyToId = replyingTo?.id || null;

    if (!content || sending || uploadingFile) {
      return;
    }

    if (chatMode === "private" && !conversation?.id) {
      return;
    }

    if (chatMode === "room" && !selectedRoom?.id) {
      return;
    }

    try {
      setSending(true);

      if (chatMode === "private") {
        await sendMessage(conversation.id, content, replyToId);
      }

      if (chatMode === "room") {
        await sendRoomMessage(selectedRoom.id, content, replyToId);
      }

      setMessageText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Send message error:", error);

      setMessageText(content);

      toast.error(error.response?.data?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };
  async function handleReaction(messageId, emoji) {
    try {
      const data = await toggleMessageReaction(messageId, emoji);

      if (!data?.success) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                reactions: data.reactions || [],
              }
            : message,
        ),
      );

      // Close emoji picker after selection
      setOpenReactionPicker(null);
    } catch (error) {
      console.error("Reaction error:", error);
    }
  }
  // ==========================================
  // START EDITING MESSAGE
  // ==========================================

  const handleStartEdit = (message) => {
    if (!message?.id) {
      return;
    }

    setEditingMessageId(message.id);
    setEditingContent(message.content || "");

    // Close the ⋮ menu
    setOpenMessageMenu(null);

    // Close reaction picker if open
    setOpenReactionPicker(null);
  };

  // ==========================================
  // CANCEL EDITING MESSAGE
  // ==========================================

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  // ==========================================
  // SAVE EDITED MESSAGE
  // ==========================================

  const handleSaveEdit = async (messageId) => {
    const trimmedContent = editingContent.trim();

    if (!trimmedContent) {
      return;
    }

    try {
      const data = await editMessage(messageId, trimmedContent);

      if (!data?.success) {
        return;
      }

      // Update immediately on current screen.
      // Socket.IO also synchronizes other users.
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId ? data.message : message,
        ),
      );

      setEditingMessageId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Edit message error:", error);

      alert(error?.response?.data?.message || "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const data = await deleteMessage(messageId);

      if (!data?.success) {
        return;
      }

      // Replace the original message with the
      // soft-deleted version returned by backend.
      if (data.deletedMessage) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === messageId ? data.deletedMessage : message,
          ),
        );
      }

      setOpenMessageMenu(null);

      // Safety cleanup in case the deleted
      // message was somehow being edited.
      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setEditingContent("");
      }
    } catch (error) {
      console.error("Delete message error:", error);

      alert(error?.response?.data?.message || "Failed to delete message");
    }
  };

  const handleStartReply = (message) => {
    if (!message || message.isDeleted) {
      return;
    }

    setReplyingTo(message);

    // Close menus/pickers
    setOpenMessageMenu(null);
    setOpenReactionPicker(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToOriginalMessage = (messageId) => {
    if (!messageId) {
      return;
    }

    const messageElement = document.getElementById(`message-${messageId}`);

    if (!messageElement) {
      return;
    }

    messageElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Briefly highlight original message
    messageElement.classList.add("message-highlight");

    setTimeout(() => {
      messageElement.classList.remove("message-highlight");
    }, 1500);
  };

  const handleMessageSearch = (query) => {
    setMessageSearchQuery(query);

    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      setMessageSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results = messages.filter(
      (message) =>
        !message.isDeleted &&
        message.messageType === "text" &&
        message.content?.toLowerCase().includes(cleanQuery),
    );

    setMessageSearchResults(results);
    setCurrentSearchIndex(0);

    // Jump to first result
    if (results.length > 0) {
      requestAnimationFrame(() => {
        scrollToOriginalMessage(results[0].id);
      });
    }
  };

  const handleNextSearchResult = () => {
    if (messageSearchResults.length === 0) {
      return;
    }

    const nextIndex = (currentSearchIndex + 1) % messageSearchResults.length;

    setCurrentSearchIndex(nextIndex);

    scrollToOriginalMessage(messageSearchResults[nextIndex].id);
  };

  const handlePreviousSearchResult = () => {
    if (messageSearchResults.length === 0) {
      return;
    }

    const previousIndex =
      currentSearchIndex === 0
        ? messageSearchResults.length - 1
        : currentSearchIndex - 1;

    setCurrentSearchIndex(previousIndex);

    scrollToOriginalMessage(messageSearchResults[previousIndex].id);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    const name = newRoom.name.trim();

    if (!name) {
      toast.error("Room name is required");

      return;
    }

    try {
      setCreatingRoom(true);

      const data = await createRoom({
        name,

        description: newRoom.description.trim(),
      });

      toast.success("Room created successfully");

      setNewRoom({
        name: "",
        description: "",
      });

      await refreshRooms();

      setShowRoomModal(false);

      if (data.room) {
        await handleSelectRoom(data.room);
      }
    } catch (error) {
      console.error("Create room error:", error);

      toast.error(error.response?.data?.message || "Unable to create room");
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (room) => {
    try {
      setJoiningRoomId(room.id);

      await joinRoom(room.id);

      toast.success(`Joined ${room.name}`);

      await refreshRooms();

      setShowRoomModal(false);

      await handleSelectRoom(room);
    } catch (error) {
      console.error("Join room error:", error);

      toast.error(error.response?.data?.message || "Unable to join room");
    } finally {
      setJoiningRoomId(null);
    }
  };
  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;

    const confirmed = window.confirm(`Leave "${selectedRoom.name}"?`);

    if (!confirmed) return;

    try {
      await leaveRoom(selectedRoom.id);

      socket.emit("room:leave", selectedRoom.id);

      toast.success("You left the room.");

      await refreshRooms();

      setSelectedRoom(null);
      setMessages([]);
      setChatMode(null);
    } catch (error) {
      console.error("Leave room error:", error);

      toast.error(error.response?.data?.message || "Unable to leave room.");
    }
  };

  const handleRenameRoom = async () => {
    if (!selectedRoom) return;

    if (!newRoomName.trim()) {
      toast.error("Please enter a room name.");
      return;
    }

    try {
      const data = await renameRoom(
        selectedRoom.id,
        newRoomName
      );

      setMyRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoom.id ? data.room : room
        )
      );

      setAllRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoom.id ? data.room : room
        )
      );

      setSelectedRoom(data.room);

      setShowRenameModal(false);
      setNewRoomName("");

      toast.success("Room renamed successfully.");
    } catch (error) {
      console.error("Rename error:", error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to rename room."
      );
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;

    try {
      setDeletingRoom(true);

      await deleteRoom(selectedRoom.id);

      setMyRooms((prev) =>
        prev.filter((room) => room.id !== selectedRoom.id)
      );

      setAllRooms((prev) =>
        prev.filter((room) => room.id !== selectedRoom.id)
      );

      setSelectedRoom(null);
      setMessages([]);
      setChatMode(null);

      setShowDeleteModal(false);

      toast.success("Room deleted successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Unable to delete room."
      );
    } finally {
      setDeletingRoom(false);
    }
  };

  const handleOpenRoomInfo = async () => {
    if (!selectedRoom?.id) return;

    try {
      setLoadingMembers(true);

      const data = await getRoomMembers(
        selectedRoom.id
      );

      setRoomMembers(data.members || []);
      setShowRoomInfoModal(true);
    } catch (error) {
      console.error(
        "Unable to load room info:",
        error
      );

      toast.error("Unable to load room info.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleViewMembers = async () => {
    try {
      setLoadingMembers(true);

      const data = await getRoomMembers(selectedRoom.id);
      setRoomMembers(data.members || []);

      setShowMembersModal(true);
    
    } catch (error) {
      console.error("API Error:", error);
      toast.error(
        error.response?.data?.message || "Unable to load room members.",
      );
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedRoom?.id) return;

    try {
      await removeRoomMember(
        selectedRoom.id,
        memberId
      );

      // Immediately remove the user from the modal
      setRoomMembers((current) =>
        current.filter(
          (member) => member.id !== memberId
        )
      );

      // Update member count in selected room
      setSelectedRoom((current) => {
        if (!current) return current;

        return {
          ...current,
          _count: {
            ...current._count,
            members: Math.max(
              (current._count?.members || 1) - 1,
              0
            ),
          },
        };
      });

      // Update room count in sidebar
      setMyRooms((current) =>
        current.map((room) =>
          room.id === selectedRoom.id
            ? {
                ...room,
                _count: {
                  ...room._count,
                  members: Math.max(
                    (room._count?.members || 1) - 1,
                    0
                  ),
                },
              }
            : room
        )
      );

      toast.success("Member removed successfully.");
    } catch (error) {
      console.error(
        "Remove member error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to remove member."
      );
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");

    if (!confirmed) {
      return;
    }

    clearTimeout(typingTimeoutRef.current);
    socket.disconnect();
    logout();
  };

  const filteredUsers = users.filter((chatUser) => {
    const query = search.trim().toLowerCase();

    return (
      chatUser.name.toLowerCase().includes(query) ||
      chatUser.email.toLowerCase().includes(query)
    );
  });

  // Rooms user has not joined yet

  const availableRooms = allRooms.filter(
    (room) => !myRooms.some((myRoom) => myRoom.id === room.id),
  );

  const handleOpenProfile = async () => {
    try {
      setLoadingProfile(true);

      const data = await getProfile();

      if (!data?.success || !data?.user) {
        toast.error(data?.message || "Unable to load profile");

        return;
      }

      setProfile(data.user);

      setProfileName(data.user.name || "");

      // Clear any previously selected avatar
      setProfileAvatarFile(null);
      setProfileAvatarPreview(null);

      setShowProfileModal(true);
    } catch (error) {
      console.error("Load profile error:", error);

      toast.error(error?.response?.data?.message || "Unable to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    const cleanName = profileName.trim();

    if (!cleanName) {
      toast.error("Name is required");
      return;
    }

    if (cleanName.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    try {
      setSavingProfile(true);

      const data = await updateProfile(cleanName);

      if (!data?.success || !data?.user) {
        toast.error(data?.message || "Unable to update profile");

        return;
      }

      // Update profile displayed in modal
      setProfile(data.user);

      setProfileName(data.user.name || "");
      // Sync updated profile with AuthContext
      updateAuthUser(data.user);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);

      toast.error(error?.response?.data?.message || "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };
  // SELECT PROFILE AVATAR
  const handleProfileAvatarSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WEBP image");

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be smaller than 5 MB");

      e.target.value = "";
      return;
    }

    // Remove previous preview URL
    if (profileAvatarPreview) {
      URL.revokeObjectURL(profileAvatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setProfileAvatarFile(file);

    setProfileAvatarPreview(previewUrl);
  };

  const handleUploadProfileAvatar = async () => {
    if (!profileAvatarFile) {
      toast.error("Please select a profile picture");
      return;
    }

    try {
      setUploadingAvatar(true);

      const data = await updateProfileAvatar(profileAvatarFile);

      if (!data?.success || !data?.user) {
        toast.error(data?.message || "Unable to update profile picture");
        return;
      }

      // Update modal with permanent Cloudinary URL
      setProfile(data.user);
      updateAuthUser(data.user);
      // Clear temporary selected file
      setProfileAvatarFile(null);

      // Remove temporary browser preview
      if (profileAvatarPreview) {
        URL.revokeObjectURL(profileAvatarPreview);
      }

      setProfileAvatarPreview(null);

      // Reset hidden file input
      if (profileAvatarInputRef.current) {
        profileAvatarInputRef.current.value = "";
      }

      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Avatar upload error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to update profile picture",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Offline";

    const date = new Date(lastSeen);
    const now = new Date();

    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);

    // Less than 1 minute
    if (diffMinutes < 1) {
      return "Last seen just now";
    }

    // Less than 1 hour
    if (diffMinutes < 60) {
      return `Last seen ${diffMinutes} minute${
        diffMinutes === 1 ? "" : "s"
      } ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    // Less than 24 hours
    if (diffHours < 24) {
      return `Last seen ${diffHours} hour${
        diffHours === 1 ? "" : "s"
      } ago`;
    }

    // Get start of today
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Get start of last-seen day
    const lastSeenDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const diffDays = Math.floor(
      (today - lastSeenDay) / (1000 * 60 * 60 * 24)
    );

    const time = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    // Yesterday
    if (diffDays === 1) {
      return `Last seen yesterday at ${time}`;
    }

    // Within the last 7 days
    if (diffDays >= 2 && diffDays <= 7) {
      const dayName = date.toLocaleDateString([], {
        weekday: "long",
      });

      return `Last seen ${dayName} at ${time}`;
    }

    // Older than 7 days
    const formattedDate = date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return `Last seen ${formattedDate}, ${time}`;
  };

  const inputPlaceholder =
    chatMode === "private"
      ? `Message ${selectedUser?.name || ""}...`
      : `Message #${selectedRoom?.name || ""}...`;

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    const isNearBottom = distanceFromBottom < 120;

    shouldAutoScrollRef.current = isNearBottom;

    // User has reached the latest messages
    if (
      isNearBottom &&
      !isScrollingToNewRef.current
    ) {
      setNewMessagesStartId(null);
      setNewMessagesCount(0);
    }
  };
  const scrollToNewMessages = () => {
    if (!newMessagesStartId) return;

    const element = document.getElementById(
      `message-${newMessagesStartId}`
    );

    if (!element) return;

    isScrollingToNewRef.current = true;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setTimeout(() => {
      setNewMessagesStartId(null);
      setNewMessagesCount(0);

      isScrollingToNewRef.current = false;

      const container = messagesContainerRef.current;

      if (container) {
        const distanceFromBottom =
          container.scrollHeight -
          container.scrollTop -
          container.clientHeight;

        shouldAutoScrollRef.current =
          distanceFromBottom < 120;
      }
    }, 2000);
  };


  // ==============================
  // UI
  // ==============================

  return (
    <div
      className={`chat-app ${
        chatMode ? "mobile-chat-open" : ""
      }`}
    >
      {/* SIDEBAR */}

      <Sidebar
        search={search}
        setSearch={setSearch}
        filteredUsers={filteredUsers}
        selectedUser={selectedUser}
        chatMode={chatMode}
        unreadPrivate={unreadPrivate}
        onlineUsers={onlineUsers}
        formatLastSeen={formatLastSeen}
        handleSelectUser={handleSelectUser}
        myRooms={myRooms}
        selectedRoom={selectedRoom}
        unreadRooms={unreadRooms}
        handleSelectRoom={handleSelectRoom}
        setShowRoomModal={setShowRoomModal}
        user={user}
        handleLogout={handleLogout}
        handleOpenProfile={handleOpenProfile}
        handleOpenAppearance={() =>
          setShowAppearanceModal(true)
        }
        getInitial={getInitial}
      />

      {/* MAIN CHAT */}

      <main className="chat-main">
        {!chatMode ? (
          <WelcomeScreen />
        ) : (
          <>
            {/* HEADER */}

            <ChatHeader
              chatMode={chatMode}
              selectedUser={selectedUser}
              selectedRoom={selectedRoom}
              onlineUsers={onlineUsers}
              formatLastSeen={formatLastSeen}
              showMessageSearch={showMessageSearch}
              setShowMessageSearch={setShowMessageSearch}
              setMessageSearchQuery={setMessageSearchQuery}
              setMessageSearchResults={setMessageSearchResults}
              setCurrentSearchIndex={setCurrentSearchIndex}
              handleViewMembers={handleViewMembers}
              handleLeaveRoom={handleLeaveRoom}
              handleOpenRoomInfo={handleOpenRoomInfo}
              isRoomCreator={
                chatMode === "room" &&
                selectedRoom?.creatorId === user?.id
              }
              handleOpenRenameModal={() => {
                setNewRoomName(selectedRoom?.name || "");
                setShowRenameModal(true);
              }}
              handleOpenDeleteModal={() =>
                setShowDeleteModal(true)
              }
              handleOpenWallpaper={() =>
                setShowWallpaperModal(true)
              }
              onMobileBack={() => {
                setSelectedUser(null);
                setSelectedRoom(null);
                setChatMode(null);
                setMessages([]);
              }}
            />
            {/* ==========================================
              MESSAGE SEARCH BAR
              ========================================== */}

            {showMessageSearch && (
              <div className="message-search-bar">
                <div className="message-search-input-wrapper">
                  <span className="message-search-icon">🔍</span>

                  <input
                    type="text"
                    className="message-search-input"
                    placeholder="Search messages..."
                    value={messageSearchQuery}
                    onChange={(e) => handleMessageSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        messageSearchResults.length > 0
                      ) {
                        e.preventDefault();

                        if (e.shiftKey) {
                          handlePreviousSearchResult();
                        } else {
                          handleNextSearchResult();
                        }
                      }

                      if (e.key === "Escape") {
                        setShowMessageSearch(false);
                        setMessageSearchQuery("");
                        setMessageSearchResults([]);
                        setCurrentSearchIndex(0);
                      }
                    }}
                    autoFocus
                  />
                </div>

                {/* RESULT COUNTER */}

                {messageSearchQuery.trim() && (
                  <span className="message-search-count">
                    {messageSearchResults.length > 0
                      ? `${currentSearchIndex + 1} / ${
                          messageSearchResults.length
                        }`
                      : "0 results"}
                  </span>
                )}

                {/* PREVIOUS RESULT */}

                <button
                  type="button"
                  className="message-search-nav"
                  onClick={handlePreviousSearchResult}
                  disabled={messageSearchResults.length === 0}
                  title="Previous result"
                >
                  ↑
                </button>

                {/* NEXT RESULT */}

                <button
                  type="button"
                  className="message-search-nav"
                  onClick={handleNextSearchResult}
                  disabled={messageSearchResults.length === 0}
                  title="Next result"
                >
                  ↓
                </button>

                {/* CLOSE SEARCH */}

                <button
                  type="button"
                  className="message-search-close"
                  onClick={() => {
                    setShowMessageSearch(false);
                    setMessageSearchQuery("");
                    setMessageSearchResults([]);
                    setCurrentSearchIndex(0);
                  }}
                  title="Close search"
                >
                  ✕
                </button>
              </div>
            )}

            {/* MESSAGES */}

            <section 
            className="messages-container"
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            style={{
              background: activeWallpaper.value,
            }}
            >
              {loadingMessages ? (
                <div className="messages-loading">
                  <div className="messages-loading-spinner"></div>
                  <span>Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                              <div className="start-conversation">
                  {chatMode === "private" ? (
                    <div className="avatar large">
                      {getInitial(selectedUser?.name)}
                    </div>
                  ) : (
                    <div className="room-empty-icon">
                      <Hash size={30} />
                    </div>
                  )}

                  <h3>
                    {chatMode === "private"
                      ? selectedUser?.name
                      : `#${selectedRoom?.name}`}
                  </h3>

                  <p>
                    {chatMode === "private"
                      ? "This is the beginning of your conversation."
                      : `This is the beginning of the #${selectedRoom?.name} room.`}
                  </p>
                </div>
              ) : (
                messages.map((message,index) => {
                  const currentDate = getDateLabel(message.createdAt);

                  const previousDate =
                    index > 0
                      ? getDateLabel(messages[index - 1].createdAt)
                      : null;

                  const showDateSeparator =
                    index === 0 || currentDate !== previousDate;
                  const showNewMessagesDivider =
                    message.id === newMessagesStartId;
                  return (
                    <div 
                      key={message.id}
                      id={`message-${message.id}`}
                    >
                      {showDateSeparator && (
                        <div className="message-date-separator">
                          <span>{currentDate}</span>
                        </div>
                      )}

                      {showNewMessagesDivider && (
                        <div className="new-messages-divider">
                          <span>New Messages</span>
                        </div>
                      )}
                  <MessageBubble
                    message={message}
                    user={user}
                    chatMode={chatMode}
                    editingMessageId={editingMessageId}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                    handleSaveEdit={handleSaveEdit}
                    handleCancelEdit={handleCancelEdit}
                    showMessageSearch={showMessageSearch}
                    messageSearchQuery={messageSearchQuery}
                    highlightSearchText={highlightSearchText}
                    formatTime={formatTime}
                    formatFileSize={formatFileSize}
                    scrollToOriginalMessage={scrollToOriginalMessage}
                    openMessageMenu={openMessageMenu}
                    setOpenMessageMenu={setOpenMessageMenu}
                    openReactionPicker={openReactionPicker}
                    setOpenReactionPicker={setOpenReactionPicker}
                    handleReaction={handleReaction}
                    handleStartReply={handleStartReply}
                    handleStartEdit={handleStartEdit}
                    handleDeleteMessage={handleDeleteMessage}
                    REACTION_OPTIONS={REACTION_OPTIONS}
                    viewerImage={viewerImage}
                    setViewerImage={setViewerImage}
                    viewerFileName={viewerFileName}
                    setViewerFileName={setViewerFileName}
                  />
                  </div>
                );
              })
              )}

              {chatMode === "private" && typingUser && (
                <div className="typing-indicator">
                  <span className="typing-name">
                    {selectedUser?.name} is typing
                  </span>

                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              {newMessagesCount > 0 && (
                <button
                  className="new-message-floating-btn"
                  onClick={scrollToNewMessages}
                >
                  ↓ {newMessagesCount}{" "}
                  {newMessagesCount === 1
                    ? "New Message"
                    : "New Messages"}
                </button>
              )}
              <div ref={messagesEndRef} />
            </section>

            {/* SELECTED ATTACHMENT PREVIEW */}

            <AttachmentPreview
              selectedFile={selectedFile}
              imagePreviewUrl={imagePreviewUrl}
              uploadingFile={uploadingFile}
              onRemove={removeSelectedFile}
              formatFileSize={formatFileSize}
            />
            {/* MESSAGE FORM */}
            {/* ==========================================
                REPLY PREVIEW
                ========================================== */}

            <ReplyPreview
              replyingTo={replyingTo}
              onCancel={handleCancelReply}
            />
            <MessageInput
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              handleSend={handleSend}
              messageText={messageText}
              handleMessageChange={handleMessageChange}
              inputPlaceholder={inputPlaceholder}
              selectedFile={selectedFile}
              uploadingFile={uploadingFile}
              sending={sending}
            />
          </>
        )}
      </main>

      {/* ROOM MODAL */}

      <RoomModal
        showRoomModal={showRoomModal}
        setShowRoomModal={setShowRoomModal}
        newRoom={newRoom}
        setNewRoom={setNewRoom}
        creatingRoom={creatingRoom}
        handleCreateRoom={handleCreateRoom}
        availableRooms={availableRooms}
        handleJoinRoom={handleJoinRoom}
        joiningRoomId={joiningRoomId}
      />
      <RoomInfoModal
        isOpen={showRoomInfoModal}
        onClose={() =>
          setShowRoomInfoModal(false)
        }
        room={selectedRoom}
        members={roomMembers}
      />
      <ChatWallpaperModal
        isOpen={showWallpaperModal}
        onClose={() =>
          setShowWallpaperModal(false)
        }
        selectedWallpaper={selectedWallpaper}
        onApplyWallpaper={handleSelectWallpaper}
      />
      <AppearanceModal
        isOpen={showAppearanceModal}
        onClose={() =>
          setShowAppearanceModal(false)
        }
        selectedTheme={selectedTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* ==========================================
          USER PROFILE MODAL
          ========================================== */}

      <ProfileModal
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        profile={profile}
        profileName={profileName}
        setProfileName={setProfileName}
        savingProfile={savingProfile}
        handleSaveProfile={handleSaveProfile}
        getInitial={getInitial}
        profileAvatarPreview={profileAvatarPreview}
        profileAvatarFile={profileAvatarFile}
        profileAvatarInputRef={profileAvatarInputRef}
        handleProfileAvatarSelect={handleProfileAvatarSelect}
        handleUploadProfileAvatar={handleUploadProfileAvatar}
        uploadingAvatar={uploadingAvatar}
      />
      <ImageViewer
        imageUrl={viewerImage}
        fileName={viewerFileName}
        onClose={() => {
          setViewerImage(null);
          setViewerFileName("");
        }}
      />
      <RoomMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={roomMembers}
        currentUser={user}
        loading={loadingMembers}
        roomCreatorId={selectedRoom?.creatorId}
        onRemoveMember={handleRemoveMember}
      />
      <RenameRoomModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        roomName={newRoomName}
        setRoomName={setNewRoomName}
        onRename={handleRenameRoom}
      />
      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="rename-room-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>🗑️ Delete Room</h2>

              <button
                className="close-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "20px 0" }}>
              Are you sure you want to delete
              <strong> "{selectedRoom?.name}"</strong>?
              <br />
              <br />
              This action cannot be undone.
            </p>

            <div className="rename-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className="save-btn"
                style={{ background: "#dc2626" }}
                onClick={handleDeleteRoom}
                disabled={deletingRoom}
              >
                {deletingRoom ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
