import { Hash, MoreVertical, LogOut, ArrowLeft, Image } from "lucide-react";
import { useState } from "react";

const ChatHeader = ({
  chatMode,
  selectedUser,
  selectedRoom,
  onlineUsers,
  formatLastSeen,
  showMessageSearch,
  setShowMessageSearch,
  setMessageSearchQuery,
  setMessageSearchResults,
  setCurrentSearchIndex,
  handleViewMembers,
  handleOpenRoomInfo,
  handleLeaveRoom,
  isRoomCreator,
  handleOpenRenameModal,
  handleOpenDeleteModal,
  onMobileBack,
  handleOpenWallpaper,
}) => {
  const [showRoomMenu, setShowRoomMenu] =
  useState(false);

  return (
    <header className="conversation-header">
      <button
        type="button"
        className="mobile-chat-back"
        onClick={onMobileBack}
        aria-label="Back to conversations"
      >
        <ArrowLeft size={21} />
      </button>
      {chatMode === "private" ? (
        <>
          <div className="avatar">
            {selectedUser?.avatar ? (
              <img
                src={selectedUser.avatar}
                alt={selectedUser?.name || "Profile"}
                className="avatar-image"
              />
            ) : (
              selectedUser?.name?.charAt(0)?.toUpperCase() || "?"
            )}
          </div>

          <div>
            <h2>{selectedUser?.name}</h2>

            <span
              className={
                onlineUsers.includes(selectedUser?.id)
                  ? "chat-user-status online"
                  : "chat-user-status"
              }
            >
              {onlineUsers.includes(selectedUser?.id) && (
                <span className="online-dot"></span>
              )}

              {onlineUsers.includes(selectedUser?.id)
                ? "Online"
                : formatLastSeen(selectedUser?.lastSeen)}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="room-header-icon">
            <Hash size={21} />
          </div>

          <div className="room-header-details">
            <h2>{selectedRoom?.name}</h2>

            <div className="room-header-meta">
              <span className="room-member-count">
                {selectedRoom?._count?.members || 0} members
              </span>

              {selectedRoom?.description && (
                <>
                  <span className="room-meta-dot">•</span>

                  <span className="room-header-description">
                    {selectedRoom.description}
                  </span>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div className="chat-header-actions">
        <button
          type="button"
          className="message-search-button"
          onClick={handleOpenWallpaper}
          title="Chat wallpaper"
          aria-label="Chat wallpaper"
        >
          <Image size={19} />
        </button>
        <button
          type="button"
          className="message-search-button"
          onClick={() => {
            setShowMessageSearch((current) => !current);

            if (showMessageSearch) {
              setMessageSearchQuery("");
              setMessageSearchResults([]);
              setCurrentSearchIndex(0);
            }
          }}
          title="Search messages"
        >
          🔍
        </button>

        {chatMode === "room" && (
          <div className="room-menu-wrapper">

            <button
              className="room-menu-button"
              onClick={() =>
                setShowRoomMenu(!showRoomMenu)
              }
            >
              <MoreVertical size={20} />
            </button>

            {showRoomMenu && (
              <div className="room-menu">
                <button
                  className="room-menu-item"
                  onClick={() => {
                    handleOpenRoomInfo();
                    setShowRoomMenu(false);
                  }}
                >
                  ℹ️ Room Info
                </button>
                <button
                  className="room-menu-item"
                  onClick={() => {
                    handleViewMembers();
                    setShowRoomMenu(false);
                  }}
                >
                  👥 Members
                </button>
                {isRoomCreator && (
                  <button
                    className="room-menu-item"
                    onClick={() => {
                      handleOpenRenameModal();
                      setShowRoomMenu(false);
                    }}
                  >
                    ✏️ Rename Room
                  </button>
                )}
                {isRoomCreator && (
                  <button
                    className="room-menu-item delete"
                    onClick={() => {
                      handleOpenDeleteModal();
                      setShowRoomMenu(false);
                    }}
                  >
                    🗑️ Delete Room
                  </button>
                )}
                <button
                  className="room-menu-item leave"
                  onClick={() => {
                    setShowRoomMenu(false);
                    handleLeaveRoom();
                  }}
                >
                  <LogOut size={16} />
                  Leave Room
                </button>

              </div>
            )}

          </div>
        )}

      </div>
    </header>
  );
};

export default ChatHeader;