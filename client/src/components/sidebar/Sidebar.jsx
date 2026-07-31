import SidebarHeader from "./SidebarHeader";
import SidebarSearch from "./SidebarSearch";
import UserList from "./UserList";
import RoomList from "./RoomList";
import CurrentUser from "./CurrentUser";

const Sidebar = ({
  search,
  setSearch,

  filteredUsers,
  selectedUser,
  chatMode,
  unreadPrivate,
  onlineUsers,
  formatLastSeen,
  handleSelectUser,

  myRooms,
  selectedRoom,
  unreadRooms,
  handleSelectRoom,
  setShowRoomModal,

  user,
  handleLogout,
  handleOpenProfile,
  handleOpenAppearance,
  getInitial,
}) => {
  return (
    <aside className="chat-sidebar">
      <SidebarHeader />

      <SidebarSearch
        value={search}
        onChange={setSearch}
      />

      <UserList
        users={filteredUsers}
        selectedUser={selectedUser}
        chatMode={chatMode}
        unreadPrivate={unreadPrivate}
        onlineUsers={onlineUsers}
        formatLastSeen={formatLastSeen}
        onSelectUser={handleSelectUser}
        getInitial={getInitial}
      />

      <RoomList
        myRooms={myRooms}
        selectedRoom={selectedRoom}
        chatMode={chatMode}
        unreadRooms={unreadRooms}
        onSelectRoom={handleSelectRoom}
        onOpenModal={() =>
          setShowRoomModal(true)
        }
      />

      <CurrentUser
        user={user}
        onLogout={handleLogout}
        onOpenProfile={handleOpenProfile}
        onOpenAppearance={handleOpenAppearance}
        getInitial={getInitial}
      />
    </aside>
  );
};

export default Sidebar;