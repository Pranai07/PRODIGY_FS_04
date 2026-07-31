const ReplyPreview = ({
  replyingTo,
  onCancel,
}) => {
  if (!replyingTo) {
    return null;
  }

  return (
    <div className="reply-preview">
      <div className="reply-preview-content">
        <span className="reply-preview-title">
          ↩ Replying to{" "}
          {replyingTo.sender?.name || "User"}
        </span>

        <span className="reply-preview-message">
          {replyingTo.isDeleted
            ? "This message was deleted"
            : replyingTo.messageType === "image"
            ? "📷 Photo"
            : replyingTo.messageType === "file"
            ? `📎 ${
                replyingTo.fileName ||
                "Attachment"
              }`
            : replyingTo.content}
        </span>
      </div>

      <button
        type="button"
        className="reply-preview-close"
        onClick={onCancel}
        title="Cancel reply"
      >
        ✕
      </button>
    </div>
  );
};

export default ReplyPreview;