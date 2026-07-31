const MessageActions = ({
  isOwnMessage,
  onReply,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="message-actions">
      <button
        type="button"
        onClick={onReply}
      >
        Reply
      </button>

      {isOwnMessage && (
        <>
          <button
            type="button"
            onClick={onEdit}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onDelete}
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
};

export default MessageActions;