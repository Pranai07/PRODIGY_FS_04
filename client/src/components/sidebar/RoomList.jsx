import { Plus } from "lucide-react";

const RoomList = ({
  myRooms,
  selectedRoom,
  chatMode,
  unreadRooms,
  onSelectRoom,
  onOpenModal,
}) => {
  return (
    <div className="rooms-section">
      <div className="rooms-heading">
        <span>Rooms</span>

        <button
          type="button"
          className="add-room-button"
          onClick={onOpenModal}
          title="Browse or create rooms"
        >
          <Plus size={17} />
        </button>
      </div>

      <div className="room-list">
        {myRooms.length === 0 ? (
          <p className="empty-rooms">
            No rooms joined yet.
          </p>
        ) : (
          myRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`room-item ${
                chatMode === "room" &&
                selectedRoom?.id === room.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                onSelectRoom(room)
              }
            >
              <span className="room-hash">
                #
              </span>

              <div className="room-details">
                <strong>{room.name}</strong>

                <span>
                  {room._count?.members ||
                    0}{" "}
                  members
                </span>
              </div>

              {unreadRooms[room.id] >
                0 && (
                <span className="unread-badge">
                  {unreadRooms[
                    room.id
                  ] > 99
                    ? "99+"
                    : unreadRooms[
                        room.id
                      ]}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;