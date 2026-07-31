import "./RoomMembersModal.css";

const RoomMembersModal = ({
  isOpen,
  onClose,
  members,
  currentUser,
  loading,
  roomCreatorId,
  onRemoveMember,
}) => {
  if (!isOpen) return null;
  const isRoomCreator =
    currentUser?.id === roomCreatorId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="room-members-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>👥 Room Members</h2>

          <button
            className="close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <p className="member-count">
          Total Members: {members.length}
        </p>

        {loading ? (
          <div className="loading-members">
            Loading...
          </div>
        ) : (
          <div className="members-list">
            {members.map((member) => (
              <div
                key={member.id}
                className="member-card"
              >
                <img
                  src={
                    member.avatar ||
                    "/default-avatar.png"
                  }
                  alt={member.name}
                  className="member-avatar"
                />

                <div className="member-info">
                  <div className="member-name">
                    {member.name}

                    {member.id === currentUser?.id && (
                      <span className="you-badge">
                        You
                      </span>
                    )}

                    {member.id === roomCreatorId && (
                      <span className="owner-badge">
                        Owner
                      </span>
                    )}
                  </div>
                  

                  <div className="member-email">
                    {member.email}
                  </div>
                </div>
                {isRoomCreator &&
                    member.id !== roomCreatorId && (
                      <button
                        type="button"
                        className="remove-member-btn"
                        onClick={() =>
                          onRemoveMember(member.id)
                        }
                      >
                        Remove
                      </button>
                    )}
              </div>
            ))}

            {!members.length && (
              <p className="empty-members">
                No members found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomMembersModal;