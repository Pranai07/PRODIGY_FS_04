const UserList = ({
  users,
  selectedUser,
  chatMode,
  unreadPrivate,
  onlineUsers,
  formatLastSeen,
  onSelectUser,
  getInitial,
}) => {
  return (
    <>
      <div className="sidebar-label">
        People 
      </div>

      <div className="user-list">
        {users.length === 0 ? (
          <p className="empty-users">
            No other users found.
          </p>
        ) : (
          users.map((chatUser) => {
            const isOnline =
              onlineUsers.includes(chatUser.id);

            return (
              <button
                key={chatUser.id}
                type="button"
                className={`user-item ${
                  chatMode === "private" &&
                  selectedUser?.id === chatUser.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  onSelectUser(chatUser)
                }
              >
                <div className="avatar-wrapper">
                  <div className="avatar">
                    {chatUser.avatar ? (
                      <img
                        src={chatUser.avatar}
                        alt={chatUser.name}
                        className="avatar-image"
                      />
                    ) : (
                      getInitial(chatUser.name)
                    )}
                  </div>

                  <span
                    className={`status-dot ${
                      isOnline ? "online" : ""
                    }`}
                  />
                </div>

                <div className="user-details">
                  <strong>
                    {chatUser.name}
                  </strong>

                  <span
                    className={`user-presence ${
                      isOnline ? "online" : "offline"
                    }`}
                  >
                    {isOnline
                      ? "Online"
                      : formatLastSeen(chatUser.lastSeen)}
                  </span>
                </div>

                {unreadPrivate[chatUser.id] >
                  0 && (
                  <span className="unread-badge">
                    {unreadPrivate[
                      chatUser.id
                    ] > 99
                      ? "99+"
                      : unreadPrivate[
                          chatUser.id
                        ]}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </>
  );
};

export default UserList;