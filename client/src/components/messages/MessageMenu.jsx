import {
  Reply,
  Pencil,
  Trash2,
} from "lucide-react";

const MessageMenu = ({
  message,
  mine,
  openMessageMenu,
  setOpenMessageMenu,
  setOpenReactionPicker,
  handleStartReply,
  handleStartEdit,
  handleDeleteMessage,
  handleReaction,
  REACTION_OPTIONS,
}) => {
  if (message.isDeleted) return null;

  return (
    <div className="message-menu-wrapper">
      <button
        type="button"
        className="message-menu-trigger"
        onClick={() => {
          setOpenMessageMenu(
            openMessageMenu === message.id ? null : message.id
          );
          setOpenReactionPicker(null);
        }}
      >
        ⋮
      </button>

      {openMessageMenu === message.id && (
        <div
          className={`message-menu ${
            mine ? "message-menu-left" : "message-menu-right"
          }`}
        >
          <div className="message-menu-reactions">
            {REACTION_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                className="reaction-item"
                onClick={() => {
                  handleReaction(message.id, emoji);
                  setOpenMessageMenu(null);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          <button
            className="message-menu-item"
            onClick={() => {
              handleStartReply(message);
              setOpenMessageMenu(null);
            }}
          >
            <Reply size={16} />
            <span>Reply</span>
          </button>

          {mine && message.messageType === "text" && (
            <button
              className="message-menu-item"
              onClick={() => {
                handleStartEdit(message);
                setOpenMessageMenu(null);
              }}
            >
              <Pencil size={16} />
              <span>Edit</span>
            </button>
          )}

          {mine && (
            <button
              className="message-menu-item delete"
              onClick={() => {
                handleDeleteMessage(message.id);
                setOpenMessageMenu(null);
              }}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageMenu;