import "./RoomInfoModal.css";

const RoomInfoModal = ({
  isOpen,
  onClose,
  room,
  members,
}) => {
  if (!isOpen || !room) return null;

  const owner = members.find(
    (member) => member.id === room.creatorId
  );

  const createdDate = room.createdAt
    ? new Date(room.createdAt).toLocaleDateString(
        "en-GB",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      )
    : "Unknown";

  return (
    <div
      className="room-info-overlay"
      onClick={onClose}
    >
      <div
        className="room-info-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="room-info-header">
          <h2>Room Info</h2>

          <button
            type="button"
            className="room-info-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="room-info-icon">
          #
        </div>

        <h3>{room.name}</h3>

        <div className="room-info-details">
          <div className="room-info-row">
            <span>Description</span>
            <strong>
              {room.description ||
                "No description"}
            </strong>
          </div>

          <div className="room-info-row">
            <span>Owner</span>
            <strong>
              {owner?.name || "Unknown"}
            </strong>
          </div>

          <div className="room-info-row">
            <span>Members</span>
            <strong>{members.length}</strong>
          </div>

          <div className="room-info-row">
            <span>Created</span>
            <strong>{createdDate}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomInfoModal;