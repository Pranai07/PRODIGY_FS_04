import "./RenameRoomModal.css";

const RenameRoomModal = ({
  isOpen,
  onClose,
  roomName,
  setRoomName,
  onRename,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="rename-room-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>✏️ Rename Room</h2>

          <button
            className="close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="rename-body">
          <label>Room Name</label>

          <input
            type="text"
            value={roomName}
            onChange={(e) =>
              setRoomName(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRename();
              }
            }}
            placeholder="Enter room name"
            maxLength={50}
            autoFocus
          />
        </div>

        <div className="rename-actions">
          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="save-btn"
            onClick={onRename}
            disabled={!roomName.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameRoomModal;