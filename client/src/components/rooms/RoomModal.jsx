import { Hash, Plus, Users, X } from "lucide-react";

const RoomModal = ({
  showRoomModal,
  setShowRoomModal,
  newRoom,
  setNewRoom,
  creatingRoom,
  handleCreateRoom,
  availableRooms,
  handleJoinRoom,
  joiningRoomId,
}) => {
  if (!showRoomModal) {
    return null;
  }

  return (
    <div
      className="room-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setShowRoomModal(false);
        }
      }}
    >
      <div className="room-modal">
        <div className="room-modal-header">
          <div>
            <h2>Chat Rooms</h2>

            <p>
              Create a room or join an existing
              community.
            </p>
          </div>

          <button
            type="button"
            className="room-modal-close"
            onClick={() =>
              setShowRoomModal(false)
            }
          >
            <X size={20} />
          </button>
        </div>

        {/* CREATE ROOM */}

        <form
          className="create-room-form"
          onSubmit={handleCreateRoom}
        >
          <h3>Create a room</h3>

          <input
            type="text"
            placeholder="Room name"
            value={newRoom.name}
            onChange={(e) =>
              setNewRoom((current) => ({
                ...current,
                name: e.target.value,
              }))
            }
            maxLength={50}
          />

          <textarea
            placeholder="Description (optional)"
            value={newRoom.description}
            onChange={(e) =>
              setNewRoom((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
            maxLength={200}
          />

          <button
            type="submit"
            disabled={
              creatingRoom ||
              !newRoom.name.trim()
            }
          >
            <Plus size={17} />

            {creatingRoom
              ? "Creating..."
              : "Create Room"}
          </button>
        </form>

        {/* AVAILABLE ROOMS */}

        <div className="available-rooms-section">
          <div className="available-rooms-heading">
            <h3>Available rooms</h3>

            <span>
              {availableRooms.length}
            </span>
          </div>

          {availableRooms.length === 0 ? (
            <div className="no-available-rooms">
              <Users size={28} />

              <p>
                You have joined all available
                rooms.
              </p>
            </div>
          ) : (
            <div className="available-room-list">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className="available-room-item"
                >
                  <div className="available-room-icon">
                    <Hash size={20} />
                  </div>

                  <div className="available-room-info">
                    <strong>{room.name}</strong>

                    <span>
                      {room.description ||
                        "No description"}
                    </span>

                    <small>
                      {room._count?.members ||
                        0}{" "}
                      members
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleJoinRoom(room)
                    }
                    disabled={
                      joiningRoomId ===
                      room.id
                    }
                  >
                    {joiningRoomId === room.id
                      ? "Joining..."
                      : "Join"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomModal;